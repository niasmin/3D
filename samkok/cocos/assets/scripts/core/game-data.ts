// @ts-nocheck -- ported unchanged from the web prototype; add types gradually.
// Pure game rules and data: no DOM, no engine calls. Safe to use from Cocos components and Node tests.

// ---------- pure game data & rules (no DOM) ----------
const FAC = {
  wei:{th:'วุย', ch:'魏'}, shu:{th:'จ๊ก', ch:'蜀'}, wu:{th:'ง่อ', ch:'吴'}, qun:{th:'อิสระ', ch:'群'}
};
// faction cycle: Wei beats Shu, Shu beats Wu, Wu beats Wei. Independents are neutral.
const BEATS = {wei:'shu', shu:'wu', wu:'wei'};
// Five skill types per general: normal attack, talent (by role), active skill, combo, divine base (needs awakening).
const TALENT = {
  war:'เกราะใจเหล็ก: รับความเสียหายลดลง 15%',
  cav:'สายตาเหยี่ยว: โอกาสคริติคอล 25% (ปกติ 12%)',
  arch:'มือแม่น: พลังโจมตี +10%',
  strat:'ตำราพิชัยสงคราม: สกิลแรงขึ้น 20%',
  heal:'มือหมอ: ทุกครั้งที่โจมตีปกติ ฟื้นพลังพันธมิตรที่เลือดน้อยที่สุด 50% ของพลังโจมตี'
};
const comboChance = role => role==='cav' ? 0.3 : 0.2;
const ROLE = {
  war:  {th:'นักรบ',   hp:1.30, atk:0.90, def:1.30, mdef:0.80, spd:95,  kind:'single', mult:2.4,  desc:m=>`ฟันศัตรูแถวหน้า 1 คน แรง ${m}% ของพลังโจมตี`},
  cav:  {th:'ทหารม้า', hp:1.05, atk:1.15, def:1.00, mdef:0.90, spd:120, kind:'back',   mult:2.6,  desc:m=>`ตีฝ่าแนวหน้าไปโจมตีศัตรูแถวหลัง 1 คน แรง ${m}%`},
  arch: {th:'นักธนู',  hp:0.85, atk:1.20, def:0.80, mdef:0.90, spd:110, kind:'aoe',    mult:0.85, desc:m=>`ยิงศัตรูทุกคนพร้อมกัน คนละ ${m}%`},
  strat:{th:'กุนซือ',  hp:0.85, atk:1.10, def:0.85, mdef:1.30, mag:true, spd:100, kind:'aoe',    mult:1.15, desc:m=>`ใช้กลยุทธ์โจมตีศัตรูทุกคน คนละ ${m}%`},
  heal: {th:'หมอ',     hp:0.95, atk:0.75, def:0.95, mdef:1.25, mag:true, spd:105, kind:'heal',   mult:1.8,  desc:m=>`ฟื้นพลังชีวิตฝ่ายเราทุกคน คนละ ${m}% ของพลังโจมตี`}
};
const RAR = {A:{label:'A', m:1.00, spd:0, sk:1.0}, S:{label:'S', m:1.25, spd:5, sk:1.1}, SP:{label:'S+', m:1.55, spd:10, sk:1.25}};
const HEROES = [
  // Shu
  {id:'liubei_y', th:'เล่าปี่วัยหนุ่ม',  en:'Young Liu Bei',  ch:'玄', fac:'shu', rar:'A',  role:'war',   sk:'ปณิธานใต้ต้นท้อ'},
  {id:'guanyu_y', th:'กวนอูวัยหนุ่ม',  en:'Young Guan Yu',  ch:'长', fac:'shu', rar:'A',  role:'war',   sk:'ง้าวพเนจร'},
  {id:'zhangfei_y',th:'เตียวหุยวัยหนุ่ม', en:'Young Zhang Fei',ch:'益', fac:'shu', rar:'A',  role:'cav',   sk:'คำรามแห่งตุ้นก้วน'},
  {id:'guanyu',  th:'กวนอู',        en:'Guan Yu',        ch:'羽', fac:'shu', rar:'SP', role:'war',   sk:'ง้าวมังกรเขียว'},
  {id:'zhuge',   th:'ขงเบ้ง',        en:'Zhuge Liang',    ch:'亮', fac:'shu', rar:'SP', role:'strat', sk:'ลมบูรพาเผาทัพ'},
  {id:'zhaoyun', th:'จูล่ง',          en:'Zhao Yun',       ch:'云', fac:'shu', rar:'S',  role:'cav',   sk:'ฝ่าทัพทุ่งเตียงปัน'},
  {id:'liubei',  th:'เล่าปี่',        en:'Liu Bei',        ch:'备', fac:'shu', rar:'S',  role:'war',   sk:'คุณธรรมรวมใจ'},
  {id:'machao',  th:'ม้าเฉียว',       en:'Ma Chao',        ch:'超', fac:'shu', rar:'S',  role:'cav',   sk:'ทวนม้าเหล็กแดนตะวันตก'},
  {id:'zhangfei',th:'เตียวหุย',       en:'Zhang Fei',      ch:'飞', fac:'shu', rar:'A',  role:'war',   sk:'คำรามสะท้านสะพาน'},
  {id:'huangzhong',th:'ฮองตง',       en:'Huang Zhong',    ch:'忠', fac:'shu', rar:'A',  role:'arch',  sk:'ศรเขาเตงกุนสัน'},
  // Wei
  {id:'caocao',  th:'โจโฉ',          en:'Cao Cao',        ch:'操', fac:'wei', rar:'SP', role:'strat', sk:'วีรบุรุษกลียุค'},
  {id:'simayi',  th:'สุมาอี้',        en:'Sima Yi',        ch:'懿', fac:'wei', rar:'SP', role:'strat', sk:'หมาป่าซ่อนเขี้ยว'},
  {id:'zhangliao',th:'เตียวเลี้ยว',   en:'Zhang Liao',     ch:'辽', fac:'wei', rar:'S',  role:'cav',   sk:'แปดร้อยทลายหับป๋า'},
  {id:'xiahoudun',th:'แฮหัวตุ้น',     en:'Xiahou Dun',     ch:'惇', fac:'wei', rar:'S',  role:'war',   sk:'ตาเดียวไม่ถอย'},
  {id:'xuchu',   th:'เคาทู',         en:'Xu Chu',         ch:'褚', fac:'wei', rar:'A',  role:'war',   sk:'พยัคฆ์คลั่ง'},
  {id:'dianwei', th:'เตียนอุย',       en:'Dian Wei',       ch:'韦', fac:'wei', rar:'A',  role:'war',   sk:'คู่ง้าวพิทักษ์นาย'},
  {id:'xunyu',   th:'ซุนฮก',         en:'Xun Yu',         ch:'彧', fac:'wei', rar:'A',  role:'heal',  sk:'แผนบำรุงทัพ'},
  // Wu
  {id:'zhouyu',  th:'จิวยี่',         en:'Zhou Yu',        ch:'瑜', fac:'wu',  rar:'SP', role:'strat', sk:'เพลิงผาแดง'},
  {id:'sunquan', th:'ซุนกวน',        en:'Sun Quan',       ch:'权', fac:'wu',  rar:'S',  role:'war',   sk:'ประมุขกังตั๋ง'},
  {id:'sunshangxiang',th:'ซุนซ่างเซียง',en:'Sun Shangxiang',ch:'香', fac:'wu',  rar:'S',  role:'arch',  sk:'ศรวิหคชาด'},
  {id:'lumeng',  th:'ลิบอง',         en:'Lü Meng',        ch:'蒙', fac:'wu',  rar:'A',  role:'cav',   sk:'ทัพเสื้อขาวข้ามน้ำ'},
  {id:'ganning', th:'กำเหลง',        en:'Gan Ning',       ch:'宁', fac:'wu',  rar:'A',  role:'arch',  sk:'ปล้นค่ายร้อยม้า'},
  {id:'daqiao',  th:'ไต้เกี้ยว',      en:'Da Qiao',        ch:'乔', fac:'wu',  rar:'A',  role:'heal',  sk:'บทเพลงสายน้ำ'},
  // Independents
  {id:'lubu',    th:'ลิโป้',          en:'Lü Bu',          ch:'布', fac:'qun', rar:'SP', role:'cav',   sk:'เทพสงครามบนหลังเซ็กเธาว์'},
  {id:'diaochan',th:'เตียวเสี้ยน',    en:'Diaochan',       ch:'蝉', fac:'qun', rar:'S',  role:'strat', sk:'ระบำจันทร์ลวงใจ'},
  {id:'dongzhuo',th:'ตั๋งโต๊ะ',       en:'Dong Zhuo',      ch:'卓', fac:'qun', rar:'A',  role:'war',   sk:'ทรราชลั่นกลอง'},
  {id:'yuanshao',th:'อ้วนเสี้ยว',     en:'Yuan Shao',      ch:'绍', fac:'qun', rar:'A',  role:'arch',  sk:'ห่าศรแห่งกิจิ๋ว'},
  {id:'huatuo',  th:'ฮัวโต๋',         en:'Hua Tuo',        ch:'佗', fac:'qun', rar:'A',  role:'heal',  sk:'ตำรายาชิงหนัง'},
  // expansion
  {id:'guojia',  th:'กุยแก',        en:'Guo Jia',        ch:'嘉', fac:'wei', rar:'SP', role:'strat', sk:'อุบายสิบชนะ'},
  {id:'caopi',   th:'โจผี',          en:'Cao Pi',         ch:'丕', fac:'wei', rar:'S',  role:'war',   sk:'จักรพรรดิแห่งวุย'},
  {id:'zhenji',  th:'เอียนสี',       en:'Zhen Ji',        ch:'洛', fac:'wei', rar:'S',  role:'strat', sk:'เทพธิดาแม่น้ำลั่ว'},
  {id:'xuhuang', th:'ซิหลง',         en:'Xu Huang',       ch:'晃', fac:'wei', rar:'A',  role:'war',   sk:'ขวานทลายวงล้อม'},
  {id:'caoren',  th:'โจหยิน',        en:'Cao Ren',        ch:'仁', fac:'wei', rar:'A',  role:'war',   sk:'ป้อมปราการเหล็ก'},
  {id:'pangtong',th:'บังทอง',        en:'Pang Tong',      ch:'统', fac:'shu', rar:'SP', role:'strat', sk:'กลห่วงโซ่เรือ'},
  {id:'jiangwei',th:'เกียงอุย',       en:'Jiang Wei',      ch:'维', fac:'shu', rar:'S',  role:'cav',   sk:'สืบทอดเจตนาขงเบ้ง'},
  {id:'guanyinping',th:'กวนอิ๋นผิง',   en:'Guan Yinping',   ch:'屏', fac:'shu', rar:'S',  role:'war',   sk:'ทวนพยัคฆ์สาว'},
  {id:'yueying', th:'อุยซี',         en:'Huang Yueying',  ch:'月', fac:'shu', rar:'A',  role:'heal',  sk:'ม้าไม้วัวยนต์'},
  {id:'weiyan',  th:'อุยเอี๋ยน',      en:'Wei Yan',        ch:'延', fac:'shu', rar:'A',  role:'war',   sk:'ทางลัดหุบจื่ออู่'},
  {id:'sunce',   th:'ซุนเซ็ก',        en:'Sun Ce',         ch:'策', fac:'wu',  rar:'SP', role:'cav',   sk:'เจ้าน้อยแห่งกังตั๋ง'},
  {id:'luxun',   th:'ลกซุน',         en:'Lu Xun',         ch:'逊', fac:'wu',  rar:'S',  role:'strat', sk:'เพลิงเผาค่ายอิเหลง'},
  {id:'taishici',th:'ไทสูจู้',        en:'Taishi Ci',      ch:'慈', fac:'wu',  rar:'A',  role:'arch',  sk:'ศรคู่ทวนเดี่ยว'},
  {id:'huanggai',th:'อุยกาย',        en:'Huang Gai',      ch:'盖', fac:'wu',  rar:'A',  role:'war',   sk:'กลยอมเจ็บ'},
  {id:'lusu',    th:'โลซก',          en:'Lu Su',          ch:'肃', fac:'wu',  rar:'A',  role:'heal',  sk:'ไมตรีสองแคว้น'},
  {id:'zhangjiao',th:'เตียวก๊ก',      en:'Zhang Jiao',     ch:'角', fac:'qun', rar:'SP', role:'strat', sk:'ฟ้าเหลืองจะผงาด'},
  {id:'menghuo', th:'เบ้งเฮ็ก',       en:'Meng Huo',       ch:'获', fac:'qun', rar:'S',  role:'war',   sk:'เจ็ดจับเจ็ดปล่อย'},
  {id:'zhurong', th:'นางจูหยง',      en:'Zhurong',        ch:'融', fac:'qun', rar:'A',  role:'arch',  sk:'มีดบินเทพไฟ'},
  {id:'gongsunzan',th:'กองซุนจ้าน',   en:'Gongsun Zan',    ch:'瓒', fac:'qun', rar:'A',  role:'cav',   sk:'ทหารม้าขาว'},
  {id:'yuanshu', th:'อ้วนสุด',        en:'Yuan Shu',       ch:'术', fac:'qun', rar:'A',  role:'strat', sk:'ตราหยกแผ่นดิน'},
  // expansion 2
  {id:'sunjian', th:'ซุนเกียน',       en:'Sun Jian',       ch:'坚', fac:'wu',  rar:'SP', role:'war',   sk:'พยัคฆ์แห่งกังตั๋ง'},
  {id:'zuoci',   th:'จอจู้',          en:'Zuo Ci',         ch:'左', fac:'qun', rar:'SP', role:'strat', sk:'เวทมายาแปรร่าง'},
  {id:'dengai',  th:'เตงงาย',        en:'Deng Ai',        ch:'艾', fac:'wei', rar:'S',  role:'cav',   sk:'ข้ามเขาอิมเป๋ง'},
  {id:'xiahouyuan',th:'แฮหัวเอี๋ยน',  en:'Xiahou Yuan',    ch:'渊', fac:'wei', rar:'S',  role:'arch',  sk:'ทัพม้าเร็วสามวันพันลี้'},
  {id:'fazheng', th:'หวดเจ้ง',        en:'Fa Zheng',       ch:'正', fac:'shu', rar:'S',  role:'strat', sk:'แผนยึดเตงกุนสัน'},
  {id:'caiwenji',th:'ชัวเหวินกี',     en:'Cai Wenji',      ch:'琰', fac:'qun', rar:'S',  role:'heal',  sk:'ลำนำสิบแปดบท'},
  {id:'zhonghui',th:'จงโฮ่ย',        en:'Zhong Hui',      ch:'会', fac:'wei', rar:'A',  role:'strat', sk:'แผนแยกเสฉวน'},
  {id:'caozhi',  th:'โจสิด',          en:'Cao Zhi',        ch:'植', fac:'wei', rar:'A',  role:'heal',  sk:'กลอนเจ็ดก้าว'},
  {id:'yuejin',  th:'งักจิ้น',        en:'Yue Jin',        ch:'进', fac:'wei', rar:'A',  role:'war',   sk:'บุกขึ้นกำแพงก่อนใคร'},
  {id:'guanxing',th:'กวนหิน',        en:'Guan Xing',      ch:'兴', fac:'shu', rar:'A',  role:'war',   sk:'ง้าวสืบทอดบิดา'},
  {id:'zhangbao',th:'เตียวเปา',       en:'Zhang Bao',      ch:'苞', fac:'shu', rar:'A',  role:'cav',   sk:'ทวนงูสืบทอดบิดา'},
  {id:'mayunlu', th:'ม้าหวินลก',      en:'Ma Yunlu',       ch:'禄', fac:'shu', rar:'A',  role:'cav',   sk:'ทวนเงินแดนตะวันตก'},
  {id:'zhoutai',th:'จิวท่าย',        en:'Zhou Tai',       ch:'泰', fac:'wu',  rar:'A',  role:'war',   sk:'แผลสิบสองแห่งเพื่อนาย'},
  {id:'dingfeng',th:'เตงฮอง',        en:'Ding Feng',      ch:'奉', fac:'wu',  rar:'A',  role:'arch',  sk:'บุกหิมะตงเหิง'},
  {id:'lingtong',th:'เล่งทอง',        en:'Ling Tong',      ch:'绩', fac:'wu',  rar:'A',  role:'cav',   sk:'แค้นวางลงเพื่อกังตั๋ง'},
  {id:'huaxiong',th:'ฮัวหยง',        en:'Hua Xiong',      ch:'雄', fac:'qun', rar:'A',  role:'war',   sk:'ด่านซื่อซุยไม่มีวันแตก'}
];
const HERO = Object.fromEntries(HEROES.map(h=>[h.id,h]));
// guild raid boss: never summonable, only fought in the guild
HERO.boss = {id:'boss', th:'อสูรเพลิงบรรพกาล', en:'Primeval Flame Beast', ch:'兽', fac:'qun', rar:'SP', role:'strat', sk:'เปลวเพลิงล้างโลก', boss:1};
// portrait features for the procedurally drawn chibi faces
const LOOK = {
  liubei_y:{}, guanyu_y:{beard:'short'}, zhangfei_y:{},
  guanyu:{beard:'long'}, zhangfei:{beard:'wild'}, liubei:{beard:'short'}, huangzhong:{beard:'long',old:1}, caocao:{beard:'short'},
  simayi:{beard:'goatee'}, zhangliao:{beard:'short'}, xiahoudun:{beard:'short',patch:1}, dianwei:{beard:'wild'}, xunyu:{beard:'goatee'},
  sunquan:{beard:'short',beardColor:'#5a3a7a'}, sunshangxiang:{f:1,hair:'#6a2a1a'}, lumeng:{beard:'short'}, ganning:{hair:'#7a2e14'}, daqiao:{f:1,hair:'#3a2a4a'},
  lubu:{pheasant:1}, diaochan:{f:1,hair:'#2a1a3a'}, dongzhuo:{beard:'wild'}, yuanshao:{beard:'short'}, huatuo:{beard:'long',old:1},
  caopi:{beard:'goatee'}, zhenji:{f:1}, xuhuang:{beard:'short'}, caoren:{beard:'short'}, pangtong:{beard:'goatee',hair:'#3a2a1a'},
  guanyinping:{f:1}, yueying:{f:1,hair:'#4a3a1a'}, weiyan:{beard:'short'}, taishici:{beard:'short'}, huanggai:{beard:'wild',old:1},
  lusu:{beard:'goatee'}, zhangjiao:{beard:'long',old:1}, menghuo:{beard:'wild',hair:'#5a2a10',skin:'#c98d62'}, zhurong:{f:1,hair:'#8a2a1a',skin:'#d9a07a'},
  gongsunzan:{beard:'short'}, yuanshu:{beard:'goatee'},
  sunjian:{beard:'short'}, zuoci:{beard:'long',old:1}, dengai:{beard:'short'}, xiahouyuan:{beard:'short'}, fazheng:{beard:'goatee'}, caiwenji:{f:1,hair:'#2a1a1a'},
  zhonghui:{}, caozhi:{}, yuejin:{beard:'short'}, guanxing:{}, zhangbao:{}, mayunlu:{f:1,hair:'#3a1a10'}, zhoutai:{beard:'wild'}, dingfeng:{beard:'short',old:1}, lingtong:{}, huaxiong:{beard:'wild'}
};

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// Awakening (ตื่นจิต) needs 5 stars; each tier adds 25% stats, 10% skill power and 100 levels of cap.
// 5 stars = Lv.500, 5 awakenings = Lv.1000.
const levelCap = (star, aw=0) => star*100 + aw*100;
// Per-hero signature: multipliers on HP/ATK/DEF/MDEF, flat speed, skill power and extra crit chance, with a one-line trait.
// Each row trades strengths for weaknesses so totals stay near the rarity baseline.
const HERO_MOD = {
  liubei_y:   {hp:1.05, def:1.05, atk:.95, t:'ใจผู้นำ: ทนทานกว่านักรบทั่วไปเล็กน้อย'},
  guanyu_y:   {atk:1.08, def:.96, t:'ง้าวหนุ่ม: ฟันแรงขึ้น แต่เกราะยังบาง'},
  zhangfei_y: {hp:1.08, spd:-5, crit:.05, t:'ใจร้อน: เลือดหนา คริติคอลบ่อย แต่ช้า'},
  guanyu:     {atk:1.15, hp:1.05, spd:-5, def:.92, sk:1.08, t:'เทพเจ้าสงคราม: โจมตีสูงสุดในสายนักรบ'},
  zhuge:      {sk:1.18, mdef:1.1, hp:.88, atk:1.02, t:'ปราชญ์มังกรหลับ: สกิลแรงที่สุดในเกม แต่เปราะ'},
  zhaoyun:    {spd:12, crit:.05, hp:.95, atk:1.02, t:'ทะลวงทัพ: เร็วที่สุดในระดับ S ออกสกิลก่อนใคร'},
  liubei:     {hp:1.08, mdef:1.1, atk:.9, t:'จักรพรรดิเมตตา: ทนเวทและทนทานสูง'},
  machao:     {atk:1.1, crit:.04, def:.9, t:'ม้าศึกตะวันตก: บุกแรง คริติคอลสูง เกราะบาง'},
  zhangfei:   {hp:1.12, def:1.05, atk:.95, spd:-5, t:'โล่หน้าทัพ: เลือดหนาที่สุดในระดับ A'},
  huangzhong: {atk:1.12, crit:.04, hp:.9, t:'ธนูเฒ่า: ยิงแรงสุดในนักธนูระดับ A'},
  caocao:     {sk:1.1, hp:1.08, def:1.05, atk:.95, t:'ยอดวีรบุรุษ: กุนซือที่ทนทานที่สุด'},
  simayi:     {sk:1.12, spd:5, hp:.92, t:'หมาป่าเจ้าเล่ห์: สกิลแรงและออกเร็ว'},
  zhangliao:  {atk:1.08, spd:6, hp:.94, t:'สะเทือนเซียวเหยา: ตีแถวหลังได้ไวมาก'},
  xiahoudun:  {hp:1.1, def:1.08, atk:.92, t:'ตาเดียวไม่ถอย: กำแพงหน้าทัพของวุย'},
  xuchu:      {hp:1.1, atk:1.04, spd:-8, def:.96, t:'เสือโง่: แรงและทน แต่ช้ามาก'},
  dianwei:    {def:1.12, hp:1.06, atk:.92, t:'องครักษ์เหล็ก: เกราะหนาที่สุดในระดับ A'},
  xunyu:      {sk:1.08, mdef:1.08, hp:.95, t:'ที่ปรึกษาราชสำนัก: ฮีลแรงขึ้น'},
  zhouyu:     {sk:1.15, atk:1.05, hp:.88, def:.92, t:'ไฟเผาผาแดง: สกิลเผาทั้งทัพแรงมาก'},
  sunquan:    {hp:1.06, mdef:1.08, atk:.95, t:'ผู้ครองกังตั๋ง: นักรบที่ทนเวทดี'},
  sunshangxiang:{spd:8, crit:.05, hp:.92, t:'องค์หญิงธนู: ยิงเร็วและคริติคอลบ่อย'},
  lumeng:     {atk:1.05, sk:1.05, def:.94, t:'ขุนพลผู้ใฝ่รู้: สกิลบุกแรงขึ้น'},
  ganning:    {crit:.06, spd:5, def:.9, t:'โจรสลัดผ้าไหม: คริติคอลสูงในนักธนู'},
  daqiao:     {spd:6, mdef:1.05, atk:.95, t:'ดอกไม้ง่อก๊ก: ฮีลออกเร็ว'},
  lubu:       {atk:1.22, crit:.06, hp:.98, def:.88, mdef:.88, t:'ไร้เทียมทาน: โจมตีสูงที่สุดในเกม แต่ป้องกันต่ำ'},
  diaochan:   {spd:10, sk:1.05, hp:.88, t:'นางงามล่มเมือง: เร็วที่สุดในสายกุนซือ'},
  dongzhuo:   {hp:1.15, atk:1.02, spd:-10, def:.95, t:'ทรราช: เลือดมหาศาล แต่อืดที่สุด'},
  yuanshao:   {hp:1.06, atk:.97, t:'เจ้าแห่งเหอเป่ย: นักธนูที่ทนทาน'},
  huatuo:     {sk:1.12, hp:1.0, atk:.95, t:'หมอเทวดา: ฮีลแรงที่สุดในระดับ A'},
  guojia:     {sk:1.12, crit:.05, hp:.88, t:'อัจฉริยะอายุสั้น: สกิลแรง คริติคอลบ่อย เปราะมาก'},
  caopi:      {hp:1.05, atk:1.03, spd:-3, t:'จักรพรรดิวุย: นักรบสมดุล'},
  zhenji:     {mdef:1.12, sk:1.04, atk:.96, t:'เทพธิดาแม่น้ำลั่ว: ทนเวทสูงมาก'},
  xuhuang:    {atk:1.06, def:1.02, spd:-4, t:'ขวานใหญ่: ฟันแรงและมั่นคง'},
  caoren:     {def:1.15, hp:1.05, atk:.88, t:'ป้อมปราการ: ป้องกันกายสูงสุดในเกม'},
  pangtong:   {sk:1.14, atk:1.04, hp:.9, def:.92, t:'หงส์อ่อน: สกิลแรงรองจากขงเบ้ง'},
  jiangwei:   {atk:1.04, mdef:1.08, sk:1.04, t:'ทายาทขงเบ้ง: ทหารม้าที่ทนเวท'},
  guanyinping:{atk:1.06, spd:6, hp:.95, t:'บุตรีกวนอู: นักรบที่เร็ว'},
  yueying:    {mdef:1.1, sk:1.05, hp:.95, t:'นางช่างกล: ฮีลและทนเวท'},
  weiyan:     {atk:1.08, crit:.04, def:.92, t:'กบฏในทัพ: ฟันแรงแต่เกราะบาง'},
  sunce:      {atk:1.12, spd:8, hp:.95, def:.94, t:'ฌ้อปาอ๋องน้อย: บุกเร็วและแรง'},
  luxun:      {sk:1.1, spd:4, hp:.9, t:'เผาค่ายเจ็ดร้อยลี้: สกิลไฟแรง'},
  taishici:   {atk:1.06, hp:1.04, crit:.02, spd:-4, t:'ธนูคู่ทวน: นักธนูที่ทน'},
  huanggai:   {hp:1.1, def:1.05, atk:.92, t:'ทุกข์ทรมานกาย: เลือดหนา'},
  lusu:       {hp:1.05, mdef:1.05, sk:.98, t:'ผู้ซื่อสัตย์: ฮีลที่ทนทาน'},
  zhangjiao:  {sk:1.12, mdef:1.08, hp:.92, def:.92, t:'มหาเทพโพกผ้าเหลือง: เวทแรงทนเวทดี'},
  menghuo:    {hp:1.15, def:1.05, atk:.9, spd:-6, t:'ราชาป่าใต้: นักรบที่เลือดหนาที่สุดระดับ S'},
  zhurong:    {atk:1.06, spd:4, hp:.94, t:'เทพไฟแดนใต้: นักธนูที่เร็ว'},
  gongsunzan: {spd:8, hp:.96, t:'ม้าขาว: ทหารม้าที่เร็ว'},
  yuanshu:    {sk:1.04, hp:1.02, atk:.96, t:'จักรพรรดิปลอม: กุนซือธรรมดา'},
  sunjian:    {atk:1.1, hp:1.08, def:1.0, spd:-4, sk:1.04, t:'เสือกังตั๋ง: นักรบ S+ ที่แรงและทน'},
  zuoci:      {sk:1.08, spd:10, mdef:1.08, hp:.88, t:'เซียนจอจู้: เร็วและทนเวท'},
  dengai:     {atk:1.06, spd:4, crit:.03, def:.94, t:'ข้ามเขาอิมเป๋ง: บุกทะลวงหลัง'},
  xiahouyuan: {spd:10, atk:1.03, hp:.9, t:'ธนูเร็ว: นักธนูที่เร็วที่สุด'},
  fazheng:    {sk:1.08, crit:.03, hp:.92, t:'กุนซือแค้นฝังใจ: สกิลแรง'},
  caiwenji:   {sk:1.1, mdef:1.05, hp:.92, t:'นักพิณ: ฮีลแรงในระดับ S'},
  zhonghui:   {sk:1.05, atk:1.03, hp:.92, t:'ผู้ทะเยอทะยาน: กุนซือแรงแต่เปราะ'},
  caozhi:     {sk:1.05, spd:4, hp:.95, t:'กวีเจ็ดก้าว: ฮีลเร็ว'},
  yuejin:     {spd:6, atk:1.02, hp:.95, t:'ทัพหน้า: นักรบที่เร็ว'},
  guanxing:   {atk:1.06, sk:1.03, def:.95, t:'บุตรกวนอู: ฟันแรง'},
  zhangbao:   {hp:1.06, crit:.03, spd:-3, t:'บุตรเตียวหุย: ทหารม้าที่ทน'},
  mayunlu:    {spd:8, atk:1.02, hp:.94, t:'ขุนพลหญิงแห่งเสเหลียง: เร็ว'},
  zhoutai:    {hp:1.14, def:1.02, atk:.9, t:'แผลทั่วกาย: เลือดหนามาก'},
  dingfeng:   {crit:.04, atk:1.03, hp:.95, t:'ฝ่าหิมะ: คริติคอลบ่อย'},
  lingtong:   {atk:1.05, spd:4, def:.94, t:'ขุนพลหนุ่มง่อ: บุกแรง'},
  huaxiong:   {hp:1.08, def:1.06, atk:.96, t:'ด่านซื่อซุยก๋วน: กำแพงต้นเกม'}
};
const HMOD = id => HERO_MOD[id] || {};
function stats(id, lv, star, aw=0){
  const h=HERO[id], r=ROLE[h.role], q=RAR[h.rar];
  const m = q.m*(1+(lv-1)*0.09)*(1+(star-1)*0.18)*(1+aw*0.25);
  const o=HMOD(id);
  return {hp:Math.round(1000*r.hp*m*(o.hp||1)), atk:Math.round(100*r.atk*m*(o.atk||1)), def:Math.round(50*r.def*m*(o.def||1)), mdef:Math.round(50*r.mdef*m*(o.mdef||1)), spd:r.spd+q.spd+(o.spd||0)};
}
const skillMult = (id, aw=0) => +(ROLE[HERO[id].role].mult*RAR[HERO[id].rar].sk*(HMOD(id).sk||1)*(1+aw*0.1)).toFixed(2);
function power(id, lv, star, aw=0){const s=stats(id,lv,star,aw);return Math.round(s.hp*0.25+s.atk*3+s.def*2)}
// Front-liners are cheap to train, strategists cost the most.
const ROLE_COST = {war:0.85, cav:0.95, arch:1.0, heal:1.05, strat:1.15};
const lvCost = (lv, role='arch') => { const m=ROLE_COST[role]||1; return {gold:Math.floor(60*Math.pow(lv,1.35)*m), exp:Math.floor(40*Math.pow(lv,1.3)*m)} };
const starCost = star => ({copies:star, gold:4000*star});
const awCost = aw => ({soul:aw+1, gold:20000*(aw+1)});
const stageLabel = s => `${Math.floor((s-1)/10)+1}-${(s-1)%10+1}`;

