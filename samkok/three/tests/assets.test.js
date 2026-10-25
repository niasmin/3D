import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { MODEL_MAP, modelPath, unitPosition } from '../src/layout.js';
const web=new URL('../../web/',import.meta.url);

test('every playable general and the guild boss resolves to three existing models',()=>{
  const html=readFileSync(new URL('index.html',web),'utf8');
  const data=html.slice(html.indexOf('const HEROES ='),html.indexOf('\n];',html.indexOf('const HEROES =')));
  const ids=[...data.matchAll(/id:'([^']+)'/g)].map(m=>m[1]);
  assert.equal(ids.length,64);
  for(const id of [...ids,'boss'])for(const tier of [1,2,3]){
    const file=readFileSync(new URL(modelPath(id,tier),web));assert.equal(file.readUInt32LE(0),0x46546c67);
  }
});
test('all 204 glTF binaries have a skin, mesh and three independent nonempty clips',()=>{
  const dir=new URL('models/',web),files=readdirSync(dir).filter(f=>f.endsWith('.glb'));assert.equal(files.length,204);
  for(const name of files){
    const b=readFileSync(new URL(name,dir));assert.equal(b.readUInt32LE(4),2,name);assert.equal(b.readUInt32LE(8),b.length,name);
    const d=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
    assert.equal(d.skins.length,1,name);assert.ok(d.skins[0].joints.length>=20,name);
    assert.ok(d.meshes.length>0,name);assert.deepEqual(d.animations.map(a=>a.name).sort(),['Attack','Idle','Walk'],name);
    for(const a of d.animations)assert.ok(a.channels.length>0&&a.samplers.length>0,name);
    for(const primitive of d.meshes.flatMap(m=>m.primitives)){
      assert.notEqual(primitive.attributes.JOINTS_0,undefined,name);assert.notEqual(primitive.attributes.WEIGHTS_0,undefined,name);
    }
  }
});
test('both six-slot formations have distinct ranks, lanes and a clear battle gap',()=>{
  const points=[];
  for(const side of ['p','e'])for(let slot=0;slot<6;slot++){
    const p=unitPosition(side,slot);points.push(JSON.stringify(p));assert.equal(Math.sign(p.z),side==='p'?1:-1);
    if(slot>=3)assert.ok(Math.abs(p.z)>Math.abs(unitPosition(side,slot-3).z));
  }
  assert.equal(new Set(points).size,12);assert.throws(()=>unitPosition('p',6));assert.throws(()=>modelPath('missing'));
  assert.ok(modelPath('guanyu',99).endsWith('-e3.glb'));assert.ok(Object.isFrozen(MODEL_MAP));
});
test('the fork uses a separate save and does not connect to the production backend by default',()=>{
  const html=readFileSync(new URL('index.html',web),'utf8'),config=readFileSync(new URL('three/config.js',web),'utf8'),sw=readFileSync(new URL('sw.js',web),'utf8');
  assert.match(html,/SAVE_KEY='kunphon-samkok-3d-v1'/);assert.match(config,/online:false/);
  assert.match(sw,/samkok3d-/);assert.match(sw,/registration.scope/);
});
