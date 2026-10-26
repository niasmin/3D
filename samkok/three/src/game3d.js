import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MODEL_MAP, modelPath, unitPosition, clipByName,signatureFamily,nextRenderBudget } from './layout.js';

// Gameplay stays in the original engine. This module owns only presentation.
const api = window.SamkokGame;
const loader = new GLTFLoader();
const cache = new Map();
let current = null, viewer = null, mountVersion = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let adaptiveBudget=0;
const quality = () => localStorage.getItem('samkok-3d-quality') || 'auto';
function gradientTexture(shadow=false) {
  const canvas=document.createElement('canvas');canvas.width=shadow?128:256;canvas.height=shadow?128:256;const c=canvas.getContext('2d');
  const g=shadow?c.createRadialGradient(64,64,4,64,64,64):c.createLinearGradient(0,0,0,256);
  if(shadow){g.addColorStop(0,'rgba(12,22,30,.7)');g.addColorStop(.45,'rgba(12,22,30,.35)');g.addColorStop(1,'rgba(12,22,30,0)');}
  else{g.addColorStop(0,'#163b58');g.addColorStop(.55,'#7599a2');g.addColorStop(1,'#e8c799');}
  c.fillStyle=g;c.fillRect(0,0,canvas.width,canvas.height);
  if(!shadow)for(let layer=0;layer<2;layer++){
    c.beginPath();c.moveTo(0,256);for(let x=0;x<=256;x+=4)c.lineTo(x,180+layer*22+Math.sin(x*.027+layer)*13+Math.sin(x*.063+layer*2)*7);c.lineTo(256,256);c.closePath();c.fillStyle=layer?'#77978c':'#64868a';c.fill();
  }
  const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;return t;
}
const disposeTree = root => {
  const geometries = new Set(), materials = new Set(), textures=new Set();
  root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) for (const m of [].concat(o.material)) materials.add(m); });
  for (const g of geometries) g.dispose();
  for (const m of materials){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();}
  for(const t of textures)t.dispose();
};
function pruneCache() {
  for (const [key, entry] of cache) {
    if (cache.size <= 12) break;
    if (entry.refs === 0 && entry.gltf) { disposeTree(entry.gltf.scene); cache.delete(key); }
  }
}
async function acquire(id, tier) {
  const key = modelPath(id, tier);
  let entry = cache.get(key);
  if (!entry) {
    entry = { refs:0, gltf:null };
    entry.promise = loader.loadAsync(key).then(g => { entry.gltf = g; return g; }).catch(e => { cache.delete(key); throw e; });
    cache.set(key, entry);
  }
  entry.refs++;
  try {
    const gltf = await entry.promise;
    const root = cloneSkeleton(gltf.scene);
    root.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
      }
    });
    return { root, clips:gltf.animations, release() {
      root.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) m.dispose(); if (o.isSkinnedMesh) o.skeleton.dispose(); });
      entry.refs--; cache.delete(key); cache.set(key, entry); pruneCache();
    } };
  } catch (e) { entry.refs--; throw e; }
}
const material = (color, metalness=0) => new T.MeshStandardMaterial({color, roughness:.72, metalness});
function mesh(parent, geometry, mat, pos=[0,0,0]) {
  const m = new T.Mesh(geometry, mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function box(parent, dims, pos, mat) { return mesh(parent,new T.BoxGeometry(...dims),mat,pos); }
function cylinder(parent, rt, rb, height, pos, mat, n=12) { return mesh(parent,new T.CylinderGeometry(rt,rb,height,n),mat,pos); }

class Actor {
  constructor(asset, unit, stage) {
    this.asset=asset;this.unit=unit;this.stage=stage;this.root=new T.Group();this.root.add(asset.root);this.root.scale.setScalar(unit.id==='boss'?1.12:.90);
    this.mixer=new T.AnimationMixer(asset.root);this.actions={};this.dead=false;this.hitUntil=0;this.attackUntil=0;
    for (const name of ['Idle','Walk','Attack','Hit','Block','Defeat','Victory']) { const clip=clipByName(asset.clips,name);if(clip)this.actions[name]=this.mixer.clipAction(clip); }
    this.actions.Idle?.play();this.active=this.actions.Idle;
    this.materials=[];asset.root.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))this.materials.push({m,emissive:m.emissive.clone(),intensity:m.emissiveIntensity});});
    stage.scene.add(this.root);
  }
  play(name, duration=0) {
    const action=this.actions[name];if(!action)return;
    this.active?.fadeOut(.12);action.reset().fadeIn(.12);
    const once=duration||name==='Defeat'||name==='Victory';action.setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);action.clampWhenFinished=!!once;
    action.timeScale=duration?action.getClip().duration/duration:1;action.play();this.active=action;
    this.attackUntil=duration?performance.now()+duration*1000:0;
  }
  hit(heal=false,blocked=false) {
    this.hitUntil=performance.now()+170;
    for (const {m} of this.materials) {m.emissive.set(heal?0x36e78f:0xff653f);m.emissiveIntensity=.65;}
    if(!heal&&!this.dead)this.play(blocked?'Block':'Hit',blocked?.38:.24);
  }
  update(dt, now) {
    if(this.dead&&!this.actions.Defeat){this.root.rotation.z=T.MathUtils.damp(this.root.rotation.z,Math.PI/2,8,dt);this.root.position.y=T.MathUtils.damp(this.root.position.y,.2,8,dt);}
    else this.mixer.update(dt);
    if(this.attackUntil&&now>this.attackUntil){this.attackUntil=0;if(!this.dead)this.play('Idle');}
    if(this.hitUntil&&now>this.hitUntil){this.hitUntil=0;for(const {m,emissive,intensity} of this.materials){m.emissive.copy(emissive);m.emissiveIntensity=intensity;}}
  }
  dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.asset.root);this.root.removeFromParent();this.asset.release();}
}