// Bonds (มิตรภาพ): when every listed general is in the same team, those generals gain the bonus.
const BONDS = [
  {name:'สามพี่น้องสวนท้อ',  ids:['liubei','guanyu','zhangfei'], hp:.20, atk:.20},
  {name:'สามพี่น้องวัยหนุ่ม', ids:['liubei_y','guanyu_y','zhangfei_y'], hp:.15, atk:.15},
  {name:'ห้าทหารเสือ',       ids:['guanyu','zhangfei','zhaoyun','machao','huangzhong'], hp:.30, atk:.30},
  {name:'นายกับกุนซือ',      ids:['liubei','zhuge'], hp:0, atk:.15},
  {name:'ศึกผาแดง',          ids:['zhouyu','zhuge'], hp:0, atk:.15},
  {name:'เลือดตระกูลโจ',     ids:['caocao','xiahoudun'], hp:.20, atk:0},
  {name:'สององครักษ์พยัคฆ์',  ids:['xuchu','dianwei'], hp:.25, atk:0},
  {name:'กุนซือแห่งวุย',      ids:['simayi','xunyu'], hp:0, atk:.15},
  {name:'ทัพเรือกังตั๋ง',     ids:['sunquan','zhouyu','ganning'], hp:.15, atk:.15},
  {name:'พี่น้องตระกูลซุน',   ids:['sunquan','sunshangxiang'], hp:.15, atk:0},
  {name:'แผนห่วงโซ่',        ids:['lubu','diaochan'], hp:0, atk:.20},
  {name:'สามเสือตระกูลซุน',   ids:['sunjian','sunce','sunquan'], hp:.15, atk:.20},
  {name:'ทายาทสวนท้อ',       ids:['guanxing','zhangbao'], hp:.15, atk:.15},
  {name:'สองขุนพลพิชิตจ๊ก',   ids:['dengai','zhonghui'], hp:0, atk:.20},
  {name:'พี่น้องตระกูลโจ',     ids:['caopi','caozhi'], hp:.15, atk:0},
  {name:'ม้าศึกเสเหลียง',      ids:['machao','mayunlu'], hp:.10, atk:.15}
];
const activeBonds = ids => BONDS.filter(b=>b.ids.every(i=>ids.includes(i)));
// Same-faction synergy: 3+ generals of one kingdom in the team lift that kingdom's HP and ATK.
const FAC_SYN = {3:.06, 4:.10, 5:.14, 6:.18};
const facCount = (ids, fac) => ids.filter(i=>HERO[i]&&HERO[i].fac===fac).length;
const facSyn = (ids, fac) => FAC_SYN[Math.min(6,facCount(ids,fac))]||0;
function bondBonus(ids, id){let hp=0,atk=0; for(const b of activeBonds(ids)) if(b.ids.includes(id)){hp+=b.hp;atk+=b.atk}
  const f=HERO[id]?facSyn(ids,HERO[id].fac):0; return {hp:hp+f, atk:atk+f}}

