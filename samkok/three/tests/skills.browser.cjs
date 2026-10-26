// Effect-only WebGL coverage; real game integration is a separate test.
const {chromium}=require('playwright'),{build}=require('esbuild');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const source=path.resolve('three/src/skills.js');
 const bundle=await build({stdin:{contents:`export * from ${JSON.stringify(source)};export * as THREE from 'three';`,resolveDir:path.dirname(source)},bundle:true,format:'esm',write:false});
 const html=fs.readFileSync(path.join(__dirname,'skill-lab.html'));
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].contents:html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:640,height:480}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.FXLab);
  const ids=await page.evaluate(()=>FXLab.ids);assert.equal(ids.length,65);fs.mkdirSync('artifacts/skills',{recursive:true});const results=[];
  for(const id of ids){
   await page.evaluate(id=>FXLab.play(id),id);const release=await page.evaluate(()=>FXLab.step(220));assert.equal(release.fx.last.phase,'release',id);
   const impact=await page.evaluate(()=>FXLab.step(350));assert.equal(impact.fx.last.phase,'impact',id);await page.screenshot({path:`artifacts/skills/${id}.png`});
   const done=await page.evaluate(()=>FXLab.step(1500));assert.equal(done.fx.active,0,id);assert.ok(done.memory.geometries<=2,id+' releases GPU geometry');assert.ok(done.memory.textures<=1,id+' bounded texture ownership');
   results.push({id,variant:impact.fx.last.variant,calls:impact.calls,triangles:impact.triangles,remainingGeometries:done.memory.geometries});if(results.length%10===0)console.log('SKILLS_RENDERED',results.length);
  }
  for(const reduced of [false,true]){
   await page.evaluate(reduced=>FXLab.play('caiwenji','low',reduced),reduced);const shot=await page.evaluate(()=>FXLab.step(350));assert.equal(shot.fx.last.phase,'impact');await page.screenshot({path:`artifacts/skills/${reduced?'reduced-motion':'low-quality'}.png`});await page.evaluate(()=>FXLab.step(1500));
  }
  assert.deepEqual(errors,[]);const memory=await page.evaluate(()=>FXLab.done());assert.equal(memory.textures,0);
  fs.writeFileSync('artifacts/skills-webgl-report.json',JSON.stringify({status:'PASS',coverage:'effect-only WebGL harness; game integration reported separately',profiles:results.length,pageErrors:errors,finalMemory:memory,results},null,2));console.log({status:'PASS',profiles:ids.length,finalMemory:memory});
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
