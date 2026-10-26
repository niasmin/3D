import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import profiles from './skill-profiles.json' with {type:'json'};

// Presentation only. Damage, healing and target selection belong to the original simulator.
export const SKILLS=Object.freeze(Object.fromEntries(Object.entries(profiles).map(([id,p])=>[id,Object.freeze({...p,id})])));
export const skillProfile=id=>SKILLS[id]||null;
const clamp=T.MathUtils.clamp,UP=new T.Vector3(0,1,0),FORWARD=new T.Vector3(0,0,1);
export function skillPlan(id,{tier=1,quality='standard',reducedMotion=false,targetCount=1}={}){
 const p=skillProfile(id);if(!p)throw new Error(`Missing skill profile: ${id}`);
 tier=clamp(Math.trunc(tier)||1,1,3);const low=quality==='low';
 return {id,variant:p.variant,tier,cast:p.cast,travel:p.travel,impact:p.impact,reducedMotion,
  scale:1+(tier-1)*.10,particles:reducedMotion?0:low?8:20+tier*4,
  count:reducedMotion?1:Math.min(p.count+tier-1,low?5:20),segments:low?16:32,
  targets:clamp(Math.trunc(targetCount)||1,1,12),maxActive:low||reducedMotion?1:3};
}
function seedOf(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function glowTexture(){
 const n=32,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const r=Math.hypot((x+0.5)/n*2-1,(y+0.5)/n*2-1),i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.max(0,1-r)**2.2);}
 const t=new T.DataTexture(data,n,n);t.magFilter=t.minFilter=T.LinearFilter;t.needsUpdate=true;return t;
}
function destroy(group){
 const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of [].concat(o.material))materials.add(m);});
 group.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
}
function arrowGeometry(blade=false){
 const a=new T.CylinderGeometry(blade?.035:.015,blade?.035:.015,.70,5);a.rotateX(Math.PI/2);
 const b=new T.ConeGeometry(blade?.115:.065,blade?.45:.20,blade?4:5);b.rotateX(Math.PI/2);b.translate(0,0,.43);
 const c=mergeGeometries([a,b]);a.dispose();b.dispose();return c;
}
function petalGeometry(){
 const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-.20,.12,-.18,.40,0,.55);s.bezierCurveTo(.18,.40,.20,.12,0,0);
 const g=new T.ShapeGeometry(s,5);g.translate(0,-.22,0);return g;
}