function pickTeam(rnd, pool){
  const ids=[];
  while(ids.length<5){const id=pool[Math.floor(rnd()*pool.length)]; if(!ids.includes(id)) ids.push(id)}
  // tanky roles to the front row
  ids.sort((a,b)=>{const o={war:0,cav:1,heal:3,strat:2,arch:2};return o[HERO[a].role]-o[HERO[b].role]});
  return ids;
}
// The first stages are a gentle opening: few, weakened enemies so a lone young Liu Bei can win.
const OPENING = {1:{n:2, weak:.75}, 2:{n:3, weak:.45}, 3:{n:4, weak:.3}};
function enemyTeam(stage){
  const rnd = mulberry32(stage*7919+17), op=OPENING[stage];
  if(op){
    const ids=pickTeam(rnd, HEROES.filter(h=>h.rar==='A' && h.fac!=='shu').map(h=>h.id)).slice(0,op.n);
    return ids.map(id=>({id, lv:1, star:1, aw:0, bonus:{hpPct:-op.weak, atkPct:-op.weak}}));
  }
  const ids = pickTeam(rnd, HEROES.filter(h => h.rar==='A' || (h.rar==='S' && stage>=8) || (h.rar==='SP' && stage>=20)).map(h=>h.id));
  const star = Math.min(5, 1+Math.floor((stage-1)/30));
  // each star step comes with a small level dip so the jump is not a wall
  const lv = Math.min(levelCap(star), stage-8*(star-1));
  return ids.map(id=>({id, lv, star, aw:0}));
}
// Trial tower (หอท้าขุนพล): its own ladder, harder and with awakened enemies from floor 60.
function towerTeam(floor){
  const rnd = mulberry32(floor*104729+3);
  const ids = pickTeam(rnd, HEROES.filter(h => h.rar!=='SP' || floor>=12).map(h=>h.id));
  const star = Math.min(5, 1+Math.floor(floor/12));
  const aw = Math.max(0, Math.min(5, Math.floor((floor-50)/10)));
  const lv = Math.min(levelCap(star,aw), 1+Math.floor(floor*1.5));
  return ids.map(id=>({id, lv, star, aw}));
}
const FIRST_HERO = {1:'guanyu_y', 2:'zhangfei_y', 3:'huatuo', 4:'huangzhong', 6:'ganning'};
const stageReward = s => ({gold:450+s*100, exp:200+s*40, gems: s%5===0 ? 120 : 20});
const towerReward = f => ({gems:30, tickets:2, chest: f%10===0});

