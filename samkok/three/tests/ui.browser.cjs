// Measure usability constraints against rendered DOM/cameras, not CSS source strings.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});const errors=[],checks=[];fs.mkdirSync('artifacts/ui',{recursive:true});
 try{
 for(const [name,width,height] of [['small',320,568],['mobile',390,844],['tablet',768,1024],['desktop',1280,900],['landscape',844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:width<800,isMobile:width<800});p.on('pageerror',e=>errors.push(name+': '+e.message));await p.addInitScript(()=>{localStorage.setItem('samkok-3d-offline','1');localStorage.setItem('samkok-3d-quality','low')});
  await p.goto(process.env.TEST_URL||'http://127.0.0.1:8000/');await p.waitForFunction(()=>window.Samkok3D?.diagnostics().kind==='city');await p.locator('[data-act=tutskip]').click();await p.waitForTimeout(250);
  const city=await p.evaluate(()=>{
   const main=document.querySelector('#view'),nav=document.querySelector('#nav'),r=main.getBoundingClientRect();main.scrollTop=main.scrollHeight;
   return {mainBottom:r.bottom,navTop:nav.getBoundingClientRect().top,scrollPadding:parseFloat(getComputedStyle(main).paddingBottom),overflow:document.documentElement.scrollWidth>innerWidth,navTargets:[...nav.querySelectorAll('button')].map(el=>({w:el.offsetWidth,h:el.offsetHeight})),labels:[...document.querySelectorAll('.city [data-go]')].map(el=>({h:el.offsetHeight}))};
  });
  assert.equal(city.overflow,false,name+' horizontal overflow');assert.ok(city.mainBottom<=city.navTop+1,name+' nav has its own layout space');assert.ok(city.scrollPadding>=24);assert.ok(city.navTargets.every(r=>r.w>=44&&r.h>=44));assert.ok(city.labels.every(r=>r.h>=44));
  await p.evaluate(()=>document.querySelector('#view').scrollTop=0);await p.screenshot({path:`artifacts/ui/city-${name}.png`});
  await p.evaluate(()=>SamkokGame.navigate('camp'));await p.waitForFunction(()=>Samkok3D.diagnostics().actors>0);await p.locator('[data-act=fight]').click();await p.waitForFunction(()=>Samkok3D.diagnostics().kind==='battle'&&Samkok3D.diagnostics().actors===3);await p.evaluate(()=>(clearTimeout(SamkokGame.battle().timer),document.querySelector('.battle').classList.remove('intro')));await p.waitForTimeout(100);
  const battle=await p.evaluate(()=>({framing:Samkok3D.diagnostics().framing,layout:Samkok3D.diagnostics().layout,hint:document.querySelector('.autohint').scrollWidth<=document.querySelector('.autohint').clientWidth+1,font:parseFloat(getComputedStyle(document.querySelector('.field .u .n')).fontSize),targets:[...document.querySelectorAll('.bctl button,.bpanel #useSk,.bpanel .tgl')].map(el=>({w:el.offsetWidth,h:el.offsetHeight}))}));
  assert.ok(battle.font>=12);assert.equal(battle.hint,true,name+' hint must wrap');assert.ok(battle.targets.every(r=>r.w>=44&&r.h>=44));
  if(name==='landscape')assert.ok(Math.min(...battle.layout.units.map(u=>u.pixels))>=70,'landscape battle reserves space beside its commands');
  if(name==='mobile')assert.ok(Math.min(...battle.layout.units.map(u=>u.pixels))>=90,'three-unit mobile battle actors are readable');
  await p.screenshot({path:`artifacts/ui/battle-${name}.png`});await p.locator('[data-act=skip]').click();await p.waitForSelector('.result');await p.locator('[data-act=endbattle]').click();
  await p.evaluate(()=>Samkok3D.openViewer('guanyu'));await p.waitForFunction(()=>!document.querySelector('.remake-viewer .world3d-loading'));
  const start=await p.evaluate(()=>Samkok3D.diagnostics().viewerDistance);await p.locator('[data-viewcontrol=in]').click();const zoom=await p.evaluate(()=>Samkok3D.diagnostics().viewerDistance);assert.ok(zoom<start*.95);await p.locator('[data-viewcontrol=reset]').click();assert.ok(Math.abs(await p.evaluate(()=>Samkok3D.diagnostics().viewerDistance)-start)<.05);
  assert.equal(await p.locator('.pose3d-more').getAttribute('open'),null);await p.locator('.pose3d-more summary').click();await p.locator('[data-animation=Victory]').click();assert.equal(await p.locator('[data-animation=Victory]').getAttribute('aria-pressed'),'true');await p.locator('.pose3d-more summary').click();
  const viewer=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,targets:[...document.querySelectorAll('.remake-viewer button,.remake-viewer summary')].filter(el=>el.getClientRects().length).map(el=>({w:el.offsetWidth,h:el.offsetHeight})),primary:getComputedStyle(document.querySelector('[data-signature3d]')).backgroundImage}));assert.equal(viewer.overflow,false);assert.ok(viewer.targets.every(r=>r.w>=44&&r.h>=44),name+' visible viewer targets >=44px');assert.notEqual(viewer.primary,'none');
  assert.ok(await p.evaluate(()=>Samkok3D.diagnostics().viewerFrames>=2),'viewer has rendered after loading/resizing');await p.screenshot({path:`artifacts/ui/viewer-${name}.png`});await p.locator('[data-signature3d]').click();await p.waitForFunction(()=>Samkok3D.diagnostics().skills.active>0);await p.locator('[data-viewcontrol=reset]').click();assert.equal(await p.evaluate(()=>Samkok3D.diagnostics().skills.active),0);checks.push({viewport:name,city,battle,viewer});await p.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/ui-report.json',JSON.stringify({status:'PASS',checks,pageErrors:errors,physicalPhone:'NOT_CHECKED'},null,2));console.log({status:'PASS',viewports:checks.map(c=>c.viewport)});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
