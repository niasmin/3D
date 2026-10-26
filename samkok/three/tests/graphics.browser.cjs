const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('samkok-3d-offline','1');localStorage.setItem('samkok-3d-quality','standard')});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Samkok3D);
 for(const id of ['liubei_y','guanyu','zhangfei','zhaoyun','zhuge']){
  await page.evaluate(id=>Samkok3D.openViewer(id),id);await page.waitForSelector('.remake-viewer canvas');await page.waitForFunction(()=>!document.querySelector('.remake-viewer .world3d-loading'));
  assert.equal(await page.evaluate(()=>Samkok3D.diagnostics().viewerActions.length),7);
  if(id==='liubei_y')for(const action of ['Hit','Block','Defeat','Victory']){await page.locator(`[data-animation="${action}"]`).click();await page.waitForTimeout(200);assert.equal(await page.locator(`[data-animation="${action}"]`).getAttribute('aria-pressed'),'true');}
  await page.locator('[data-animation="Idle"]').click();await page.screenshot({path:`artifacts/hero-${id}-v3.png`});await page.locator('[data-signature3d]').click();await page.waitForTimeout(150);await page.screenshot({path:`artifacts/skill-${id}-v3.png`});checks.push(id+' identity, seven poses and signature effect');await page.locator('[data-close3d]').click();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/graphics-v3-report.json',JSON.stringify({status:'PASS',checks,pageErrors:errors,renderer:'Chromium software WebGL; physical phone GPU not measured'},null,2));console.log(JSON.stringify({status:'PASS',checks}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