// Gear (อุปกรณ์): flat stats scaled by item level (il), quality and enhancement.
const SLOTS = [{k:'wpn',th:'อาวุธ',ch:'兵'},{k:'arm',th:'เกราะ',ch:'甲'},{k:'hlm',th:'หมวก',ch:'盔'},{k:'mnt',th:'ม้าศึก',ch:'马'}];
const QUAL = [{th:'ธรรมดา',c:'#8f8f8f',m:1},{th:'ดี',c:'#4f9a4a',m:1.5},{th:'หายาก',c:'#3c78c0',m:2.2},{th:'มหากาพย์',c:'#8a4fc4',m:3.2},{th:'ตำนาน',c:'#e0682a',m:4.6}];
const GEAR_MAX_ENH = 10;
function gearStats(g){
  const b = g.il*QUAL[g.q].m*0.4*(1+g.enh*0.12);
  if(g.slot==='wpn') return {atk:Math.round(b*4)};
  if(g.slot==='arm') return {def:Math.round(b*2), hp:Math.round(b*10)};
  if(g.slot==='hlm') return {hp:Math.round(b*25)};
  return {spd:Math.min(30, 2+g.q*3+g.enh), atk:Math.round(b*1.5)};
}
const gearScore = g => { const s=gearStats(g); return Math.round((s.hp||0)*0.25+(s.atk||0)*3+(s.def||0)*2+(s.spd||0)*20) };
const enhCost = g => Math.round(500*(g.enh+1)*(g.q+1)*(1+g.il/40));