class Stage {
  constructor(host, kind='battle', biome='village') {
    this.host=host;this.kind=kind;this.disposed=false;this.actors=new Map();this.labels=[];this.fx=[];this.environment=new T.Group();this.owned=[];
    this.scene=new T.Scene();this.scene.add(this.environment);
    const sky=biome==='gate'?0x647c87:biome==='harbor'?0x86afb0:0x98b6ab;
    this.skyTexture=gradientTexture();this.shadowTexture=gradientTexture(true);
    this.scene.background=this.skyTexture;this.scene.fog=new T.Fog(sky,38,85);
    this.canvas=document.createElement('canvas');this.canvas.className='world3d';this.canvas.setAttribute('aria-label',kind==='city'?'เมืองสามก๊กแบบสามมิติ':'สนามขุนพลสามมิติ');
    this.renderer=new T.WebGLRenderer({canvas:this.canvas,antialias:quality()!=='low',alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality()==='low'?1:quality()==='auto'&&adaptiveBudget?adaptiveBudget===2?.8:1:1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;
    this.renderer.shadowMap.enabled=quality()==='high'||((quality()==='standard'||quality()==='auto'&&!adaptiveBudget)&&!matchMedia('(max-width:600px)').matches);this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.camera=new T.PerspectiveCamera(37,1,.1,150);
    this.camera.position.set(kind==='city'?21:12,kind==='city'?24:23,kind==='city'?28:26);this.target=new T.Vector3(0,kind==='city'?2:0.5,0);this.camera.lookAt(this.target);
    const ambient=new T.HemisphereLight(0xd3e9ff,0x243d38,1.15);this.scene.add(ambient);
    const sun=new T.DirectionalLight(0xffd8a1,2.6);sun.position.set(-12,25,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:70});this.scene.add(sun);
    const rim=new T.DirectionalLight(0x9cceff,1.3);rim.position.set(8,6,-12);this.scene.add(rim);
    this.loading=document.createElement('div');this.loading.className='world3d-loading';this.loading.setAttribute('role','status');this.loading.textContent='กำลังเตรียมโลก 3D…';host.prepend(this.canvas);host.append(this.loading);host.classList.add('has3d');
    this.controls=new OrbitControls(this.camera,this.canvas);this.controls.target.copy(this.target);this.controls.enablePan=false;this.controls.enableDamping=true;this.controls.minDistance=kind==='city'?20:18;this.controls.maxDistance=kind==='city'?55:55;this.controls.minPolarAngle=.30;this.controls.maxPolarAngle=1.3;
    if(kind==='battle')this.controls.enabled=false;
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(host);this.resize();
    this.buildWorld(biome);
    this.batchEnvironment();
    this.last=performance.now();this.started=this.last;this.budgetStart=this.last;this.budgetFrames=0;this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);
  }
  resize() {
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    if(this.kind!=='viewer') {
      const factor=Math.max(1,1/this.camera.aspect*(this.kind==='city'?.78:.62));
      this.camera.position.set(this.kind==='city'?21:12,this.kind==='city'?24:23,this.kind==='city'?28:26).multiplyScalar(factor);this.camera.lookAt(this.target);this.controls.update();
    }
  }
  buildWorld(biome) {
    const e=this.environment;
    const stone=material(0x899995),darkStone=material(0x5e7774),grass=material(biome==='gate'?0x496a5e:0x3c795b),wood=material(0x533729),red=material(0x9b4534),roof=material(0x1f6870),gold=material(0xd9b36a,.35);
    this.palette={stone,darkStone,grass,wood,red,roof,gold};
    cylinder(e,14,12,1.5,[0,-.85,0],darkStone,32);cylinder(e,14.1,14.1,.12,[0,-.06,0],grass,48);
    const paving=box(e,[this.kind==='city'?8:13,.12,17],[0,0,0],stone);
    for(let z=-8;z<=8;z++)for(let x=-6;x<=6;x+=2){if(this.kind==='city'&&Math.abs(x)>3)continue;box(e,[1.94,.025,.94],[x,.072,z],(z+x)%5===0?darkStone:stone);}
    for(const x of [-6.7,6.7])box(e,[.05,.04,17],[x,.105,0],gold);
    for(const z of [-8.5,8.5])box(e,[13.5,.04,.05],[0,.105,z],gold);
    if(this.kind!=='city'){
      const seal=mesh(e,new T.RingGeometry(2.05,2.10,64),gold,[0,.12,0]);seal.rotation.x=-Math.PI/2;
      for(let k=0;k<8;k++){const a=k*Math.PI/4,m=box(e,[.05,.04,.55],[Math.cos(a)*1.7,.12,Math.sin(a)*1.7],gold);m.rotation.y=-a;}
    }
    if(this.kind==='viewer')return;
    if(this.kind==='city')this.buildCity();
    else {
      // Battlegrounds are geometry: village courtyard, fortress and waterside dock.
      if(biome==='harbor') {
        box(e,[55,.05,40],[0,-.6,-18],new T.MeshStandardMaterial({color:0x538b99,metalness:.35,roughness:.22}));
        for(let x of [-9,9])for(let z=-8;z<8;z+=2)cylinder(e,.12,.15,1.8,[x,.3,z],wood,8);
      }
      for(const x of [-9,9]) {for(let z=-9;z<=9;z+=3)this.tree(x,z,(Math.abs(z)%2===0));this.banner(x,0,x<0?0x267e68:0xa64943);}
      if(biome==='gate') {
        box(e,[26,4,1],[0,2,-12],darkStone);box(e,[3,4.6,1.8],[-3,2.3,-11.5],stone);box(e,[3,4.6,1.8],[3,2.3,-11.5],stone);box(e,[4,1.3,2],[0,4.2,-11.5],red);this.roof(e,0,5,-11.5,5,roof);
      } else {this.pagoda(-7,-10,1.05,2);this.pagoda(7,-10,1.05,2);}
      this.banner(-6,-9,0x416f77);this.banner(6,-9,0xb15243);
    }
    // Distant silhouettes are part of the sky backdrop; scenery stays within the island.
    this.petals=new T.Group();e.add(this.petals);
    const petalMat=material(0xffd5b2);
    for(let i=0;i<25;i++) {const p=mesh(this.petals,new T.OctahedronGeometry(.035),petalMat,[(i*7.3)%25-12,(i*1.7)%7+1,(i*5.1)%25-12]);p.userData.phase=i;}
  }
  batchEnvironment() {
    // Merge only static scenery; keep animated petals and skinned actors separate.
    this.environment.updateMatrixWorld(true);const groups=new Map(),originals=[];
    this.environment.traverse(o=>{
      if(!o.isMesh||o.parent===this.petals)return;
      const m=o.material,key=[m.type,m.color?.getHex(),m.roughness,m.metalness,m.emissive?.getHex(),m.emissiveIntensity,m.side].join('/');
      let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
      if(!g.getAttribute('uv'))g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));
      if(!groups.has(key))groups.set(key,{material:m,geometries:[]});groups.get(key).geometries.push(g);originals.push(o);
    });
    const kept=new Set([...groups.values()].map(g=>g.material));
    for(const o of originals){o.removeFromParent();o.geometry.dispose();if(!kept.has(o.material))o.material.dispose();}
    for(const group of groups.values()){const geometry=mergeGeometries(group.geometries,false);if(geometry)mesh(this.environment,geometry,group.material);for(const g of group.geometries)g.dispose();}
  }
  roof(parent,x,y,z,size,mat) {
    const vertices=[],indices=[];
    const rings=[[1.12,.18],[1,0],[.65,.55],[.12,1.25]];
    for(const [s,h] of rings)for(const [a,b] of [[-1,-1],[-1,1],[1,1],[1,-1]])vertices.push(a*size*s,h*size*.32,b*size*s);
    for(let j=0;j<3;j++)for(let i=0;i<4;i++){let a=j*4+i,b=j*4+(i+1)%4,c=(j+1)*4+(i+1)%4,d=(j+1)*4+i;indices.push(a,c,b,a,d,c);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=mesh(parent,g,mat,[x,y,z]);m.material.side=T.DoubleSide;
    return m;
  }
  pagoda(x,z,size=1,tiers=2) {
    const {stone,wood,red,roof,gold}=this.palette,e=this.environment;
    box(e,[size*3.7,.26,size*3.7],[x,.18,z],stone);
    for(let i=0;i<tiers;i++){
      const s=size*(1-i*.16),y=.35+i*1.7*size;
      box(e,[s*2.7,size*1.5,s*2.5],[x,y+size*.75,z],red);
      for(const a of [-1,1])for(const b of [-1,1])cylinder(e,.075*size,.085*size,size*1.6,[x+a*s*1.27,y+size*.8,z+b*s*1.16],wood,8);
      for(const a of [-.7,0,.7])box(e,[s*.32,size*.55,.03],[x+a*s,y+size*.8,z+s*1.26],new T.MeshStandardMaterial({color:0xffd892,emissive:0xd8903c,emissiveIntensity:.35,roughness:.6}));
      this.roof(e,x,y+size*1.5,z,s*1.7,roof);
      for(const sign of [-1,1]){
        box(e,[s*3.5,.045,.045],[x,y+size*1.59,z+sign*s*1.7],gold);
        cylinder(e,.045,.06,.32,[x+sign*s*1.76,y+size*1.9,z+s*1.76],gold,7);
      }
    }
    cylinder(e,.045,.08,.7,[x,.35+tiers*size*1.7,z],gold,8);
    box(e,[size*.65,size*1.05,.06],[x,size*.8,z+size*1.28],wood);
    for(let step=0;step<3;step++)box(e,[size*1.1,.12*(3-step),.3],[x,.06*(3-step),z+size*1.6+step*.26],stone);
    for(const sign of [-1,1]){
      const lantern=new T.MeshStandardMaterial({color:0xd94825,emissive:0xff7d2c,emissiveIntensity:.65,roughness:.6});
      mesh(e,new T.SphereGeometry(size*.14,8,6),lantern,[x+sign*size*1.2,size*1.5,z+size*1.35]);
      cylinder(e,.08,.08,.045,[x+sign*size*1.2,size*1.65,z+size*1.35],gold,8);
    }
  }
  tree(x,z,pink=false) {
    const e=this.environment;const trunk=material(0x65483b),leaves=material(pink?0xc27887:0x3e7452);
    cylinder(e,.12,.24,2.1,[x,1,z],trunk,7);
    for(let j=0;j<4;j++)mesh(e,new T.IcosahedronGeometry(.8+(j%2)*.3,0),leaves,[x+Math.sin(j*2)*.55,2.4+(j%2)*.5,z+Math.cos(j*2)*.55]);
  }
  banner(x,z,color) {
    const e=this.environment;const pole=material(0x7d6545),cloth=material(color);
    cylinder(e,.035,.055,4.4,[x,2.2,z],pole,8);box(e,[1.25,1.8,.06],[x+.55,3.1,z],cloth);box(e,[1.4,.06,.08],[x+.6,4,z],pole);
    for(const sign of [-1,1])box(e,[.035,1.8,.075],[x+.55+sign*.58,3.1,z],this.palette.gold);
    const badge=mesh(e,new T.CircleGeometry(.28,4),this.palette.gold,[x+.55,3.2,z+.04]);badge.rotation.z=Math.PI/4;
    cylinder(e,.09,.03,.20,[x,4.5,z],this.palette.gold,8);
  }
  buildCity() {
    const defs=[['summon',-6,-5,1,2],['tower',0,-7,1.3,4],['arena',6,-5,1,2],['shop',-6,0,1,1],['beasts',6,0,.9,2],['shrine',-6,6,.8,2],['guild',0,5,1.1,3],['story',6,6,1,1]];
    for(const [id,x,z,size,tiers] of defs){
      this.pagoda(x,z,size,tiers);
      const el=this.host.querySelector(`[data-go="${id}"]`);if(el){el.classList.add('world3d-label');this.labels.push({el,position:new T.Vector3(x,tiers*size*1.65+.9,z)});}
    }
    for(const x of [-10,10])for(const z of [-8,0,8])this.tree(x,z,true);
    box(this.environment,[4,.10,4],[5,.1,4],material(0x579daa,.25));
    this.banner(-3,2,0x398170);this.banner(3,2,0xb14a3d);
  }
  async addActor(unit) {
    const tier=Math.max(1,api.evolution(unit.id,unit.aw||0));
    const asset=await acquire(unit.id,tier);
    if(this.disposed){asset.release();return null;}
    const actor=new Actor(asset,unit,this);this.actors.set(unit.uid,actor);
    const p=unitPosition(unit.side,unit.slot);actor.root.position.set(p.x,p.y+.07,p.z);actor.root.rotation.y=unit.side==='p'?Math.PI:0;
    const el=document.getElementById('u-'+unit.uid);if(this.kind==='battle'&&el)this.labels.push({el,position:new T.Vector3(p.x,unit.id==='boss'?4.3:3.55,p.z)});
    // Ground contact shadow remains available even on low-end phones without shadow maps.
    const shadow=mesh(this.environment,new T.PlaneGeometry(1.5,1.5),new T.MeshBasicMaterial({map:this.shadowTexture,transparent:true,opacity:.7,depthWrite:false}),[p.x,.12,p.z]);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
    const ring=mesh(this.environment,new T.RingGeometry(.53,.56,32),new T.MeshBasicMaterial({color:unit.side==='p'?0x6ee5bf:0xff9b76,transparent:true,opacity:.65,depthWrite:false}),[p.x,.125,p.z]);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
    return actor;
  }
  async populate(units) {
    const results=await Promise.allSettled(units.map(u=>this.addActor(u)));
    if(this.disposed)return;
    const failures=results.filter(r=>r.status==='rejected');
    if(failures.length){this.loading.textContent=`โหลดโมเดลไม่ได้ ${failures.length} ตัว · ลองเปิดเกมใหม่`;this.loading.classList.add('error');throw new AggregateError(failures.map(f=>f.reason),'3D models unavailable');}
    else this.loading.remove();
  }
  action(a,dt) {
    const actor=this.actors.get(a.src);if(!actor||this.disposed)return;
    actor.play('Attack',Math.max(.15,dt/1000*.9));
    const role=api.hero(actor.unit.id)?.role||'war';
    if(a.skill)this.signature(actor,a.hits.map(h=>this.actors.get(h.tgt)).filter(Boolean));
    for(const hit of a.hits){const target=this.actors.get(hit.tgt);if(!target)continue;
      const heal=hit.heal!==undefined,color=heal?0x7bffb0:hit.crit?0xffa14f:role==='strat'?0xbf9bff:role==='arch'?0xffdc8f:0x97edff;
      const m=new T.MeshBasicMaterial({color,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false});
      const ring=mesh(this.scene,new T.TorusGeometry(heal?1:a.skill?1.1:.75,.035,5,32,heal?Math.PI*2:Math.PI*1.2),m);ring.position.copy(target.root.position);ring.position.y=heal?.18:1.5;ring.rotation.x=heal?Math.PI/2:.7;
      this.fx.push({mesh:ring,age:0,life:heal?.75:.45,spin:!heal});
      const count=reducedMotion?0:quality()==='low'?3:a.skill?8:4;
      for(let k=0;k<count;k++){
        const angle=k*2*Math.PI/count,spark=mesh(this.scene,new T.OctahedronGeometry(heal?.07:.045),new T.MeshBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false}));
        spark.position.copy(target.root.position).add(new T.Vector3(Math.cos(angle)*.55,heal?.3:1.3,Math.sin(angle)*.55));
        this.fx.push({mesh:spark,age:0,life:heal?.9:.45,rise:heal?1.2:.6});
      }
      if(!heal){
        let geometry;
        if(role==='arch'){
          const shaft=new T.CylinderGeometry(.018,.018,.75,5),tip=new T.ConeGeometry(.07,.18,5);tip.translate(0,.46,0);geometry=mergeGeometries([shaft,tip]);shaft.dispose();tip.dispose();
        }else geometry=new T.SphereGeometry(a.skill?.17:.08,8,6);
        const orb=mesh(this.scene,geometry,new T.MeshBasicMaterial({color}));const from=actor.root.position.clone().add(new T.Vector3(0,1.7,0)),to=target.root.position.clone().add(new T.Vector3(0,1.5,0));orb.position.copy(from);
        if(role==='arch')orb.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.clone().sub(from).normalize());
        this.fx.push({mesh:orb,age:0,life:Math.max(.08,dt/1000*.3),from,to});
      }
    }
  }
  signature(actor,targets){
    const family=signatureFamily(actor.unit.id);if(!family||!targets.length||reducedMotion)return;
    const target=targets[0].root.position.clone(),source=actor.root.position.clone();
    const add=(geometry,color,position)=>mesh(this.scene,geometry,new T.MeshBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide}),position.toArray());
    if(family==='ice'){
      for(let k=0;k<3;k++){const to=target.clone().add(new T.Vector3((k-1)*.55,1,0)),from=to.clone().add(new T.Vector3(0,5+k*.4,0));const m=add(new T.ConeGeometry(.13,2,6),0x99e7ff,from);m.rotation.z=Math.PI;this.fx.push({mesh:m,age:0,life:.45+k*.07,from,to});}
      return;
    }
    if(family==='twins'||family==='quake'){
      for(let k=0;k<(family==='twins'?2:3);k++){
        const p=target.clone();p.y=family==='quake'?.16:1.6;const m=add(new T.TorusGeometry(family==='quake'?.6+k*.25:1.0,.035,5,40,family==='quake'?Math.PI*2:Math.PI*1.4),family==='quake'?0xf6a467:0xffe391,p);
        m.rotation.set(family==='quake'?Math.PI/2:.6,0,k%2?-1:1);this.fx.push({mesh:m,age:0,life:.85,expand:family==='quake'?3:1,spin:family==='twins'});
      }return;
    }
    const group=new T.Group();this.scene.add(group);
    if(family==='wind'){
      group.position.copy(target);
      for(let ribbon=0;ribbon<3;ribbon++){
        const points=[];for(let i=0;i<=40;i++){const t=i/40,a=t*Math.PI*3+ribbon*2*Math.PI/3;points.push(new T.Vector3(Math.cos(a)*(1.1-.45*t),.2+t*2.8,Math.sin(a)*(1.1-.45*t)));}
        mesh(group,new T.TubeGeometry(new T.CatmullRomCurve3(points),40,.035,4,false),new T.MeshBasicMaterial({color:ribbon?0xb9f2de:0xf0f5cb,transparent:true,opacity:.75,depthWrite:false}));
      }
      this.fx.push({mesh:group,age:0,life:1.05,custom:()=>{group.rotation.y+=.10;}});
    }else{
      const curve=new T.CatmullRomCurve3([source.clone().add(new T.Vector3(0,1,0)),source.clone().lerp(target,.4).add(new T.Vector3(1.5,2.5,0)),target.clone().add(new T.Vector3(0,1.3,0))]);
      mesh(group,new T.TubeGeometry(curve,36,.10,5,false),new T.MeshBasicMaterial({color:0x48d99b,transparent:true,opacity:.75,depthWrite:false}));
      const head=new T.Group();group.add(head);mesh(head,new T.SphereGeometry(.32,8,6),new T.MeshBasicMaterial({color:0x61edab}));
      mesh(head,new T.SphereGeometry(.20,8,6),new T.MeshBasicMaterial({color:0x42c894}),[0,-.04,.26]);
      for(const sign of [-1,1]){mesh(head,new T.ConeGeometry(.07,.38,5),new T.MeshBasicMaterial({color:0xffe8a5}),[sign*.18,.32,0]);mesh(head,new T.SphereGeometry(.055,6,5),new T.MeshBasicMaterial({color:0xffe293}),[sign*.24,.08,.22]);}
      this.fx.push({mesh:group,age:0,life:.9,custom:t=>{const f=Math.min(.99,t);head.position.copy(curve.getPoint(f));head.lookAt(curve.getPoint(Math.min(1,f+.03)));}});
    }
  }
  hits(a) {for(const h of a.hits){const actor=this.actors.get(h.tgt);if(actor){
    if(h.heal!==undefined&&h.hp>0&&actor.dead){actor.dead=false;actor.play('Idle');}
    const role=api.hero(actor.unit.id)?.role,guard=h.dmg===0||(h.dmg>0&&!h.crit&&h.dmg<(actor.unit.max||0)*.08&&['war','cav'].includes(role));
    actor.hit(h.heal!==undefined,guard);if(h.dead&&!actor.dead){actor.dead=true;actor.play('Defeat',.75);}
  }}}
  outcome(side){for(const actor of this.actors.values())if(!actor.dead&&actor.unit.side===side)actor.play('Victory');}
  tick(now) {
    if(this.disposed)return;
    const dt=Math.min(.05,(now-this.last)/1000);this.last=now;
    if(!document.hidden){
      this.budgetFrames++;
      if(quality()==='auto'&&now-this.started>3000&&now-this.budgetStart>2000){
        const next=nextRenderBudget((now-this.budgetStart)/Math.max(1,this.budgetFrames),adaptiveBudget);
        if(next!==adaptiveBudget){adaptiveBudget=next;this.renderer.shadowMap.enabled=false;this.renderer.setPixelRatio(Math.min(devicePixelRatio,next===2?.8:1));this.renderer.setSize(this.host.clientWidth,this.host.clientHeight,false);}
        this.budgetStart=now;this.budgetFrames=0;
      }
      this.controls.update();for(const actor of this.actors.values())actor.update(dt,now);
      for(let i=this.fx.length-1;i>=0;i--){const f=this.fx[i];f.age+=dt;const t=f.age/f.life;if(t>=1){f.mesh.removeFromParent();disposeTree(f.mesh);this.fx.splice(i,1);}else if(f.from)f.mesh.position.lerpVectors(f.from,f.to,t);else{if(f.custom)f.custom(t);else f.mesh.scale.setScalar(1+t*(f.expand||1));f.mesh.traverse(o=>{if(o.material)o.material.opacity=1-t;});if(f.spin)f.mesh.rotation.z+=dt*9;if(f.rise)f.mesh.position.y+=dt*f.rise;}}
      if(this.petals&&!reducedMotion)for(const p of this.petals.children){p.position.y-=dt*.25;p.position.x+=dt*.1;if(p.position.y<0)p.position.y=7;}
      this.renderer.render(this.scene,this.camera);
      const projected=this.labels.map(label=>{const p=label.position.clone().project(this.camera);return {...label,x:(p.x*.5+.5)*this.host.clientWidth,y:(-p.y*.5+.5)*this.host.clientHeight,hidden:p.z>1,w:label.el.offsetWidth,h:label.el.offsetHeight};});
      if(this.kind==='city'){
        projected.sort((a,b)=>a.y-b.y);
        for(let i=0;i<projected.length;i++){
          const p=projected[i];p.x=T.MathUtils.clamp(p.x,p.w/2+6,this.host.clientWidth-p.w/2-6);
          for(let j=0;j<i;j++){const q=projected[j];if(Math.abs(p.x-q.x)<(p.w+q.w)/2+5&&Math.abs(p.y-q.y)<(p.h+q.h)/2+5)p.y=q.y+(p.h+q.h)/2+6;}
          p.y=Math.min(this.host.clientHeight-p.h/2-8,p.y);
        }
      }
      for(const label of projected){label.el.style.left=label.x+'px';label.el.style.top=label.y+'px';label.el.style.visibility=label.hidden?'hidden':'visible';}
    }
    this.raf=requestAnimationFrame(this.tick);
  }
  dispose() {
    if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.ro.disconnect();this.controls.dispose();
    for(const a of this.actors.values())a.dispose();for(const f of this.fx)disposeTree(f.mesh);
    for(const {el} of this.labels){el.style.removeProperty('left');el.style.removeProperty('top');el.style.removeProperty('visibility');el.classList.remove('world3d-label');}
    this.cameraButton?.remove();disposeTree(this.environment);this.skyTexture.dispose();this.shadowTexture.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.canvas.remove();this.loading.remove();this.host.classList.remove('has3d');
  }
}