class Sequence{
 constructor(director,args){
  this.director=director;this.p=skillProfile(args.id);this.plan=skillPlan(args.id,{...director.options,tier:args.tier,targetCount:args.targets.length});this.args=args;
  this.start=performance.now();this.dt=Math.max(100,args.dt||1200);this.impactTime=null;this.released=false;this.disposed=false;
  this.source=args.source().clone();this.targets=args.targets.map(t=>({position:t.position.clone(),heal:!!t.heal}));
  if(!this.targets.length)this.targets=[{position:this.source.clone().add(new T.Vector3(0,0,3)),heal:false}];
  this.primary=this.targets[0].position.clone();this.random=rng(seedOf(this.p.variant));this.materials=[];this.updaters=[];
  this.group=new T.Group();this.group.name='skill:'+args.id;director.scene.add(this.group);
  this.cast=new T.Group();this.cast.name='cast';this.cast.position.copy(this.source);this.group.add(this.cast);
  this.flight=new T.Group();this.flight.name='release';this.group.add(this.flight);this.flight.visible=false;
  this.burst=new T.Group();this.burst.name='impact';this.group.add(this.burst);this.burst.visible=false;
  this.makeCast();this.makeFlight();this.makeImpact();this.makeParticles();
 }
 mat(color=this.p.color,opacity=.8,solid=false){
  opacity*=solid?1:.62;
  const m=new T.MeshBasicMaterial({color,transparent:true,opacity,blending:solid?T.NormalBlending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false});m.userData.baseOpacity=opacity;this.materials.push(m);return m;
 }
 mesh(parent,g,m,pos=[0,0,0]){const o=new T.Mesh(g,m);o.position.set(...pos);o.castShadow=o.receiveShadow=false;parent.add(o);return o;}
 line(parent,points,color=this.p.color,width=.018,opacity=.75){
  const pts=points.map(p=>p.isVector3?p:new T.Vector3(...p));
  return this.mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(pts),Math.max(8,Math.min(this.plan.segments,pts.length*3)),width,4,false),this.mat(color,opacity));
 }
 ring(parent,r,color=this.p.color,y=.10,arc=Math.PI*2){
  const m=this.mesh(parent,new T.TorusGeometry(r,.018,5,this.plan.segments,arc),this.mat(color,.75),[0,y,0]);m.rotation.x=Math.PI/2;return m;
 }
 sphere(parent,p,r,color=this.p.color,scale=[1,1,1],solid=true){const o=this.mesh(parent,new T.SphereGeometry(r,10,7),this.mat(color,solid?.9:.75,solid),p);o.scale.set(...scale);return o;}
 boxes(parent,items,color=this.p.accent){
  if(!items.length)return;
  const m=new T.InstancedMesh(new T.BoxGeometry(1,1,1),this.mat(color,.65),items.length);parent.add(m);const o=new T.Object3D();
  items.forEach((b,i)=>{o.position.set(...b.p);o.scale.set(...b.s);o.rotation.set(0,b.a||0,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.instanceMatrix.needsUpdate=true;return m;
 }
 rune(parent,kind,r=.9){
  this.ring(parent,r);this.ring(parent,r*.78,this.p.accent,.12);
  const items=[];const n=kind==='bagua'?8:kind==='gear'?12:kind==='moon'?3:6;
  for(let i=0;i<n;i++){
   const a=i*2*Math.PI/n,rad=r*.90;items.push({p:[Math.sin(a)*rad,.11,Math.cos(a)*rad],s:[.13,.025,.025],a});
   if(kind==='bagua')for(let j=0;j<3;j++){
    const dist=r*(.56+j*.08);items.push({p:[Math.sin(a)*dist,.13,Math.cos(a)*dist],s:[i%2&&j===1?.09:.19,.02,.022],a});
   }
  }
  this.boxes(parent,items);
  if(kind==='seal'||kind==='shield'){
   const pts=[[-.36,.13,-.36],[.36,.13,-.36],[.36,.13,.36],[-.36,.13,.36],[-.36,.13,-.36]];this.line(parent,pts,this.p.accent,.014);
  }
  if(kind==='moon'){const crescent=this.mesh(parent,new T.TorusGeometry(.44,.065,6,32,Math.PI*1.45),this.mat(this.p.accent,.8),[0,.14,0]);crescent.rotation.x=Math.PI/2;}
 }
 makeCast(){
  const g=this.cast;this.rune(g,this.p.cast,.72*this.plan.scale);
  if(this.plan.reducedMotion)return;
  if(['banner','shield'].includes(this.p.cast)){
   for(const sign of [-1,1]){
    this.mesh(g,new T.CylinderGeometry(.018,.018,1.6,6),this.mat(this.p.accent,.7),[sign*.7,.85,.15]);
    const flag=this.mesh(g,new T.PlaneGeometry(.52,.72,4,3),this.mat(this.p.color,.42),[sign*.46,1.25,.15]);flag.rotation.y=sign*.25;
    this.line(g,[[sign*.7,1.6,.14],[sign*.23,1.6,.14],[sign*.23,.92,.14]],this.p.accent,.012);
   }
  }else if(this.p.cast==='scroll'){
   const book=this.mesh(g,new T.PlaneGeometry(.88,.6,2,2),this.mat(this.p.accent,.5),[0,1.3,-.18]);book.rotation.x=-.4;
   for(const sign of [-1,1])this.mesh(g,new T.CylinderGeometry(.045,.045,.68,7),this.mat(this.p.accent,.8),[sign*.46,1.3,-.18]);
   for(let j=0;j<4;j++)this.line(g,[[-.32,1.12+j*.10,-.22],[.26-(j%2)*.15,1.12+j*.10,-.22]],this.p.color,.008);
  }else if(this.p.cast==='drum'){
   for(let j=0;j<3;j++)this.ring(g,.30+j*.20,this.p.accent,.3+j*.15,Math.PI*1.6);
  }else if(['flame','water','shadow'].includes(this.p.cast)){
   for(let j=0;j<3;j++){
    const pts=[];for(let i=0;i<22;i++){const t=i/21,a=t*Math.PI*2+j*Math.PI*2/3;pts.push([Math.cos(a)*(.6-t*.3),.15+t*1.8,Math.sin(a)*(.6-t*.3)]);}
    this.line(g,pts,j%2?this.p.accent:this.p.color,.022,.55);
   }
  }else if(['lotus','petals'].includes(this.p.cast))this.lotus(g,.62,.20);
  else if(this.p.cast==='stars')this.star(g,.68,.22);
 }
 star(g,r,y){
  const pts=[];for(let i=0;i<=10;i++){const a=i*Math.PI/5,rad=i%2?r*.45:r;pts.push([Math.sin(a)*rad,y,Math.cos(a)*rad]);}this.line(g,pts,this.p.accent,.014);
 }
 lotus(g,r,y){
  const n=this.plan.count>8?12:8,m=new T.InstancedMesh(petalGeometry(),this.mat(this.p.color,.5),n);g.add(m);const o=new T.Object3D();
  for(let i=0;i<n;i++){const a=i*Math.PI*2/n;o.position.set(Math.sin(a)*r*.45,y,Math.cos(a)*r*.45);o.rotation.set(-Math.PI*.30,a,0);o.scale.set(r,r*1.3,r);o.updateMatrix();m.setMatrixAt(i,o.matrix);}return m;
 }
 monster(kind){
  const g=new T.Group();const c=this.p.color,a=this.p.accent;
  if(kind==='dragon'||kind==='serpent'){
   const n=this.director.options.quality==='low'?12:22;
   const body=new T.InstancedMesh(new T.SphereGeometry(1,8,5),this.mat(c,.65,true),n);g.add(body);const o=new T.Object3D();
   for(let i=0;i<n;i++){const t=i/(n-1);o.position.set(Math.sin(t*6)*.20,Math.cos(t*4)*.12,-t*2.5);o.scale.setScalar(.22*(1-t*.84));o.updateMatrix();body.setMatrixAt(i,o.matrix);}
   this.line(g,[[0,.19,0],[.12,.28,-.5],[-.18,.27,-1.2],[.02,.12,-2.4]],a,.025);
   for(let j=0;j<8;j++){const z=-j*.23;const spike=this.mesh(g,new T.ConeGeometry(.045,.17,4),this.mat(a,.8),[Math.sin(j*.6)*.15,.29,z]);spike.rotation.z=.2;}
   if(kind==='serpent'){this.sphere(g,[0,0,.14],.27,c,[1,.65,1.4]);this.line(g,[[0,-.04,.42],[0,-.08,.66],[.09,-.08,.75]],a,.012);}
   else{
    this.sphere(g,[0,0,.13],.30,c,[1,.72,1.2]);this.sphere(g,[0,-.06,.40],.20,c,[.85,.65,1.3]);
    this.sphere(g,[0,-.12,.52],.11,'#152c28',[1,.3,1],true);
    for(const sign of [-1,1]){
     this.line(g,[[sign*.18,.16,0],[sign*.30,.46,-.16],[sign*.39,.57,-.32]],a,.035);
     this.line(g,[[sign*.30,.40,-.13],[sign*.46,.49,-.07]],a,.018);
     this.sphere(g,[sign*.19,.10,.32],.055,a,[1,.7,.9],true);
     this.line(g,[[sign*.12,.19,.32],[sign*.27,.21,.17]],a,.025);
     this.line(g,[[sign*.14,-.04,.48],[sign*.40,-.10,.55],[sign*.60,.02,.29]],a,.012);
     for(let j=0;j<2;j++){
      const z=-.55-j*.85;this.line(g,[[sign*.10,-.06,z],[sign*.38,-.28,z+.13],[sign*.43,-.43,z+.38]],c,.052);
      for(let k=0;k<3;k++)this.line(g,[[sign*.43,-.43,z+.35],[sign*(.32+k*.09),-.47,z+.55]],a,.012);
     }
    }
   }
  }else if(kind==='tiger'||kind==='wolf'){
   const wolf=kind==='wolf';this.sphere(g,[0,0,-.38],.38,c,[.8,.85,1.55]);
   this.sphere(g,[0,.13,.24],.36,c,[wolf?.8:1.05,1,1]);this.sphere(g,[0,.01,.52],.21,a,[wolf?.65:1.15,.60,wolf?1.4:1]);
   this.sphere(g,[0,-.08,.62],.14,'#20172d',[1,.6,.5],true);
   for(const sign of [-1,1]){
    const ear=this.mesh(g,new T.ConeGeometry(.13,wolf?.40:.23,4),this.mat(c,.8),[sign*.23,.47,.12]);ear.rotation.z=sign*.3;
    this.sphere(g,[sign*.19,.23,.50],.055,a,[1.1,.5,.7],true);
    this.line(g,[[sign*.05,.34,.48],[sign*.23,.39,.41],[sign*.30,.32,.30]],a,.018);
    for(let j=0;j<2;j++){
     this.line(g,[[sign*.20,-.05,-.20-j*.60],[sign*.35,-.42,.10-j*.65],[sign*.35,-.50,.43-j*.65]],c,.085);
     for(let k=0;k<3;k++)this.line(g,[[sign*.35+(k-1)*.055,-.50,.38-j*.65],[sign*.35+(k-1)*.055,-.52,.55-j*.65]],a,.014);
    }
    if(!wolf)for(let j=0;j<3;j++)this.line(g,[[sign*.10,.33-j*.06,.53],[sign*.23,.29-j*.06,.50],[sign*.30,.20-j*.06,.40]],c,.025);
    this.line(g,[[sign*.15,-.05,.64],[sign*.15,-.20,.64]],'#fff3c9',.025);
   }
   this.line(g,[[0,.10,-.80],[.35,.28,-1.2],[.48,.43,-1.6]],a,.055);
  }else if(kind==='phoenix'){
   this.sphere(g,[0,0,-.10],.22,c,[.8,1,1.7]);this.sphere(g,[0,.18,.30],.15,a,[.8,1,1.1]);
   const beak=this.mesh(g,new T.ConeGeometry(.07,.25,4),this.mat(a,.9),[0,.13,.52]);beak.rotation.x=Math.PI/2;
   for(const sign of [-1,1]){
    this.sphere(g,[sign*.085,.22,.40],.025,'#251e2a',[1,1,1],true);
    const n=this.director.options.quality==='low'?6:11;
    for(let j=0;j<n;j++){
     const t=j/(n-1);this.line(g,[[sign*.14,0,-.12],[sign*(.55+t*.32),.18+t*.10,-.15-t*.18],[sign*(1.1+t*.45),.30+t*.25,-.1-t*.65]],j%2?c:a,.045-t*.015,.75);
    }
    for(let j=0;j<3;j++)this.line(g,[[sign*.08,-.02,-.38],[sign*(.30+j*.10),-.12,-1.0],[sign*(.20+j*.20),.13,-1.75-j*.10]],j%2?c:a,.035);
   }
   this.line(g,[[0,.25,.29],[0,.50,.14],[0,.61,-.03]],c,.028);
  }else if(kind==='horse'){
   this.sphere(g,[0,0,-.35],.30,c,[.8,1,1.8]);this.sphere(g,[0,.32,.10],.21,c,[.8,1.7,.7]);this.sphere(g,[0,.58,.34],.18,c,[.8,1,1.4]);
   this.sphere(g,[0,.50,.51],.12,a,[.85,.7,1.2]);
   for(const sign of [-1,1]){
    const ear=this.mesh(g,new T.ConeGeometry(.055,.24,5),this.mat(a,.8),[sign*.10,.81,.22]);ear.rotation.z=sign*.25;
    this.sphere(g,[sign*.13,.65,.36],.025,'#171e2b',[1,1,1],true);
    for(let j=0;j<2;j++)this.line(g,[[sign*.19,-.15,-.1-j*.55],[sign*.22,-.42,.2-j*.8],[sign*.22,-.64,.40-j*.7]],c,.065);
   }
   this.line(g,[[0,.75,.20],[0,.52,-.06],[0,.10,-.36]],a,.07);
   this.line(g,[[0,.12,-.82],[.25,.08,-1.06],[.48,.18,-1.35]],a,.05);
  }else if(kind==='elephant'){
   this.sphere(g,[0,0,-.45],.48,c,[1,1,1.5]);this.sphere(g,[0,.03,.23],.35,c,[1,1.1,1]);
   for(const sign of [-1,1]){
    this.sphere(g,[sign*.36,.08,.15],.28,c,[.4,1.2,.9]);this.line(g,[[sign*.21,-.12,.45],[sign*.30,-.28,.72],[sign*.28,-.03,.89]],a,.07);
    for(let j=0;j<2;j++)this.line(g,[[sign*.29,-.17,-.1-j*.65],[sign*.30,-.70,-.08-j*.65]],c,.13);
   }
   this.line(g,[[0,-.08,.48],[0,-.50,.68],[0,-.62,.90],[0,-.38,1.02]],c,.13);
  }
  return g;
 }
 projectileCloud(g,mode){
  const n=this.plan.count,geo=['arrows','spears','swords','blades'].includes(mode)?arrowGeometry(mode!=='arrows'):mode==='crystals'?new T.OctahedronGeometry(.15,0):mode==='rocks'||mode==='meteors'?new T.IcosahedronGeometry(.16,0):new T.OctahedronGeometry(.10,0);
  const cloud=new T.InstancedMesh(geo,this.mat(this.p.color,.9),n);g.add(cloud);const o=new T.Object3D();
  const spread=mode==='arrows'?.85:mode==='spears'?.52:.65;
  for(let i=0;i<n;i++){
   const a=i*2*Math.PI/n;let x=Math.sin(a)*spread,y=Math.cos(a)*spread*.55,z=-i*.10;
   if(['dingjun-volley','jizhou-barrage','dongxing-snow','ten-victories'].includes(this.p.variant)){x=(i-(n-1)/2)*.22;y=.2+Math.sin(i)*.20;}
   o.position.set(x,y,z);o.rotation.set(mode==='swords'?Math.PI:0,mode==='blades'?a:0,mode==='blades'?a:0);o.scale.setScalar(1+(this.plan.tier-1)*.10);o.updateMatrix();cloud.setMatrixAt(i,o.matrix);
  }
  const pts=[];for(let i=0;i<12;i++){const t=i/11;pts.push([Math.sin(t*4)*.08,0,-t*1.1]);}this.line(g,pts,this.p.accent,.018,.6);
 }
 makeFlight(){
  const g=this.flight,mode=this.p.travel;
  if(this.plan.reducedMotion){this.ring(g,.55,this.p.color,.1);return;}
  if(['dragon','serpent','tiger','wolf','phoenix','horse','elephant'].includes(mode)){
   g.add(this.monster(mode));
   if(mode==='horse'&&this.plan.count>3&&this.director.options.quality!=='low'){
    for(const sign of [-1,1]){const echo=this.monster(mode);echo.scale.setScalar(.63);echo.position.set(sign*.80,-.07,-.60);g.add(echo);}
   }
  }else if(['twins','crescent','axes'].includes(mode)){
   const n=mode==='twins'||mode==='axes'?2:Math.min(3,this.plan.count);
   for(let j=0;j<n;j++){
    const arc=this.mesh(g,new T.TorusGeometry(.62+j*.10,mode==='axes'?.065:.030,5,this.plan.segments,Math.PI*1.45),this.mat(j%2?this.p.accent:this.p.color,.85));arc.rotation.set(.3+j*.8,.15,j*Math.PI/2);arc.position.x=(j-(n-1)/2)*.45;
    if(mode==='axes'){
     const h=this.mesh(g,new T.CylinderGeometry(.025,.025,1.2,5),this.mat(this.p.accent,.8));h.rotation.z=j?-.6:.6;
    }
   }
  }else if(['arrows','spears','swords','blades','crystals','rocks','meteors'].includes(mode))this.projectileCloud(g,mode);
  else if(mode==='lightning'){
   for(let j=0;j<this.plan.count;j++){
    const pts=[];for(let k=0;k<10;k++)pts.push([(this.random()-.5)*.28+(j-(this.plan.count-1)/2)*.25,k*.07,-k*.16]);this.line(g,pts,j%2?this.p.accent:this.p.color,.025,.9);
   }
  }else if(mode==='wind'||mode==='water'||mode==='flames'||mode==='sound'){
   for(let j=0;j<Math.min(5,this.plan.count);j++){
    const pts=[];for(let k=0;k<28;k++){const t=k/27,a=t*Math.PI*3+j*2*Math.PI/3,r=.35+t*.30;pts.push([Math.cos(a)*r,Math.sin(a)*r,-t*1.8]);}
    this.line(g,pts,j%2?this.p.accent:this.p.color,mode==='sound'?.018:.035,mode==='water'?.5:.7);
   }
   if(mode==='sound')for(let j=0;j<3;j++){const ring=this.ring(g,.45+j*.24,this.p.accent,0,Math.PI*1.8);ring.rotation.x=0;ring.position.z=-j*.30;}
  }else if(mode==='chain'){
   for(let j=0;j<Math.min(12,this.plan.count+3);j++){
    const link=this.mesh(g,new T.TorusGeometry(.115,.022,5,12),this.mat(j%2?this.p.accent:this.p.color,.8),[Math.sin(j*.4)*.10,0,-j*.20]);link.rotation.y=j%2?Math.PI/2:0;
   }
  }else if(mode==='music'){
   for(let j=0;j<Math.min(this.p.count,this.plan.count);j++){
    const x=(j%3-1)*.30,y=Math.floor(j/3)*.24-.2,z=-j*.12;
    this.sphere(g,[x,y,z],.065,this.p.accent,[1.4,.7,.7]);this.line(g,[[x+.06,y,z],[x+.06,y+.34,z],[x+.17,y+.28,z]],this.p.color,.012);
   }
  }else if(mode==='petals'||mode==='leaves'||mode==='talismans'){
   const n=this.plan.count,cloud=new T.InstancedMesh(mode==='talismans'?new T.PlaneGeometry(.17,.35):petalGeometry(),this.mat(this.p.color,.75),n);g.add(cloud);const o=new T.Object3D();
   for(let j=0;j<n;j++){const a=j*Math.PI*2/n;o.position.set(Math.sin(a)*.55,Math.cos(a)*.42,-j*.07);o.rotation.set(.2,a,a);o.scale.setScalar(mode==='leaves'?.5:.65);o.updateMatrix();cloud.setMatrixAt(j,o.matrix);}
  }else if(mode==='jade'){
   this.mesh(g,new T.BoxGeometry(.62,.48,.62),this.mat(this.p.color,.40));this.mesh(g,new T.BoxGeometry(.73,.12,.73),this.mat(this.p.accent,.75),[0,-.30,0]);
   const beast=this.monster('tiger');beast.scale.setScalar(.30);beast.position.y=.35;g.add(beast);
  }else if(mode==='fortress')this.fortress(g,1.4);
  else if(mode==='mechanism'){
   // Two wooden ox constructs and toothed wheels, assembled from editable primitive forms.
   for(const sign of [-1,1]){
    const ox=new T.Group();g.add(ox);ox.position.x=sign*.5;this.boxes(ox,[{p:[0,0,0],s:[.35,.32,.6]},{p:[0,.15,.40],s:[.28,.25,.26]}]);
    for(const a of [-1,1]){this.line(ox,[[a*.10,.25,.42],[a*.22,.45,.50]],this.p.color,.03);for(const z of [-.2,.2])this.mesh(ox,new T.TorusGeometry(.17,.035,5,10),this.mat(this.p.accent,.8),[a*.24,-.20,z]).rotation.y=Math.PI/2;}
   }
  }else if(mode==='ships')this.ships(g);
  this.flightBaseScale=this.plan.scale;g.scale.setScalar(this.plan.scale);
 }
 fortress(g,size=1){
  const blocks=[];for(let j=0;j<5;j++){
   blocks.push({p:[(j-2)*.35,.30,0],s:[.33,.65,.20]});if(j%2===0)blocks.push({p:[(j-2)*.35,.72,0],s:[.33,.20,.22]});
  }
  this.boxes(g,blocks,this.p.color);this.line(g,[[-.87,.02,.14],[-.87,.67,.14],[.87,.67,.14],[.87,.02,.14]],this.p.accent,.018);g.scale.multiplyScalar(size);
 }
 ships(g){
  for(let j=0;j<Math.min(3,this.plan.count);j++){
   const ship=new T.Group();g.add(ship);ship.position.set((j-1)*.6,0,-Math.abs(j-1)*.35);
   const hull=this.mesh(ship,new T.ConeGeometry(.25,.8,4),this.mat(this.p.accent,.7));hull.rotation.x=Math.PI/2;
   this.line(ship,[[0,0,0],[0,.75,0]],this.p.color,.017);this.mesh(ship,new T.PlaneGeometry(.35,.48),this.mat(this.p.color,.55),[.13,.45,0]);
  }
 }
 makeImpact(){
  // A separate impact node for EVERY actual damage/heal target, including multi-target skills.
  for(let index=0;index<this.targets.length;index++){
   const t=this.targets[index],g=new T.Group();g.position.copy(t.position);g.name='target:'+index;this.burst.add(g);
   const mode=t.heal?'heal':this.p.impact;this.rune(g,mode==='sigil'?'bagua':'seal',.78*this.plan.scale);
   if(this.plan.reducedMotion){if(mode==='heal')this.lotus(g,.7,.15);continue;}
   if(['heal','blossom','torrent'].includes(mode)){
    this.lotus(g,mode==='heal'?.8:.65,.16);
    for(let j=0;j<3;j++){
     const pts=[];for(let k=0;k<24;k++){const u=k/23,a=u*Math.PI*2+j*Math.PI*2/3;pts.push([Math.cos(a)*(.75-u*.28),.15+u*2.6,Math.sin(a)*(.75-u*.28)]);}
     this.line(g,pts,j%2?this.p.accent:this.p.color,.020,mode==='heal'?.42:.65);
    }
    if(this.p.variant==='seven-step-poem')for(let j=0;j<7;j++)this.sphere(g,[Math.sin(j)*.7,.18+j*.20,Math.cos(j)*.7],.045,this.p.accent);
   }else if(['inferno','ships'].includes(mode)){
    const n=this.director.options.quality==='low'?4:7;
    for(let j=0;j<n;j++){
     const a=j*2*Math.PI/n;const pts=[];for(let k=0;k<13;k++){const u=k/12;pts.push([Math.cos(a)*(.7-u*.4)+Math.sin(u*4+j)*.15,.15+u*(1.8+(j%3)*.3),Math.sin(a)*(.7-u*.4)]);}
     this.line(g,pts,j%2?this.p.accent:this.p.color,.05,.75);
    }
    if(mode==='ships'&&index===0){const ships=new T.Group();ships.position.y=.25;g.add(ships);this.ships(ships);}
   }else if(mode==='wall'){
    for(let j=0;j<3;j++){const shield=new T.Group();g.add(shield);shield.rotation.y=(j-1)*Math.PI/3;shield.position.z=.25;this.fortress(shield,.95);}
   }else if(['quake','bridge','peaks'].includes(mode)){
    for(let j=0;j<3;j++)this.ring(g,.55+j*.27,j%2?this.p.accent:this.p.color,.14+j*.02);
    const n=mode==='peaks'?5:8;
    for(let j=0;j<n;j++){
     const a=j*2*Math.PI/n;this.line(g,[[Math.sin(a)*.32,.14,Math.cos(a)*.32],[Math.sin(a+.12)*.83,.14,Math.cos(a+.12)*.83],[Math.sin(a)*1.30,.14,Math.cos(a)*1.30]],this.p.accent,.019);
     if(mode==='peaks'){const rock=this.mesh(g,new T.ConeGeometry(.21,.65+j%3*.18,5),this.mat(this.p.color,.55),[Math.sin(a)*.88,.28,Math.cos(a)*.88]);rock.rotation.z=Math.sin(a)*.2;}
    }
    if(mode==='bridge')this.boxes(g,Array.from({length:5},(_,j)=>({p:[(j-2)*.34,.30,(j%2)*.22],s:[.28,.12,.90],a:(j-2)*.12})),this.p.accent);
   }else if(mode==='claws'||mode==='cross'||mode==='slash'){
    const n=mode==='claws'?3:mode==='cross'?2:this.plan.count>1?2:1;
    for(let j=0;j<n;j++){
     const pts=[];for(let k=0;k<20;k++){const u=k/19;pts.push([(u-.5)*2.2+(j-(n-1)/2)*.20,.45+Math.sin(u*Math.PI)*1.75,.16+Math.cos(u*Math.PI)*.24]);}
     const slash=this.line(g,pts,j%2?this.p.accent:this.p.color,.035,.85);slash.rotation.z=mode==='cross'?(j?-.65:.65):(j-1)*.16;
    }
   }else if(mode==='crystal'||mode==='arrows'){
    const n=Math.min(8,this.plan.count);for(let j=0;j<n;j++){
     const a=j*2*Math.PI/n,r=.65;const shard=this.mesh(g,new T.OctahedronGeometry(.14,0),this.mat(j%2?this.p.accent:this.p.color,.8),[Math.sin(a)*r,.3+Math.abs(Math.sin(j))*1.2,Math.cos(a)*r]);shard.scale.y=mode==='crystal'?3:1.6;shard.rotation.z=Math.sin(a)*.35;
    }
   }
  }
 }
 makeParticles(){
  if(!this.plan.particles)return;
  const n=this.plan.particles,m=this.mat('#ffffff',.85);m.map=this.director.glow;m.depthTest=true;
  const cloud=new T.InstancedMesh(new T.PlaneGeometry(1,1),m,n);cloud.instanceMatrix.setUsage(T.DynamicDrawUsage);this.group.add(cloud);cloud.visible=false;this.particles=cloud;
  const c1=new T.Color(this.p.color),c2=new T.Color(this.p.accent);this.particleData=[];
  for(let j=0;j<n;j++){
   const target=this.targets[j%this.targets.length].position.clone(),angle=this.random()*Math.PI*2,r=.4+this.random()*.8;
   this.particleData.push({target,angle,r,y:.2+this.random()*1.4,size:.13+this.random()*.15,phase:this.random()});cloud.setColorAt(j,c1.clone().lerp(c2,this.random()));
  }
 }
 release(now){if(this.released)return;this.released=true;this.source.copy(this.args.source());this.flight.visible=true;this.director.record(this,'release',now);}
 impact(now,targets){
  if(this.disposed||this.impactTime!==null)return;
  this.release(now);this.impactTime=now;this.burst.visible=true;this.cast.visible=false;
  if(targets)targets.forEach((t,i)=>{if(this.burst.children[i])this.burst.children[i].position.copy(t.position);if(this.targets[i])this.targets[i].position.copy(t.position);});
  this.primary.copy(this.targets[0].position);if(this.particleData)this.particleData.forEach((p,i)=>p.target.copy(this.targets[i%this.targets.length].position));
  this.director.record(this,'impact',now);
 }
 update(now,camera){
  if(this.disposed)return;const age=now-this.start,t=age/this.dt,reduce=this.plan.reducedMotion;
  if(this.impactTime===null&&age>Math.max(2000,this.dt*2)){this.dispose();return;}
  this.cast.position.copy(this.args.source());
  if(!reduce){this.cast.rotation.y=age*.0010;this.cast.scale.setScalar(.85+Math.min(1,t*4)*.20);}
  if(age>=this.dt*.14)this.release(now);
  if(this.args.autoImpact&&age>=this.dt*.30)this.impact(now);
  if(this.released){
   const f=clamp((age-this.dt*.14)/(this.dt*.16),0,1),from=this.source.clone().add(new T.Vector3(0,1.4,0)),to=this.primary.clone().add(new T.Vector3(0,1.25,0));
   const curve=new T.QuadraticBezierCurve3(from,from.clone().lerp(to,.5).add(new T.Vector3(0,['rocks','meteors','arrows','crystals'].includes(this.p.travel)?2.3:.6,0)),to);
   this.flight.position.copy(curve.getPoint(f));this.flight.quaternion.setFromUnitVectors(FORWARD,curve.getTangent(Math.min(.999,f)).normalize());
   if(!reduce&&['twins','crescent','axes','petals','talismans'].includes(this.p.travel))this.flight.rotateZ(age*.004);
   if(reduce)this.flight.visible=false;
  }
  if(this.impactTime!==null){
   const post=(now-this.impactTime)/1000,life=reduce?.55:1.05;
   // Hold an animal silhouette at contact briefly so fast battle speeds remain readable.
   this.flight.visible=!reduce&&post<.38;
   if(!reduce){for(const g of this.burst.children){g.scale.setScalar(.88+Math.min(1,post*3)*.25);if(['inferno','torrent','blossom','heal'].includes(this.p.impact))g.rotation.y=post*.35;}}
   const fade=clamp((post-(reduce?.18:.40))/(reduce?.36:.65),0,1);for(const m of this.materials)m.opacity=m.userData.baseOpacity*(1-fade);
   if(this.particles){
    this.particles.visible=post<life;const o=new T.Object3D();
    this.particleData.forEach((p,i)=>{const phase=(post*.9+p.phase)%1,r=p.r*(.6+post*.5);o.position.copy(p.target).add(new T.Vector3(Math.cos(p.angle+post)*r,p.y+phase*1.8,Math.sin(p.angle+post)*r));o.quaternion.copy(camera?.quaternion||new T.Quaternion());o.scale.setScalar(p.size*Math.max(.05,1-phase));o.updateMatrix();this.particles.setMatrixAt(i,o.matrix);});this.particles.instanceMatrix.needsUpdate=true;
   }
   if(post>=life){this.director.record(this,'complete',now);this.dispose();}
  }else if(age>Math.max(2000,this.dt*3)){this.dispose();}
 }
 dispose(){if(this.disposed)return;this.disposed=true;destroy(this.group);}
}

export class SkillDirector{
 constructor(scene,options={}){this.scene=scene;this.options={quality:'standard',reducedMotion:false,...options};this.glow=glowTexture();this.sequences=[];this.events=[];this.last=null;}
 record(s,phase,now){const event={id:s.p.id,variant:s.p.variant,title:s.p.title,tier:s.plan.tier,phase,at:Math.round(now-s.start),targetCount:s.targets.length};this.events.push(event);if(this.events.length>48)this.events.shift();this.last=event;}
 begin(args){
  if(!skillProfile(args.id))return null;
  const plan=skillPlan(args.id,{...this.options,tier:args.tier,targetCount:args.targets.length});
  while(this.sequences.length>=plan.maxActive)this.sequences.shift().dispose();
  const s=new Sequence(this,args);this.sequences.push(s);this.record(s,'cast',s.start);return s;
 }
 impact(token,targets){token?.impact(performance.now(),targets);}
 update(now,camera){for(const s of this.sequences)s.update(now,camera);this.sequences=this.sequences.filter(s=>!s.disposed);}
 clear(){for(const s of this.sequences)s.dispose();this.sequences=[];}
 dispose(){this.clear();this.glow.dispose();}
 diagnostics(){return {active:this.sequences.length,last:this.last,events:this.events.slice(),profiles:Object.keys(SKILLS).length,renderables:this.sequences.reduce((n,s)=>{s.group.traverse(o=>{if(o.isMesh)n++;});return n;},0)};}
}
