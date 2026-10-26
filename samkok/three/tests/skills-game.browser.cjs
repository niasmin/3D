// Actual game viewer controls, real rigs, battle action/hit bridge, and mobile UI.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
  const p=await b.newPage({viewport:{width:900,height:760}}),errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));
  await p.clock.install();await p.addInitScript(()=>{localStorage.setItem('samkok-3d-offline','1');localStorage.setItem('samkok-3d-quality','low')});
  await p.goto(process.env.TEST_URL||'http://127.0.0.1:8000/');await p.waitForFunction(()=>window.Samkok3D);await p.clock.pauseAt(await p.evaluate(()=>Date.now()+300));
  const state=await p.evaluate(()=>JSON.stringify(SamkokGame.state()));
  for(const id of ['guanyu','simayi','zhouyu','zhangjiao','huatuo','yueying','caiwenji','caoren','boss']){
   await p.evaluate(id=>Samkok3D.openViewer(id),id);await p.waitForFunction(()=>!document.querySelector('.remake-viewer .world3d-loading'));
   const btn=p.locator('[data-signature3d]');assert.equal(await btn.count(),1,id);await btn.evaluate(el=>el.click());
   const cast=await p.evaluate(()=>Samkok3D.diagnostics().skills);assert.equal(cast.last.phase,'cast');assert.equal(cast.last.id,id);
   await p.clock.runFor(240);assert.equal(await p.evaluate(()=>Samkok3D.diagnostics().skills.last.phase),'release');
   await p.clock.runFor(360);assert.equal(await p.evaluate(()=>Samkok3D.diagnostics().skills.last.phase),'impact');
   await p.screenshot({path:`artifacts/skills/game-${id}.png`});
   await p.clock.fastForward(1600);await p.clock.runFor(32);assert.equal(await p.evaluate(()=>Samkok3D.diagnostics().skills.active),0,id);
   if(id==='guanyu'){
    await p.locator('[data-tier="3"]').evaluate(el=>el.click());await p.waitForFunction(()=>!document.querySelector('.remake-viewer .world3d-loading'));await btn.evaluate(el=>el.click());assert.equal(await p.evaluate(()=>Samkok3D.diagnostics().skills.last.tier),3);await p.clock.fastForward(2000);
   }
   await p.locator('[data-close3d]').evaluate(el=>el.click());checks.push(id+' actual viewer cast/release/impact, cleanup and button wiring');
  }
  assert.equal(await p.evaluate(()=>JSON.stringify(SamkokGame.state())),state,'previews do not modify save/game state');
  // Two-target skill through the same action/hit bridge called by the battle engine.
  await p.evaluate(async()=>{const el=document.createElement('div');el.className='field';el.style.cssText='position:fixed;inset:0;z-index:10000;height:760px';document.body.append(el);await Samkok3D.battle([{id:'guanyu',uid:'p0',side:'p',slot:0,max:1000},{id:'xuchu',uid:'e0',side:'e',slot:0,max:1000},{id:'dianwei',uid:'e1',side:'e',slot:1,max:1000}],'village');window.testSkill={src:'p0',skill:SamkokGame.hero('guanyu').sk,hits:[{tgt:'e0',dmg:100,hp:900},{tgt:'e1',dmg:100,hp:900}]};Samkok3D.action(testSkill,700)});
  await p.clock.runFor(210);await p.evaluate(()=>Samkok3D.hits(testSkill));const battle=await p.evaluate(()=>Samkok3D.diagnostics().skills);assert.equal(battle.last.phase,'impact');assert.equal(battle.last.targetCount,2);assert.equal(battle.last.id,'guanyu');await p.screenshot({path:'artifacts/skills/game-battle-aoe.png'});checks.push('battle action/hit bridge emits impact at actual two targets');
  await p.close();
  const mobile=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.emulateMedia({reducedMotion:'reduce'});await mobile.clock.install();await mobile.addInitScript(()=>{localStorage.setItem('samkok-3d-offline','1');localStorage.setItem('samkok-3d-quality','low')});
  await mobile.goto(process.env.TEST_URL||'http://127.0.0.1:8000/');await mobile.waitForFunction(()=>window.Samkok3D);await mobile.clock.pauseAt(await mobile.evaluate(()=>Date.now()+300));await mobile.evaluate(()=>Samkok3D.openViewer('caiwenji'));await mobile.waitForFunction(()=>!document.querySelector('.remake-viewer .world3d-loading'));await mobile.locator('[data-signature3d]').evaluate(el=>el.click());await mobile.clock.runFor(500);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.screenshot({path:'artifacts/skills/game-mobile-reduced.png'});await mobile.clock.fastForward(1600);await mobile.clock.runFor(32);assert.equal(await mobile.evaluate(()=>Samkok3D.diagnostics().skills.active),0);checks.push('mobile skill title/button fit; reduced-motion playback completes');
  assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/skills-game-report.json',JSON.stringify({status:'PASS',checks,pageErrors:errors,physicalPhoneGpu:'NOT_CHECKED'},null,2));console.log({status:'PASS',checks});
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
