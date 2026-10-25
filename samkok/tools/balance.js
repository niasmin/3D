// Usage: node tools/balance.js <extracted game script> [days]  (extract the <script> blocks from web/index.html first)
// 30-day economy run: a scripted "average" player drives the real game code through its click handler
const fs=require('fs'); const code=fs.readFileSync(process.argv[2],'utf8');
const DAYS=+(process.argv[3]||30);
const el=()=>({innerHTML:'',textContent:'',value:'',style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains:()=>false},dataset:{},hidden:false,disabled:false,
  querySelector:()=>el(),querySelectorAll:()=>[],appendChild(){},insertAdjacentHTML(){},setAttribute(){},remove(){},focus(){},select(){},addEventListener(){},isConnected:false,scrollTop:0,getBoundingClientRect:()=>({left:0,top:0,width:1,height:1})});
const handlers={};
global.document={querySelector:()=>el(),querySelectorAll:()=>[],createElement:()=>el(),body:el(),addEventListener:(t,f)=>handlers[t]=f,hidden:false};
const store={}; global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v};
global.window={}; global.requestAnimationFrame=()=>1; global.cancelAnimationFrame=()=>{}; global.setInterval=()=>0; global.setTimeout=()=>0; global.clearTimeout=()=>{};
const RD=Date; let OFF=0;
global.Date=class extends RD{constructor(...a){a.length?super(...a):super(RD.now()+OFF)} static now(){return RD.now()+OFF}};
global.navigator={};
eval(code+`
const act=(a,d={})=>handlers.click({target:{closest:s=>s==='[data-act]'?{dataset:{act:a,...d},classList:{contains:()=>false},textContent:'',setAttribute(){},querySelector:()=>el()}:null}});
const fightOnce=m=>{ const st=S.stage, tw=S.tower; B=null; try{ fight(m); if(B&&!B.done) skip() }catch(e){ console.log('fight err',m,e.message) } return m==='tower'?S.tower>tw:S.stage>st };
S.tut=99;
const log=[];
for(let day=1; day<=${DAYS}; day++){
  OFF=(day-1)*864e5; render();
  S.afkSince=Date.now()-12*3600e3; act('afk');
  for(let i=0;i<7;i++) act('loginclaim',{i:String(i)});
  if(S.freeDate!==today()) act('pull1');
  while(S.gems>=2700+500) act('pull10');
  if(S.bag.selSP){ /* choose first S+ we lack */ }
  act('potion'); act('autoteam');
  for(const id of Object.keys(S.heroes)) act('starup',{id});
  const lvl=()=>{ for(let k=0;k<6;k++) act('lvall'); for(const id of S.team.filter(Boolean)) act('autogear',{id}) };
  lvl();
  let losses=0; for(let i=0;i<40&&losses<2;i++){ if(fightOnce('stage')) lvl(); else losses++ }
  for(let i=0;i<8;i++){ if(!fightOnce('tower')) break; lvl() }
  for(let i=0;i<5;i++){ const o=arenaOpps()[2]; if(!o) break; act('arenafight',{bot:String(o.i)}); if(B&&!B.done) skip() }
  for(let i=0;i<3;i++){ act('train'); if(B&&!B.done) skip() }
  act('potion'); lvl();
  for(const t of TASKS) act('task',{k:t.k}); act('task',{k:'all'});
  const tm=S.team.filter(Boolean).map(id=>S.heroes[id]);
  log.push({day, stage:stageLabel(S.stage), tower:S.tower, power:teamPower(), avgLv:Math.round(avgTeamLv()), stars:tm.map(h=>h.star).join(''), heroes:Object.keys(S.heroes).length, gold:S.gold, exp:S.exp, gems:S.gems, pulls:S.pulls});
}
console.table(log);
`);