// Divine beasts (สัตว์เทพ): team-wide percentage bonuses, fed with fish.
const BEASTS = [
  {k:'dragon',  th:'มังกรเขียว', ch:'龙', atk:.006, hp:0,    def:0},
  {k:'tiger',   th:'เสือขาว',   ch:'虎', atk:.003, hp:.003, def:0},
  {k:'phoenix', th:'หงส์แดง',   ch:'凤', atk:0,    hp:.006, def:0},
  {k:'tortoise',th:'เต่าดำ',    ch:'龟', atk:0,    hp:.002, def:.01}
];
const BEAST_MAX = 50;
const beastCost = lv => ({fish:2+lv*2, gold:1000*(lv+1)});
function beastPct(levels){ const p={hp:0,atk:0,def:0}; for(const b of BEASTS){const lv=levels[b.k]||0; p.hp+=b.hp*lv; p.atk+=b.atk*lv; p.def+=b.def*lv} return p }

// x = {id, lv, star, aw, bonus?:{hp,atk,def,spd,hpPct,atkPct,defPct}}, bb = bond bonus
function finalStats(x, bb={hp:0,atk:0}){
  const s=stats(x.id,x.lv,x.star,x.aw||0), b=x.bonus||{};
  return {hp:Math.round((s.hp+(b.hp||0))*(1+bb.hp+(b.hpPct||0))), atk:Math.round((s.atk+(b.atk||0))*(1+bb.atk+(b.atkPct||0))),
          def:Math.round((s.def+(b.def||0))*(1+(b.defPct||0))), mdef:Math.round((s.mdef+(b.def||0)*0.5)*(1+(b.defPct||0))), spd:s.spd+(b.spd||0)};
}
const powerOf = f => Math.round(f.hp*0.25+f.atk*3+f.def*1.2+(f.mdef||0)*1.2+(f.spd-100)*20);

// Arena (สนามประลอง): a fixed ladder of 50 NPC rivals.
const BOT_PRE=['จอมทัพ','ขุนศึก','กุนซือ','เจ้าเมือง','นักพรต','แม่ทัพ','บัณฑิต','จอมยุทธ์'];
const BOT_SUF=['เสฉวน','เกงจิ๋ว','กังตั๋ง','ลกเอี๋ยง','ฮันต๋ง','เตียงอัน','กิจิ๋ว','ซีเหลียง','อู่หลิง','ฮูโต๋'];
const BOTS = Array.from({length:50},(_,i)=>({i, name:BOT_PRE[i%8]+BOT_SUF[Math.floor(i/8)%10], pts:2200-i*30}));
function botTeam(bot, myPts, avgLv, ref){
  const rnd=mulberry32(bot.i*9973+ref*31+1);
  const ids=pickTeam(rnd, HEROES.map(h=>h.id));
  let lv=Math.max(1, Math.round(avgLv*(1+(bot.pts-myPts)/1500)));
  const star=Math.min(5, Math.max(1, Math.ceil(lv/20))); lv=Math.min(lv, levelCap(star));
  return ids.map(id=>({id, lv, star, aw:0}));
}
const arenaRankReward = r => r<=1?1000 : r<=3?600 : r<=10?400 : r<=30?200 : 100;

const LOGIN7 = [{gems:300},{tickets:5},{gold:50000},{fish:15},{gems:500},{exp:30000},{chest:1}];
const FISH = [{th:'ปลาตะเพียน',pts:1},{th:'ปลาคาร์ปทอง',pts:3},{th:'ปลามังกรหยก',pts:8,gems:100}];

// Deterministic auto-battle. A and B are 5-slot arrays (slots 0-1 front row, 2-4 back row), null = empty.
// Long fights tip over: from round 9 hits grow harder and heals weaker, so healer stacks can't stall to the 20-round limit.
const fatigue = r => r<=8 ? 1 : 1+0.2*(r-8);
const healDecay = r => r<=8 ? 1 : Math.max(0.2, 1-0.12*(r-8));
function simulate(A, B, seed){
  const rnd = mulberry32(seed);
  const units = [];
  const mk = (side, arr) => { const ids=arr.filter(Boolean).map(x=>x.id);
    arr.forEach((x,i)=>{ if(!x) return; const aw=x.aw||0, f=finalStats(x, bondBonus(ids,x.id));
      const role=HERO[x.id].role;
      units.push({uid:side+i, side, slot:i, id:x.id, fac:HERO[x.id].fac, role, lv:x.lv, star:x.star, aw, hp:f.hp, max:f.hp, atk:Math.round(f.atk*(role==='arch'?1.1:1)), def:f.def, mdef:f.mdef, spd:f.spd, rage:0, alive:true, div:false}); }); };
  mk('p',A); mk('e',B);
  const start = units.map(u=>({...u}));
  const actions = [];
  const alive = side => units.filter(u=>u.alive && u.side===side);
  const pick = arr => arr[Math.floor(rnd()*arr.length)];
  const front = foes => { const f=foes.filter(u=>u.slot<3); return f.length?f:foes };
  const back  = foes => { const b=foes.filter(u=>u.slot>=3); return b.length?b:foes };
  let round = 0, winner = null;
  for(round=1; round<=20 && !winner; round++){
    const order = units.filter(u=>u.alive).sort((a,b)=>b.spd-a.spd || (a.uid<b.uid?-1:1));
    for(const u of order){
      if(!u.alive) continue;
      const foes = alive(u.side==='p'?'e':'p');
      if(!foes.length) break;
      const allies = alive(u.side);
      const isSkill = u.rage>=100;
      const kind = isSkill ? ROLE[u.role].kind : 'normal';
      const m = isSkill ? skillMult(u.id,u.aw)*(u.role==='strat'?1.2:1) : 1;
      const hits = [];
      const strike = (t, mult, combo=false) => {
        const adv = BEATS[u.fac]===t.fac ? 1.25 : BEATS[t.fac]===u.fac ? 0.85 : 1;
        const crit = rnd() < (u.role==='cav' ? 0.25 : 0.12) + (HMOD(u.id).crit||0);
        const dmg = Math.max(1, Math.round(u.atk*mult*(120/(120+(ROLE[u.role].mag?t.mdef:t.def)))*adv*(crit?1.6:1)*(0.92+rnd()*0.16)*(t.role==='war'?0.85:1)*fatigue(round)));
        t.hp = Math.max(0, t.hp-dmg);
        if(t.hp===0) t.alive=false; else t.rage=Math.min(100,t.rage+10);
        hits.push({tgt:t.uid, dmg, crit, adv, combo, hp:t.hp, dead:!t.alive});
        // divine base (ฐานเทวะ): an awakened general rises once when nearly fallen
        if(t.alive && t.aw>0 && !t.div && t.hp < t.max*0.3){
          t.div=true; const amt=Math.round(t.max*(0.2+t.aw*0.04));
          t.hp=Math.min(t.max,t.hp+amt); t.atk=Math.round(t.atk*(1+t.aw*0.05));
          hits.push({tgt:t.uid, heal:amt, divine:true, hp:t.hp});
        }
      };
      const heal = (t, amt) => { amt=Math.round(amt*healDecay(round)); t.hp=Math.min(t.max,t.hp+amt); hits.push({tgt:t.uid, heal:amt, hp:t.hp}) };
      if(kind==='heal'){
        for(const t of allies) heal(t, Math.round(u.atk*m*(0.95+rnd()*0.1)));
      } else {
        const targets = kind==='aoe' ? foes : kind==='back' ? [pick(back(foes))] : kind==='single' ? [pick(front(foes))] : [u.role==='arch' ? pick(foes) : pick(front(foes))];
        for(const t of targets) strike(t, m);
        if(kind==='normal'){
          if(targets[0].alive && rnd() < comboChance(u.role)) strike(targets[0], 0.6, true);
          if(u.role==='heal'){ const a=alive(u.side).sort((x,y)=>x.hp/x.max-y.hp/y.max)[0]; if(a) heal(a, Math.round(u.atk*0.5)) }
        }
      }
      u.rage = isSkill ? 0 : Math.min(100, u.rage+34);
      actions.push({round, src:u.uid, skill:isSkill?HERO[u.id].sk:null, hits, rage:Object.fromEntries(units.map(x=>[x.uid,x.rage]))});
      if(!alive('e').length){winner='p';break}
      if(!alive('p').length){winner='e';break}
    }
  }
  return {start, actions, winner: winner || 'e', rounds: Math.min(round,20)};
}