function stopCurrent(){current?.dispose();current=null;}
async function mountScreen() {
  const version=++mountVersion;stopCurrent();
  if(api.battle())return;
  const tab=api.tab(),host=tab==='city'?document.querySelector('.city.c2'):tab==='camp'?document.querySelector('#scene'):tab==='formation'?document.querySelector('.fbf'):null;
  if(!host)return;
  try {
    const stage=new Stage(host,tab==='city'?'city':'preview',api.biome());current=stage;
    if(tab==='city'){stage.loading.remove();return;}
    const state=api.state(),units=[];
    state.team.forEach((id,slot)=>{if(id)units.push({id,slot,side:'p',uid:'preview-p'+slot,aw:state.heroes[id]?.aw||0});});
    api.enemies().forEach((u,slot)=>{if(u)units.push({...u,slot,side:'e',uid:'preview-e'+slot});});
    await stage.populate(units);if(version!==mountVersion)stage.dispose();
    if(tab==='formation') {
      for(const side of ['p','e'])for(let slot=0;slot<6;slot++){
        const el=host.querySelector('.fu.'+side+slot),p=unitPosition(side,slot);
        if(el)stage.labels.push({el,position:new T.Vector3(p.x,side==='p'&&!state.team[slot] ? .4:3.2,p.z)});
      }
    }
  } catch(e) {console.error('3D screen unavailable',e);stopCurrent();host.classList.remove('has3d');api.toast('เปิด 3D ไม่สำเร็จ ใช้ภาพเดิมชั่วคราว');}
}

