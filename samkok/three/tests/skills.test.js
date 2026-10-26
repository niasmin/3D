import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {SKILLS,skillProfile,skillPlan,SkillDirector} from '../src/skills.js';

test('each playable hero and boss has a named, reference-linked skill recipe',()=>{
 const html=readFileSync(new URL('../../web/index.html',import.meta.url),'utf8');
 const source=html.slice(html.indexOf('const HEROES ='),html.indexOf('const HERO ='));
 const heroes=[...source.matchAll(/\{id:'([^']+)'[^\n]+sk:'([^']+)'/g)];assert.equal(heroes.length,64);
 assert.equal(Object.keys(SKILLS).length,65);assert.equal(new Set(Object.values(SKILLS).map(p=>p.variant)).size,65);assert.equal(new Set(Object.values(SKILLS).map(p=>[p.cast,p.travel,p.impact,p.count].join('/'))).size,65);
 for(const [,id,title] of heroes){assert.equal(skillProfile(id).title,title,id);assert.ok(skillProfile(id).reference>=1&&skillProfile(id).reference<=68,id);}
 assert.equal(skillProfile('boss').travel,'meteors');assert.equal(skillProfile('missing'),null);assert.throws(()=>skillPlan('missing'));
});

test('all recipes build finite geometry, honor impact beats, anchor every target, and release resources',()=>{
 const camera=new T.PerspectiveCamera();const source=new T.Vector3(-2,.07,3),targets=[new T.Vector3(2,.07,-3),new T.Vector3(4,.07,-1)];
 for(const id of Object.keys(SKILLS)){
  const scene=new T.Scene(),d=new SkillDirector(scene),seq=d.begin({id,source:()=>source,targets:targets.map(position=>({position})),tier:3,dt:1000});
  assert.equal(seq.burst.visible,false,id);d.update(seq.start+180,camera);assert.equal(d.last.phase,'release',id);
  const moved=targets.map(p=>({position:p.clone().add(new T.Vector3(.3,0,-.2))}));seq.impact(seq.start+300,moved);d.update(seq.start+650,camera);
  assert.equal(seq.burst.visible,true,id);assert.ok(seq.particleData.every((p,i)=>p.target.distanceTo(moved[i%moved.length].position)<1e-6),id+' particles follow actual hit positions');for(let i=0;i<moved.length;i++)assert.ok(seq.burst.children[i].position.distanceTo(moved[i].position)<1e-6,id+' target must not orbit world origin');
  const geometry=new Set(),materials=new Set();seq.group.traverse(o=>{
   if(o.geometry){geometry.add(o.geometry);for(const attr of Object.values(o.geometry.attributes))assert.ok(attr.array.every(Number.isFinite),id+' finite geometry');}
   if(o.material)materials.add(o.material);
   if(o.isInstancedMesh)assert.ok(o.instanceMatrix.array.every(Number.isFinite),id+' finite transforms');
  });
  let disposed=0;for(const r of [...geometry,...materials])r.addEventListener('dispose',()=>disposed++);
  d.update(seq.start+1500,camera);assert.equal(d.sequences.length,0,id);assert.equal(scene.children.length,0,id);assert.equal(disposed,geometry.size+materials.size,id);
  assert.deepEqual(d.events.map(e=>e.phase),['cast','release','impact','complete'],id);d.dispose();
 }
});

test('healing, self targets, low quality and reduced motion keep targets and bounded lifetimes',()=>{
 for(const reducedMotion of [true,false]){
  const scene=new T.Scene(),d=new SkillDirector(scene,{quality:'low',reducedMotion}),pos=new T.Vector3(0,.07,0),p=skillPlan('caiwenji',{quality:'low',reducedMotion,tier:99,targetCount:6});
  assert.equal(p.tier,3);assert.ok(p.count<=5);assert.ok(p.particles<=8);
  const seq=d.begin({id:'caiwenji',tier:3,source:()=>pos,targets:Array.from({length:6},(_,i)=>({position:new T.Vector3(i*.4,.07,0),heal:true})),dt:233,autoImpact:true});
  d.update(seq.start+80,new T.PerspectiveCamera());assert.equal(d.last.phase,'impact');assert.equal(seq.burst.children.length,6);
  if(reducedMotion){assert.equal(seq.particles,undefined);assert.equal(seq.flight.visible,false);}
  d.update(seq.start+1500,new T.PerspectiveCamera());assert.equal(d.sequences.length,0);d.dispose();
 }
});

test('repeated previews and overlapping battle skills cannot grow unbounded scene resources',()=>{
 const scene=new T.Scene(),d=new SkillDirector(scene,{quality:'low'}),source=new T.Vector3();
 for(let i=0;i<30;i++)d.begin({id:i%2?'guanyu':'zhouyu',source:()=>source,targets:[{position:new T.Vector3(0,0,3)}],dt:700});
 assert.equal(d.sequences.length,1);assert.equal(scene.children.length,1);assert.ok(d.events.length<=48);
 d.clear();assert.equal(scene.children.length,0);d.dispose();
});