// ---------- weekly events ----------
const EVENTS=[
  {k:'afk',    th:'สัปดาห์ทัพเร่งพล',  ch:'军', desc:'เงินจากรางวัลออฟไลน์ ×2'},
  {k:'rateup', th:'เทศกาลอัญเชิญ',    ch:'召', desc:'เมื่อสุ่มได้ S+ มีโอกาส 50% เป็นขุนพลประจำสัปดาห์'},
  {k:'fish',   th:'เทศกาลตกปลา',      ch:'渔', desc:'แต้มปลาจากการตกปลา ×2'}
];
const weekNo = () => { const d=new Date(); d.setHours(0,0,0,0); return Math.floor((d.getTime()/864e5+3)/7) };
const curEvent = () => EVENTS[weekNo()%EVENTS.length];
const featuredSP = () => { const sp=HEROES.filter(h=>h.rar==='SP'); return sp[weekNo()%sp.length].id };
const evMul = k => curEvent().k===k ? 2 : 1;

// ---------- story ----------
const STORY = [
  {t:'สาบานในสวนท้อ', f:['qun'], st:[
    {boss:'yuanshu', lines:[['liubei','แผ่นดินลุกเป็นไฟ ชาวบ้านทุกข์ยาก ข้าอยากช่วยแต่ยังไร้กำลัง'],['zhangfei','ข้ามีเหล้ามีสวนท้อ มาสาบานเป็นพี่น้องกันเถิด!']]},
    {boss:'gongsunzan', lines:[['guanyu','เมื่อสาบานแล้ว ไม่ขอเกิดวันเดียวกัน แต่ขอตายวันเดียวกัน'],['liubei','ทหารอาสาพร้อมแล้ว ออกเดินทัพปราบโจรกัน']]},
    {boss:'zhangjiao', lines:[['zhangjiao','ฟ้าสีครามสิ้นแล้ว ฟ้าเหลืองจะผงาด!'],['guanyu','โจรโพกผ้าเหลือง เจอง้าวของข้าก่อนเถิด']]}]},
  {t:'ด่านเฮาโลก๋วน', f:['qun'], st:[
    {boss:'dongzhuo', lines:[['caocao','ตั๋งโต๊ะกุมราชสำนัก หัวเมืองทั้งหลายต้องรวมทัพ'],['yuanshao','ข้าจะเป็นแม่ทัพใหญ่ของทัพพันธมิตร']]},
    {boss:'huaxiong', lines:[['huaxiong','ใครกล้าออกมาสู้กับข้าอีก?'],['guanyu','เหล้าจอกนี้ยังอุ่นอยู่ รอข้ากลับมาก่อน']]},
    {boss:'lubu', lines:[['lubu','ในหมู่คนมีลิโป้ ในหมู่ม้ามีเซ็กเธาว์!'],['zhangfei','สามพี่น้องรุมเจ้าคนเดียว ดูซิจะทนได้แค่ไหน!']]}]},
  {t:'ศึกกัวต๋อ', f:['qun','wei'], st:[
    {boss:'yuanshao', lines:[['yuanshao','ทหารข้านับแสน โจโฉจะต้านไหวหรือ'],['guojia','อ้วนเสี้ยวมีมากแต่ลังเล ท่านชนะแน่นอน']]},
    {boss:'yuanshao', lines:[['zhangliao','เสบียงของอ้วนเสี้ยวกองอยู่ที่อัวเจ๋า'],['caocao','เผาเสบียงเสีย ทัพมันจะพังลงเอง']]},
    {boss:'yuanshao', lines:[['yuanshao','ถอย! ถอยกลับเหอเป่ย!'],['caocao','ภาคเหนือทั้งหมดเป็นของข้าแล้ว']]}]},
  {t:'ทุ่งเตียงปัน', f:['wei'], st:[
    {boss:'xiahoudun', lines:[['liubei','ข้ามาเยือนถึงสามครั้ง ขอท่านช่วยข้ากู้แผ่นดิน'],['zhuge','แผนแบ่งแผ่นดินเป็นสามอยู่ในใจข้าแล้ว']]},
    {boss:'zhangliao', lines:[['zhaoyun','นายน้อยอยู่ในอ้อมอกข้า ทัพนับแสนก็ขวางไม่ได้'],['caocao','อย่ายิงธนูใส่ขุนพลผู้นี้ ข้าอยากได้ตัวเป็น ๆ']]},
    {boss:'caocao', lines:[['zhangfei','ข้าเตียวหุยแห่งเมืองเอ๊กจิ๋ว ใครกล้ามาสู้กันตาย!'],['xiahoudun','เสียงคำรามนี่… ทหารถอยร่นกันหมดแล้ว!']]}]},
  {t:'ศึกผาแดง', f:['wei'], st:[
    {boss:'caoren', lines:[['zhuge','ข้าจะไปกังตั๋ง ชวนซุนกวนร่วมต้านโจโฉ'],['sunquan','ใครเอ่ยถึงการยอมแพ้อีก จะเป็นเช่นโต๊ะตัวนี้!']]},
    {boss:'xuhuang', lines:[['huanggai','ข้ายอมเจ็บตัว ให้โจโฉหลงเชื่อว่าข้าจะสวามิภักดิ์'],['zhouyu','กลยอมเจ็บสำเร็จแล้ว เตรียมเรือไฟ']]},
    {boss:'caocao', lines:[['zhuge','ลมบูรพามาแล้ว!'],['zhouyu','เผาทัพเรือของโจโฉให้สิ้น!']]}]},
  {t:'ยึดฮันต๋ง', f:['wei'], st:[
    {boss:'xiahouyuan', lines:[['huangzhong','ข้าแก่แล้ว แต่ธนูของข้ายังไม่แก่'],['xiahouyuan','เขาเตงกุนสันเป็นของวุย!']]},
    {boss:'zhangliao', lines:[['machao','ทหารม้าเสเหลียงพร้อมรบแล้ว'],['liubei','ห้าทหารเสือพร้อมหน้า ฮันต๋งต้องเป็นของเรา']]},
    {boss:'caocao', lines:[['caocao','ซี่โครงไก่… กินก็ไม่อิ่ม ทิ้งก็เสียดาย'],['fazheng','โจโฉถอยแล้ว ฮันต๋งเป็นของท่าน']]}]},
  {t:'ศึกอิเหลง', f:['wu'], st:[
    {boss:'ganning', lines:[['liubei','แค้นของน้องทั้งสองต้องชำระ!'],['zhaoyun','ศัตรูที่แท้คือวุย ไม่ใช่ง่อ ขอท่านคิดให้ดี']]},
    {boss:'zhoutai', lines:[['luxun','ค่ายเรียงยาวเจ็ดร้อยลี้ ไม่มีทางรอด'],['sunquan','ข้ามอบทัพทั้งหมดให้ท่าน ลกซุน']]},
    {boss:'luxun', lines:[['luxun','จุดไฟ! เผาค่ายให้ทั่ว!'],['liubei','ข้าผิดเอง… ขอฝากบุตรไว้กับขงเบ้ง']]}]},
  {t:'บุกภาคเหนือ', f:['wei'], st:[
    {boss:'caoren', lines:[['zhuge','ข้าจะทำตามเจตนาของพระเจ้าเล่าปี่จนตัวตาย'],['jiangwei','ข้าจะสืบทอดวิชาของท่านอาจารย์']]},
    {boss:'dengai', lines:[['simayi','ขงเบ้งรอบคอบเกินไป ข้าจะตั้งรับจนมันหมดแรง'],['weiyan','ให้ข้านำทัพผ่านหุบจื่ออู่เถิด!']]},
    {boss:'simayi', lines:[['simayi','ขงเบ้งตายแล้วหรือ… หรือเป็นกลอีก?'],['jiangwei','แม้ท่านจากไป แผ่นดินนี้จะจดจำท่านตลอดไป']]}]}
];
const STORY_END_REWARD = c => [2,5,7].includes(c) ? {gems:300, chest:1} : {gems:300, tickets:5};
const storyKey = (c,s) => `${c}-${s}`;
const storyOpen = (c,s) => (c===0&&s===0) || !!S.story[s>0?storyKey(c,s-1):storyKey(c-1,2)];
function storyTeam(c, si){
  const ch=STORY[c], st=ch.st[si], rnd=mulberry32(c*131+si*17+7);
  const pool=HEROES.filter(h=>ch.f.includes(h.fac) && h.id!==st.boss).map(h=>h.id);
  const ids=[st.boss]; while(ids.length<5){ const id=pool[Math.floor(rnd()*pool.length)]; if(!ids.includes(id)) ids.push(id) }
  const star=Math.min(5,1+Math.floor(c/2)), lv=Math.min(levelCap(star), 4+c*14+si*4);
  const ord={war:0,cav:1,strat:2,arch:2,heal:3};
  const team=ids.sort((x,y)=>ord[HERO[x].role]-ord[HERO[y].role]).map(id=>({id, lv, star, aw:0, bonus:id===st.boss?{hpPct:.5, atkPct:.2}:{}}));
  return team;
}