async function battle(units,biome) {
  ++mountVersion;stopCurrent();const host=document.querySelector('.field');if(!host)return;
  try{const stage=new Stage(host,'battle',biome);current=stage;
    const cameraButton=document.createElement('button');stage.cameraButton=cameraButton;cameraButton.className='bc';cameraButton.textContent='หมุนกล้อง';cameraButton.setAttribute('aria-pressed','false');cameraButton.onclick=()=>{stage.controls.enabled=!stage.controls.enabled;cameraButton.setAttribute('aria-pressed',stage.controls.enabled);cameraButton.textContent=stage.controls.enabled?'ล็อกกล้อง':'หมุนกล้อง';};host.querySelector('.bctl')?.append(cameraButton);
    await stage.populate(units);
    if(!stage.disposed){const b=api.battle();if(b)for(const a of b.res.actions.slice(0,b.i))stage.hits(a);}
  }
  catch(e){console.error('3D battle unavailable',e);stopCurrent();api.toast('อุปกรณ์นี้เปิด WebGL ไม่ได้ ใช้ภาพเดิมชั่วคราว');}
}

function closeViewer() {if(!viewer)return;viewer.version++;viewer.stage?.dispose();viewer.el.remove();viewer=null;}
async function openViewer(id) {
  closeViewer();const h=api.hero(id);if(!h)return;
  const el=document.createElement('div');el.className='v3d remake-viewer';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',h.th+' 3D');
  el.innerHTML=`<div class="v3top"><div><small>ขุนพลสามก๊ก · 3D</small><h2></h2></div><button class="sx" data-close3d aria-label="ปิดโมเดล">✕</button></div><div class="v3stage"></div><div class="v3tabs">${[1,2,3].map(t=>`<button data-tier="${t}" aria-pressed="${t===1}">ระดับ ${t}</button>`).join('')}</div><div class="animation3d">${[['Idle','ยืน'],['Walk','เดิน'],['Attack','โจมตี'],['Hit','รับโจมตี'],['Block','ป้องกัน'],['Defeat','ล้ม'],['Victory','ชนะ']].map(([k,l])=>`<button data-animation="${k}" aria-pressed="${k==='Idle'}">${l}</button>`).join('')}</div><p class="v3hint">ลากเพื่อหมุน · เลื่อนเพื่อซูม · โมเดลสไตล์การ์ตูนจาก Blender</p>`;
  el.querySelector('h2').textContent=h.th;document.body.append(el);
  if(signatureFamily(id)){const btn=document.createElement('button');btn.textContent='ดูสกิลเฉพาะตัว';btn.dataset.signature3d='true';el.querySelector('.animation3d').append(btn);}
  const view={el,stage:null,tier:1,version:0,actor:null,returnFocus:document.activeElement};viewer=view;
  el.querySelector('[data-close3d]').focus();
  el.querySelector('[data-close3d]').onclick=()=>{const focus=view.returnFocus;closeViewer();focus?.focus();};
  try {
    const stage=new Stage(el.querySelector('.v3stage'),'viewer');view.stage=stage;stage.camera.position.set(4,3.3,7);stage.controls.target.set(0,1.5,0);stage.controls.minDistance=3;stage.controls.maxDistance=13;stage.controls.update();stage.loading.remove();
    const load=async tier=>{
      const v=++view.version;view.tier=tier;el.querySelectorAll('[data-tier]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.tier===tier));
      const notice=document.createElement('div');notice.className='world3d-loading';notice.textContent='กำลังโหลดโมเดล…';stage.host.append(notice);
      try{const asset=await acquire(id,tier);if(viewer!==view||v!==view.version){asset.release();return;}view.actor?.dispose();stage.actors.clear();const actor=new Actor(asset,{id},stage);view.actor=actor;stage.actors.set('hero',actor);actor.root.scale.setScalar(1);stage.camera.position.set(3.8,3.2,7);stage.controls.target.set(0,1.6,0);stage.controls.update();el.querySelectorAll('[data-animation]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.animation==='Idle'));}
      catch(e){if(viewer===view)api.toast('โหลดโมเดลไม่สำเร็จ กรุณาลองอีกครั้ง');console.error(e);}finally{notice.remove();}
    };
    el.querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>load(+b.dataset.tier));
    el.querySelectorAll('[data-animation]').forEach(b=>b.onclick=()=>{view.actor?.play(b.dataset.animation);el.querySelectorAll('[data-animation]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
    el.querySelector('[data-signature3d]')?.addEventListener('click',()=>{if(view.actor){view.actor.play('Attack',.8);stage.signature(view.actor,[{root:{position:new T.Vector3(0,0,2.0)}}]);}});
    await load(Math.max(1,api.evolution(id,api.state().heroes[id]?.aw||0)));
  }catch(e){api.toast('เปิดตัวแสดงผล 3D ไม่สำเร็จ');console.error(e);closeViewer();}
}

window.Samkok3D={battle,action:(a,dt)=>current?.action(a,dt),hits:a=>current?.hits(a),outcome:s=>current?.outcome(s),openViewer,closeViewer,models:MODEL_MAP,diagnostics:()=>({kind:current?.kind,actors:current?.actors.size||0,cache:cache.size,renderer:current?.renderer.info.render,viewer:!!viewer,viewerActions:viewer?.actor?Object.keys(viewer.actor.actions):[],adaptiveBudget,pixelRatio:current?.renderer.getPixelRatio()})};
const brand=document.createElement('div');brand.className='remake-brand';brand.innerHTML='<b>ขุนพลสามก๊ก 3D</b><span class="cloud3d-status" role="status"></span><button data-quality3d>3D · '+quality()+'</button>';document.querySelector('#app')?.prepend(brand);
function updateCloudBadge(){const c=api.cloud?.();const b=brand.querySelector('.cloud3d-status');b.textContent=c?.conflict?'เซฟชนกัน':c?.error?'เซฟในเครื่อง':c?.online?(c.revision>0?'ออนไลน์ · บันทึกแล้ว':'ออนไลน์ · รอบันทึก'):window.SAMKOK_3D_CONFIG?.online?'กำลังเชื่อมต่อ':'ออฟไลน์';}
window.addEventListener('samkok:cloud-status',updateCloudBadge);updateCloudBadge();
window.addEventListener('samkok:render',()=>mountScreen());
window.addEventListener('samkok:close',()=>{++mountVersion;stopCurrent();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&viewer){const focus=viewer.returnFocus;closeViewer();focus?.focus();}
  if(e.key==='Tab'&&viewer){const items=[...viewer.el.querySelectorAll('button')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
// Quality changes recreate only the presentation; the save and battle outcome are unaffected.
document.addEventListener('click',e=>{const b=e.target.closest('[data-quality3d]');if(!b)return;const values=['auto','low','standard','high'];localStorage.setItem('samkok-3d-quality',values[(values.indexOf(quality())+1)%values.length]);b.textContent='3D · '+quality();mountScreen();});
mountScreen();
