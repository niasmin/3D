const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:640,height:480}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('samkok-3d-offline','1');localStorage.setItem('samkok-3d-quality','low')});
 await p.clock.install();
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8000/');await p.waitForFunction(()=>window.Samkok3D?.diagnostics().kind==='city');
 await p.evaluate(async()=>{
  const host=document.createElement('div');host.className='field';host.style.cssText='position:fixed;inset:0;height:480px;z-index:10000';document.body.append(host);
  await Samkok3D.battle([{id:'liubei_y',uid:'p0',side:'p',slot:0,max:1000},{id:'guanyu',uid:'e0',side:'e',slot:2,max:1000},{id:'huangzhong',uid:'p3',side:'p',slot:3,max:1000}],'village');
 });
 await p.clock.pauseAt(await p.evaluate(()=>Date.now()+1000));
 const checks=[];
 async function attack(src,tgt,dt,melee){
  const home=await p.evaluate(src=>Samkok3D.diagnostics().combatants.find(a=>a.uid===src).position,src);
  await p.evaluate(({src,tgt,dt})=>Samkok3D.action({src,hits:[{tgt,dmg:100,hp:900}]},dt),{src,tgt,dt});
  await p.clock.runFor(Math.ceil(dt*.3));
  const result=await p.evaluate(({src,tgt,home})=>{
   Samkok3D.hits({src,hits:[{tgt,dmg:100,hp:900}]});
   const units=Samkok3D.diagnostics().combatants;
   return {home,contact:units.find(a=>a.uid===src),target:units.find(a=>a.uid===tgt)};
  },{src,tgt,home});
  if(src==='p0'&&dt===700)await p.screenshot({path:'artifacts/melee-contact.png'});
  await p.clock.runFor(Math.ceil(dt*.8+100));
  result.returned=await p.evaluate(src=>Samkok3D.diagnostics().combatants.find(a=>a.uid===src),src);
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
  if(melee){assert.ok(distance(result.home,result.contact.position)>1);assert.ok(Math.abs(distance(result.contact.position,result.target.position)-1.35)<.01);assert.equal(result.contact.animation,'Attack');}
  else assert.ok(distance(result.home,result.contact.position)<.001);
  assert.ok(distance(result.home,result.returned.position)<.001,JSON.stringify(result));assert.equal(result.returned.moving,false);
  checks.push(`${src} ${melee?'melee contact and return':'ranged stationary'} ${dt}ms`);
 }
 for(const dt of [700,350,700/3])await attack('p0','e0',dt,true);
 await attack('e0','p0',700,true);await attack('p3','e0',700,false);
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/melee-browser-report.json',JSON.stringify({status:'PASS',checks,pageErrors:errors},null,2));console.log({status:'PASS',checks});await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