// ---------- world map ----------
const REGIONS = [
  {n:'ตุ้นก้วน', ch:'涿'}, {n:'ลกเอี๋ยง', ch:'洛'}, {n:'ซิจิ๋ว', ch:'徐'}, {n:'กัวต๋อ', ch:'官'}, {n:'ซินเอี๋ย', ch:'新'},
  {n:'เตียงปัน', ch:'长'}, {n:'ผาแดง', ch:'赤'}, {n:'เกงจิ๋ว', ch:'荆'}, {n:'เสฉวน', ch:'蜀'}, {n:'ฮันต๋ง', ch:'汉'},
  {n:'อิเหลง', ch:'夷'}, {n:'ลำเต๋ง', ch:'南'}, {n:'กิสาน', ch:'祁'}, {n:'อู่จั้ง', ch:'五'}, {n:'เตียงอัน', ch:'安'}
];
const regionOf = stage => Math.floor((stage-1)/10);

// ---------- placeholder portraits ----------
// Chibi portraits drawn from simple shapes: role decides the headgear, LOOK adds beards, hair and details.
const ARMOR = {wei:'#20446b', shu:'#285c35', wu:'#7d2219', qun:'#4a3270'};
const PCACHE = {};
const ARMOR2 = {wei:'#122b47', shu:'#173b21', wu:'#4e140e', qun:'#2b1c46'};
const IRIS = ['#7a4416','#2b4f86','#8a2a22','#2f6a3a','#5d3a86','#8a6a16'];
const hashN = s => { let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))>>>0; return h };
// Mecha form (ร่างจักรกล): unlocked at awakening 3, a steel-and-light redesign of the same general.
const PDEFS = `<defs><radialGradient id="pg-aura"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
  <radialGradient id="pg-mech"><stop offset="0" stop-color="#9ff8ff" stop-opacity=".7"/><stop offset="1" stop-color="#2a8aa8" stop-opacity="0"/></radialGradient>
  <linearGradient id="pg-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9e4ee"/><stop offset="1" stop-color="#7d8fa6"/></linearGradient>
  <linearGradient id="pg-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#b8862a"/></linearGradient></defs>`;
