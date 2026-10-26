// Run explicitly with NODE_USE_ENV_PROXY=1 when the environment uses an HTTP proxy.
import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const url='https://wkbpbihsdymjwapqgvpp.supabase.co',key='sb_publishable_ijZfKYH1VFsmd4BOIsL5oQ_GTCWQlUn';
const clients=[],users=[],checks=[];
const diagnosticFetch=async(input,init={})=>{const signal=init.signal?AbortSignal.any([init.signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000);const r=await fetch(input,{...init,signal});return r;};
try{
 for(let i=0;i<3;i++){
  const c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:diagnosticFetch}});clients.push(c);const r=await c.auth.signInAnonymously();assert.equal(r.error,null);users.push(r.data.user.id);writeFileSync(join(tmpdir(),'samkok3d-api-fixtures.json'),JSON.stringify(users));
  const p=await c.from('samkok3d_players').upsert({id:r.data.user.id,name:'QA3D-'+i,doc:{v:1,team:[],guild:null,msgs:[]}});assert.equal(p.error,null);
 }
 checks.push('anonymous auth and isolated profiles');
 const [a,b,c]=clients,[uid]=users;const payload={v:1,stage:5,gold:123,heroes:{liubei_y:{lv:3,star:1}},team:['liubei_y',null,null,null,null,null]};
 const saved=await a.rpc('save_3d_game',{p_data:payload,p_revision:0});assert.equal(saved.error,null);assert.equal(saved.data.revision,1);checks.push('first cloud save');
 const read=await a.from('samkok3d_saves').select('data,revision').eq('user_id',uid).single();assert.equal(read.data.data.gold,123);
 const hidden=await b.from('samkok3d_saves').select('data').eq('user_id',uid);assert.equal(hidden.error,null);assert.equal(hidden.data.length,0);checks.push('foreign private save is unreadable');
 const tamper=await b.from('samkok3d_saves').upsert({user_id:uid,data:{...payload,gold:99999}});assert.ok(tamper.error);checks.push('foreign write rejected');
 const stale=await a.rpc('save_3d_game',{p_data:{...payload,gold:0},p_revision:0});assert.equal(stale.error,null);assert.equal(stale.data.conflict,true);const intact=await a.from('samkok3d_saves').select('data').eq('user_id',uid).single();assert.equal(intact.data.data.gold,123);checks.push('stale revision preserves current save');
 const changed=await a.rpc('save_3d_game',{p_data:{...payload,stage:6},p_revision:1});assert.equal(changed.error,null);assert.equal(changed.data.revision,2);
 const code=await a.rpc('make_3d_transfer_code');assert.equal(code.error,null);assert.match(code.data,/^[A-F0-9]{18}$/);
 const claim=await b.rpc('claim_3d_transfer',{p_code:code.data});assert.equal(claim.error,null);assert.equal(claim.data.data.stage,6);
 const replay=await c.rpc('claim_3d_transfer',{p_code:code.data});assert.ok(replay.error);checks.push('one-time cross-device transfer and replay rejection');
 const guest=createClient(url,key,{auth:{persistSession:false}});const unauth=await guest.from('samkok3d_saves').select('data');assert.ok(unauth.error);checks.push('unsigned API client denied private saves');
 writeFileSync('artifacts/online-report.json',JSON.stringify({status:'PASS',checks,productionTablesModified:false},null,2));console.log(JSON.stringify({status:'PASS',checks}));
}finally{for(const c of clients)await c.auth.signOut();}
