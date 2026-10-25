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
test('all 204 hero glTF binaries and the beast boss have rigging and three nonempty clips',()=>{
  const dir=new URL('models/',web),files=readdirSync(dir).filter(f=>f.endsWith('.glb'));assert.equal(files.length,205);
  for(const name of files){
    const b=readFileSync(new URL(name,dir));assert.equal(b.readUInt32LE(4),2,name);assert.equal(b.readUInt32LE(8),b.length,name);
    const d=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
    assert.ok(d.nodes.some(n=>n.extras?.graphics_revision===2),name+' must use the revised native asset');
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
  assert.ok(modelPath('guanyu',99).includes('-e3.glb?'));assert.ok(Object.isFrozen(MODEL_MAP));
});
test('representative heroes export the intended weapons and role-specific attack motion',()=>{
  const read=id=>{const b=readFileSync(new URL(modelPath(id,1),web));const length=b.readUInt32LE(12);return {b,d:JSON.parse(b.subarray(20,20+length)),bin:28+length};};
  for(const [id,weapon] of [['liubei_y','blade'],['zhaoyun','spear'],['zhuge','fan'],['huangzhong','bow'],['huatuo','staff']]){
    assert.ok(read(id).d.nodes.some(n=>n.extras?.weapon===weapon),id);
  }
  const forearm=id=>{const {b,d,bin}=read(id),a=d.animations.find(a=>a.name==='Attack');const channel=a.channels.find(c=>c.target.path==='rotation'&&d.nodes[c.target.node].name==='forearm.R');assert.ok(channel,id);const accessor=d.accessors[a.samplers[channel.sampler].output],view=d.bufferViews[accessor.bufferView],offset=bin+(view.byteOffset||0)+(accessor.byteOffset||0);return b.subarray(offset,offset+accessor.count*16).toString('hex');};
  assert.notEqual(forearm('huangzhong'),forearm('liubei_y'));
  assert.ok(read('boss').d.nodes.some(n=>n.extras?.asset_kind==='original horned lion guardian'));
});
test('the fork uses a separate save and does not connect to the production backend by default',()=>{
  const html=readFileSync(new URL('index.html',web),'utf8'),config=readFileSync(new URL('three/config.js',web),'utf8'),sw=readFileSync(new URL('sw.js',web),'utf8');
  assert.match(html,/SAVE_KEY='kunphon-samkok-3d-v1'/);assert.match(config,/online:false/);
  assert.match(sw,/samkok3d-/);assert.match(sw,/registration.scope/);
});
