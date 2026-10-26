// Real anonymous auth and cloud-save UI. Presentation is disabled to isolate network/state tests.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage'],...(proxy?{proxy:{server:proxy,bypass:'localhost,127.0.0.1'}}:{})});
 const ids=[],errors=[],requests=[],checks=[];const url=process.env.TEST_URL||'http://127.0.0.1:8000/';
 async function open(context){
  const p=await context.newPage();await p.route('**/three/game3d.js*',r=>r.fulfill({contentType:'text/javascript',body:'// Renderer omitted for cloud QA.'}));
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().includes('/rest/v1/'))requests.push(new URL(r.url()).pathname)});
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.SamkokGame?.cloud().ready&&SamkokGame.cloud().loaded,null,{timeout:60000});
  await p.evaluate(()=>clearTimeout(cloudT));const id=await p.evaluate(()=>NET.me);ids.push(id);fs.writeFileSync(require('node:path').join(require('node:os').tmpdir(),'samkok3d-browser-fixtures.json'),JSON.stringify([...new Set(ids)]));return p;
 }
 async function put(p,gold){return p.evaluate(async gold=>{const s=SamkokGame.state();s.gold=gold;s.pname='QA3D_BROWSER';return await SamkokGame.cloudSave();},gold);}
 const ca=await browser.newContext({viewport:{width:900,height:900}}),a=await open(ca);assert.equal(await put(a,23456),true);checks.push('browser cloud upload');
 await a.reload({waitUntil:'domcontentloaded'});await a.waitForFunction(()=>window.SamkokGame?.cloud().ready&&SamkokGame.cloud().loaded);await a.evaluate(()=>clearTimeout(cloudT));assert.equal(await a.evaluate(()=>SamkokGame.state().gold),23456);checks.push('reload preserves cloud/local progress');
 const cb=await browser.newContext({storageState:await ca.storageState()}),b=await open(cb);
 assert.equal(await put(a,30000),true);assert.equal(await put(b,40000),false);assert.equal(await b.evaluate(()=>SamkokGame.cloud().conflict),true);
 await b.evaluate(async()=>{await SamkokGame.chooseCloud(true);clearTimeout(cloudT)});assert.equal(await b.evaluate(()=>SamkokGame.state().gold),30000);assert.equal(await b.evaluate(()=>JSON.parse(localStorage.getItem('kunphon-samkok-3d-v1-cloud-backup')).data.gold),40000);checks.push('remote choice with local backup');
 assert.equal(await put(a,35000),true);assert.equal(await put(b,42000),false);await b.evaluate(async()=>{await SamkokGame.chooseCloud(false);clearTimeout(cloudT)});assert.equal(await b.evaluate(()=>SamkokGame.cloud().conflict),false);checks.push('explicit local choice resolves conflict');
 const cc=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),c=await open(cc);
 await b.evaluate(()=>SamkokGame.navigate('savegame'));await b.locator('[data-act="svtab"][data-k="acct"]').click();
 await b.screenshot({path:'artifacts/cloud-online.png'});await b.locator('[data-act="mktransfer"]').click();await b.waitForSelector('.tcode');const token=await b.locator('.tcode').innerText();assert.match(token,/^[A-F0-9]{18}$/);
 await c.evaluate(()=>SamkokGame.navigate('savegame'));await c.locator('[data-act="svtab"][data-k="acct"]').click();await c.locator('#tclaim').fill(token);await c.locator('[data-act="claimtransfer"]').click();await c.locator('[data-act="claimtransfer"]').click();
 await c.waitForFunction(()=>SamkokGame.state().gold===42000);checks.push('one-time transfer through the actual mobile UI');
 assert.deepEqual(errors,[]);assert.ok(requests.every(p=>p.includes('samkok3d_')||p.includes('/rpc/save_3d_game')||p.includes('/rpc/make_3d_transfer_code')||p.includes('/rpc/claim_3d_transfer')));
 fs.writeFileSync('artifacts/cloud-browser-report.json',JSON.stringify({status:'PASS',checks,pageErrors:errors,isolatedTablesOnly:true},null,2));console.log(JSON.stringify({status:'PASS',checks}));
 for(const p of [a,b,c]){await p.evaluate(()=>SB.auth.signOut()).catch(()=>{});}await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