// Painted art supplied by the owner (art/<id>.webp). Generals without it, and every mecha form, use the drawn SVG.
const ART = new Set(['zhuge','diaochan','guanyu','fazheng','guanyinping','jiangwei','machao','zhaoyun','liubei','zuoci','zhangjiao','lubu','sunjian','sunce','zhouyu','guojia']);
function portrait(id, mech=false){
  const key=id+(mech?'#m':'');
  if(PCACHE[key]) return PCACHE[key];
  const h=HERO[id];
  if(!mech && ART.has(id)) return PCACHE[key]=`<img class="art" src="art/${id}.webp" alt="" draggable="false" decoding="async">`;
  if(h.boss) return PCACHE[key]=`<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="56" r="40" fill="#ff6a2a" opacity=".25"/><path d="M14 40 L26 6 L38 34Z M86 40 L74 6 L62 34Z" fill="#e8c45a" stroke="#6b4a10"/><circle cx="50" cy="54" r="34" fill="#4a0e08"/><path d="M20 50 Q50 30 80 50 Q66 42 50 44 Q34 42 20 50Z" fill="#2a0604"/><ellipse cx="37" cy="52" rx="8" ry="5.5" fill="#ffcf5a"/><ellipse cx="63" cy="52" rx="8" ry="5.5" fill="#ffcf5a"/><ellipse cx="37" cy="52" rx="2" ry="5" fill="#2a0604"/><ellipse cx="63" cy="52" rx="2" ry="5" fill="#2a0604"/><path d="M30 70 L38 64 L44 72 L50 64 L56 72 L62 64 L70 70 L62 80 L38 80Z" fill="#fff4dc"/></svg>`;
  const L=LOOK[id]||{}, f=!!L.f, hv=hashN(id);
  const skin=L.skin||'#f9d8b9', skinS=L.skin?'#b07a52':'#eab894', hair=L.old?'#dcd6cc':(L.hair||'#22170f'), bc=L.old?'#efebe3':(L.beardColor||hair);
  const armor=mech?'url(#pg-steel)':ARMOR[h.fac], armor2=mech?'#3a4658':ARMOR2[h.fac], trim=mech?'#5ff0ff':'#e8c45a', iris=mech?'#2ad8ff':IRIS[hv%IRIS.length];
  const blade=mech?'#bff8ff':'#dfe5ea';
  let g=PDEFS+`<ellipse cx="50" cy="58" rx="46" ry="42" fill="url(#${mech?'pg-mech':'pg-aura'})"/>`;
  // weapon behind the body
  const W={
    war:`<path d="M88 100 L72 8" stroke="#5a3a1a" stroke-width="3.2"/><path d="M72 8 Q58 14 62 34 L74 24Z" fill="${blade}" stroke="#5a5f66"/><circle cx="73" cy="26" r="2.4" fill="#c4321f"/>`,
    cav:`<path d="M90 100 L76 4" stroke="#5a3a1a" stroke-width="3"/><path d="M76 4 L71 18 L76 24 L81 17Z" fill="${blade}" stroke="#5a5f66"/><path d="M76 24 Q70 30 72 36 M76 24 Q82 30 80 36" stroke="#c4321f" stroke-width="2" fill="none"/>`,
    arch:`<path d="M86 14 Q62 52 86 94" fill="none" stroke="#7a4a1a" stroke-width="3.4"/><path d="M86 14 L86 94" stroke="#efe6d0" stroke-width=".9"/>`,
    strat:`<g transform="translate(80 40) rotate(18)"><path d="M0 0 Q-15 -20 0 -34 Q15 -20 0 0Z" fill="${mech?'#bff8ff':'#f6f2e6'}" stroke="#b9b2a0"/><path d="M0 -2 L0 -30 M0 -8 L-7 -22 M0 -8 L7 -22" stroke="#cfc6b0" stroke-width=".8"/><rect x="-1.6" y="0" width="3.2" height="18" fill="#7a4a1a"/></g>`,
    heal:`<path d="M86 100 L80 20" stroke="#6a4a22" stroke-width="3"/><circle cx="80" cy="22" r="6" fill="#c9a24a"/><circle cx="80" cy="12" r="4" fill="#c9a24a"/><path d="M80 22 Q90 26 88 34" stroke="#c4321f" stroke-width="1.6" fill="none"/>`
  };
  g+=W[h.role];
  if(mech) g+=`<path d="M8 70 L20 54 L26 74Z M92 70 L80 54 L74 74Z" fill="#7d8fa6" stroke="#5ff0ff" stroke-width="1"/>`;
  // body
  g+=`<path d="M12 100 Q13 75 34 69 L66 69 Q87 75 88 100Z" fill="${armor}"/>`;
  g+=`<path d="M40 69 L50 83 L60 69Z" fill="${mech?'#1d2633':'#f3ead6'}"/><path d="M37 69 L50 86 L63 69" fill="none" stroke="${trim}" stroke-width="2.6"/>`;
  g+=`<path d="M11 86 Q15 67 34 68 Q31 80 22 90Z" fill="${armor2}" stroke="${trim}" stroke-width="1.6"/><path d="M89 86 Q85 67 66 68 Q69 80 78 90Z" fill="${armor2}" stroke="${trim}" stroke-width="1.6"/>`;
  g+=`<rect x="30" y="94" width="40" height="6" fill="${armor2}"/><circle cx="50" cy="96.5" r="3.2" fill="${trim}"/>`;
  if(mech) g+=`<circle cx="50" cy="89" r="4" fill="#5ff0ff"/><circle cx="50" cy="89" r="7" fill="none" stroke="#5ff0ff" stroke-width="1" opacity=".6"/><path d="M24 80 L34 80 M66 80 L76 80" stroke="#5ff0ff" stroke-width="1.4"/>`;
  g+=`<rect x="44" y="61" width="12" height="10" rx="3" fill="${skinS}"/>`;
  // hair behind the head
  if(f) g+=`<path d="M21 46 Q15 84 30 92 L70 92 Q85 84 79 46Z" fill="${hair}"/>`;
  else if(!mech && (h.role==='arch'||h.role==='strat')) g+=`<circle cx="50" cy="15" r="7.5" fill="${hair}"/>`;
  // head
  g+=`<ellipse cx="25" cy="46" rx="3.6" ry="5.2" fill="${skin}"/><ellipse cx="75" cy="46" rx="3.6" ry="5.2" fill="${skin}"/>`;
  g+=`<circle cx="50" cy="43" r="25" fill="${skin}"/><path d="M26 50 Q50 76 74 50 Q67 65 50 68 Q33 65 26 50Z" fill="${skinS}" opacity=".45"/>`;
  // front hair
  const HF = f ? `M25 50 Q22 16 50 14 Q78 16 75 50 Q72 31 60 27 Q54 37 44 32 Q33 35 25 50Z`
    : [`M25 45 Q23 16 50 15 Q77 16 75 45 Q72 29 62 26 Q56 33 48 29 Q38 33 32 29 Q27 35 25 45Z`,
       `M25 45 Q24 15 50 15 Q76 15 75 45 Q70 27 44 27 Q34 29 25 45Z`,
       `M25 45 L22 29 L30 31 L30 19 L40 25 L46 13 L54 23 L62 15 L66 27 L76 25 L75 45 Q66 29 50 29 Q34 29 25 45Z`][hv%3];
  g+=`<path d="${HF}" fill="${hair}"/>`;
  if(f) g+=`<path d="M25 44 Q21 66 27 80 L31 78 Q28 62 30 46Z M75 44 Q79 66 73 80 L69 78 Q72 62 70 46Z" fill="${hair}"/>`;
  // eyes
  const ey=f?6.6:5.8;
  for(const cx of [39,61]){
    g+=`<ellipse cx="${cx}" cy="48" rx="4.4" ry="${ey}" fill="#24160e"/><ellipse cx="${cx}" cy="49.6" rx="3.1" ry="${(ey-2).toFixed(1)}" fill="${iris}"/>`;
    g+=`<circle cx="${cx+1.5}" cy="45.4" r="1.7" fill="#fff"/><circle cx="${cx-1.3}" cy="51.6" r=".85" fill="#fff"/>`;
    g+=`<path d="M${cx-5.2} ${(49-ey).toFixed(1)} Q${cx} ${(46.4-ey).toFixed(1)} ${cx+5.2} ${(49-ey).toFixed(1)}" stroke="#1a100a" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  }
  if(f) g+=`<path d="M33.6 42.6 L31.4 41 M66.4 42.6 L68.6 41" stroke="#1a100a" stroke-width="1.4" stroke-linecap="round"/>`;
  else {
    const stern=h.role==='war'||h.role==='cav'; const bcol=L.old?'#a8a29a':hair;
    g+= stern ? `<path d="M32 37 L45 40 M68 37 L55 40" stroke="${bcol}" stroke-width="3" stroke-linecap="round"/>`
              : `<path d="M32 38.5 Q38 35.5 45 38.5 M68 38.5 Q62 35.5 55 38.5" stroke="${bcol}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
  g+=`<ellipse cx="32" cy="56" rx="4.2" ry="2.2" fill="#f08a8a" opacity="${f?.55:.3}"/><ellipse cx="68" cy="56" rx="4.2" ry="2.2" fill="#f08a8a" opacity="${f?.55:.3}"/>`;
  if(L.patch) g+=`<ellipse cx="39" cy="48" rx="7" ry="6.4" fill="#141010"/><path d="M24 40 L74 56" stroke="#141010" stroke-width="1.8"/>`;
  if(mech) g+=`<path d="M31 55 L35 55 M65 55 L69 55" stroke="#5ff0ff" stroke-width="1.6"/>`;
  g+=`<path d="M49 54.4 Q50 55.8 51 54.4" stroke="${skinS}" stroke-width="1.4" fill="none"/>`;
  g+=`<path d="M46 59.5 Q50 62.5 54 59.5" stroke="#8a3a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  // beards
  const BD={long:`<path d="M32 55 Q34 92 50 99 Q66 92 68 55 Q60 65 50 65 Q40 65 32 55Z"/>`,
            short:`<path d="M32 55 Q36 74 50 76 Q64 74 68 55 Q60 65 50 65 Q40 65 32 55Z"/>`,
            wild:`<path d="M29 52 L33 66 L28 73 L37 75 L35 84 L43 79 L50 88 L57 79 L65 84 L63 75 L72 73 L67 66 L71 52 Q60 66 50 66 Q40 66 29 52Z"/>`,
            goatee:`<path d="M45.5 63 Q50 79 54.5 63Z"/>`};
  if(L.beard) g+=`<g fill="${bc}">${BD[L.beard]}</g><path d="M41 58.5 Q50 54.5 59 58.5" stroke="${bc}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  // headgear: always above the brows so the face stays visible
  const helm=(fill,stroke)=>`<path d="M22 34 Q23 6 50 5 Q77 6 78 34 Q65 25 50 25 Q35 25 22 34Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M27 31 Q50 21 73 31" stroke="${mech?'#5ff0ff':'#8a2a1a'}" stroke-width="2.6" fill="none"/>`;
  if(mech){
    g+=helm('url(#pg-steel)','#3a4658')+`<path d="M34 22 L50 13 L66 22" stroke="#5ff0ff" stroke-width="2.2" fill="none"/><path d="M50 6 L45 -2 L55 -2Z M24 26 L14 12 L28 20Z M76 26 L86 12 L72 20Z" fill="#5ff0ff"/>`;
  } else if(f){
    g+=`<path d="M35 21 Q50 10 65 21" fill="none" stroke="url(#pg-gold)" stroke-width="3.2"/><circle cx="50" cy="14" r="3.6" fill="#d9573f"/><path d="M64 20 L72 14 M64 20 L74 22" stroke="#e8c45a" stroke-width="1.6"/>`;
    if(h.role==='war'||h.role==='cav') g+=`<path d="M58 13 Q74 -3 94 7" stroke="#c4321f" stroke-width="3" fill="none"/>`;
  } else if(h.role==='war'){ g+=helm('url(#pg-gold)','#6b4a10')+`<path d="M50 -1 L44 10 L56 10Z" fill="#c4321f"/>` }
  else if(h.role==='cav'){ g+=helm('url(#pg-gold)','#6b4a10')+(L.pheasant?`<path d="M42 10 Q22 -12 2 4 M58 10 Q78 -12 98 4" stroke="#b02a1a" stroke-width="3.6" fill="none" stroke-linecap="round"/>`:`<path d="M56 9 Q74 -6 95 6" stroke="#c4321f" stroke-width="3.2" fill="none" stroke-linecap="round"/>`) }
  else if(h.role==='arch'){ g+=`<path d="M24 31 Q50 23 76 31 L76 35.5 Q50 27.5 24 35.5Z" fill="#c4321f"/><path d="M75 33 Q88 38 85 52" stroke="#c4321f" stroke-width="3" fill="none" stroke-linecap="round"/>` }
  else if(h.role==='strat'){ g+=`<rect x="39" y="3" width="22" height="15" rx="2.5" fill="#1c1c22"/><rect x="33" y="16" width="34" height="4.4" rx="2" fill="#1c1c22"/><circle cx="50" cy="10" r="2.4" fill="#3fbf8f"/>` }
  else { g+=`<path d="M26 31 Q29 7 50 7 Q71 7 74 31 Q62 23 50 23 Q38 23 26 31Z" fill="#ece3cc" stroke="#b9ae92"/><path d="M47 12 Q50 6 53 12 Q50 17 47 12Z" fill="#3b7b4a"/>` }
  return PCACHE[key]=`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${g}</svg>`;
}


export {
  HERO_MOD, HMOD, FAC_SYN, facCount, facSyn,
  FAC, BEATS, ROLE, RAR, HEROES, HERO, LOOK, TALENT, BONDS, SLOTS, QUAL, BEASTS, BOTS, LOGIN7, FISH, STORY, EVENTS, OPENING, FIRST_HERO, REGIONS, ROLE_COST,
  mulberry32, levelCap, stats, skillMult, power, lvCost, starCost, awCost, stageLabel, comboChance, regionOf,
  activeBonds, bondBonus, pickTeam, enemyTeam, towerTeam, stageReward, towerReward,
  gearStats, gearScore, enhCost, beastCost, beastPct, finalStats, powerOf, botTeam, arenaRankReward,
  simulate, storyTeam, storyKey, STORY_END_REWARD, curEvent, featuredSP, evMul, weekNo, portrait
};
