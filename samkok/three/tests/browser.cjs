// Run against `python3 -m http.server 8000 --directory web`.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const out=path.resolve('artifacts');fs.mkdirSync(out,{recursive:true});const errors=[],requests=[],results={};
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('supabase.co'))requests.push(r.url())});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.Samkok3D?.diagnostics().kind==='city');
 await page.locator('[data-act="tutskip"]').click();await page.waitForFunction(()=>Samkok3D.diagnostics().kind==='city');
 await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'city-desktop.png')});
 results.city=await page.evaluate(()=>Samkok3D.diagnostics());
 await page.evaluate(()=>SamkokGame.navigate('heroes'));await page.locator('[data-hero="liubei_y"]').first().click();
 await page.locator('[data-act="view3d"]').click();await page.waitForSelector('.remake-viewer canvas');
 await page.waitForFunction(()=>!document.querySelector('.remake-viewer .world3d-loading'));
 await page.locator('[data-tier="3"]').click();await page.waitForFunction(()=>!document.querySelector('.remake-viewer .world3d-loading'));
 await page.locator('[data-animation="Attack"]').click();assert.equal(await page.locator('[data-animation="Attack"]').getAttribute('aria-pressed'),'true');
 await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'hero-e3.png')});await page.locator('[data-close3d]').click();
 await page.evaluate(()=>Samkok3D.openViewer('boss'));await page.waitForSelector('.remake-viewer canvas');await page.waitForFunction(()=>!document.querySelector('.remake-viewer .world3d-loading'));
 await page.locator('[data-animation="Attack"]').click();await page.screenshot({path:path.join(out,'boss-viewer.png')});await page.locator('[data-close3d]').click();
 await page.evaluate(()=>SamkokGame.navigate('formation'));await page.waitForFunction(()=>Samkok3D.diagnostics().actors>0);await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'formation.png')});
 await page.evaluate(()=>SamkokGame.navigate('camp'));await page.waitForFunction(()=>Samkok3D.diagnostics().actors>0);
 const before=await page.evaluate(()=>({stage:SamkokGame.state().stage,gold:SamkokGame.state().gold}));
 await page.locator('[data-act="fight"]').click();await page.waitForFunction(()=>Samkok3D.diagnostics().kind==='battle'&&Samkok3D.diagnostics().actors>=3);
 await page.waitForTimeout(1700);await page.screenshot({path:path.join(out,'battle-desktop.png')});results.battle=await page.evaluate(()=>Samkok3D.diagnostics());
 await page.locator('[data-act="skip"]').click();await page.waitForSelector('.result');
 const after=await page.evaluate(()=>({stage:SamkokGame.state().stage,gold:SamkokGame.state().gold}));assert.equal(after.stage,before.stage+1);assert.ok(after.gold>before.gold);
 await page.locator('[data-act="endbattle"]').click();
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Samkok3D?.diagnostics().kind==='city');assert.equal(await page.evaluate(()=>SamkokGame.state().stage),after.stage);
 assert.equal(await page.evaluate(()=>localStorage.getItem('kunphon-samkok-v1')),null);
 await page.evaluate(()=>SamkokGame.navigate('summon'));const pulls=await page.evaluate(()=>SamkokGame.state().pulls);await page.locator('[data-act="pull1"]').click();assert.equal(await page.evaluate(()=>SamkokGame.state().pulls),pulls+1);await page.locator('.reveal [data-act="close"]').click();
 // Preserve the original balance: six player slots against five generated enemies.
 await page.evaluate(()=>{const s=SamkokGame.state();s.stage=31;s.team=['liubei_y','guanyu_y','zhangfei_y','zhuge','zhaoyun','huatuo'];for(const id of s.team)s.heroes[id]={lv:30,star:3,aw:1,copies:0,eq:{}};SamkokGame.navigate('camp')});
 await page.waitForFunction(()=>Samkok3D.diagnostics().actors===11);
 await page.screenshot({path:path.join(out,'full-formation.png')});
 results.fullFormation=await page.evaluate(()=>Samkok3D.diagnostics());
 await page.close(); // Release the desktop WebGL context before software mobile rendering.
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push('mobile: '+e.message));
 await mobile.goto(process.env.TEST_URL||'http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});await mobile.waitForFunction(()=>window.Samkok3D?.diagnostics().kind==='city');await mobile.locator('[data-act="tutskip"]').click();
 await mobile.screenshot({path:path.join(out,'city-mobile.png')});
 await mobile.evaluate(()=>SamkokGame.navigate('camp'));await mobile.waitForFunction(()=>Samkok3D.diagnostics().actors>0);await mobile.locator('[data-act="fight"]').click();await mobile.waitForFunction(()=>Samkok3D.diagnostics().kind==='battle'&&Samkok3D.diagnostics().actors>=3);await mobile.waitForTimeout(600);await mobile.screenshot({path:path.join(out,'battle-mobile.png')});
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 // Forced renderer startup failure must retain the playable original presentation.
 await mobile.locator('[data-act="skip"]').click();await mobile.waitForSelector('.result');await mobile.locator('[data-act="endbattle"]').click();
 await mobile.evaluate(()=>{HTMLCanvasElement.prototype.getContext=()=>null;SamkokGame.navigate('city')});await mobile.waitForTimeout(200);assert.equal(await mobile.locator('.city.has3d').count(),0);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);results.status='PASS';results.backendRequests=requests.length;results.pageErrors=errors;results.progression={before,after};
 fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
