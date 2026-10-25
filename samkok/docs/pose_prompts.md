# คำสั่ง ChatGPT สำหรับท่าต่อสู้ 4 จังหวะ

ใช้สร้างท่าให้ขุนพลที่ยังไม่มีท่าจริง (57 ตัว) ให้เข้าชุดกับ Asset Pack V2

## วิธีใช้ (ทำทีละตัว)
1. เปิดแชตใหม่ใน ChatGPT
2. แนบ **2 รูป**: รูปขุนพลตัวนั้น (ไฟล์ในโฟลเดอร์ `cocos/assets/resources/heroes/<id>_full.png` ของ repo หรือรูปเดิมที่คุณเคยสร้าง) และรูปชีตตัวอย่าง `sheets/zhaoyun_poses.png` จาก Asset Pack V2
3. คัดลอกคำสั่งของตัวนั้นไปวาง
4. ได้รูปแล้วตั้งชื่อตาม id เช่น `lubu_poses.png` รวมใส่ zip แล้วส่งให้ Claude

## คำสั่งกลาง (ใส่ไว้ทุกครั้ง)
> Using the attached character as the identity reference and the attached pose sheet only as a style and layout reference: create a 2×2 sprite atlas of this exact character in stylized premium Three Kingdoms mobile-RPG 3D style. Four full-body key poses in reading order: 1 ready stance, 2 wind-up, 3 attack/skill action, 4 recover. Fixed three-quarter camera, upper-left light, character faces right. Keep face, costume, colours and weapon identical across all four poses and keep the whole weapon inside each cell. Transparent background; no text, UI, borders, floor, shadows, glow, aura or effects. Square image.

## รายตัว

### โจโฉ (Cao Cao) · id: caocao · S+ · กุนซือ
> Character: Cao Cao. Action: straight jian sword: draw from the scabbard, then point the blade forward commanding. Save as **caocao_poses.png**

### กวนอู (Guan Yu) · id: guanyu · S+ · นักรบ
> Character: Guan Yu. Action: Green Dragon Crescent Blade: raise high, then a heavy diagonal downward cleave. Save as **guanyu_poses.png**

### กุยแก (Guo Jia) · id: guojia · S+ · กุนซือ
> Character: Guo Jia. Action: folding fan: snap it open overhead, then flick forward. Save as **guojia_poses.png**

### ลิโป้ (Lü Bu) · id: lubu · S+ · ทหารม้า
> Character: Lü Bu. Action: Fangtian halberd (crescent-bladed ji): draw it back over the shoulder, then a wide horizontal sweep. Save as **lubu_poses.png**

### บังทอง (Pang Tong) · id: pangtong · S+ · กุนซือ
> Character: Pang Tong. Action: staff with phoenix ornament: lift, then strike the ground forward. Save as **pangtong_poses.png**

### สุมาอี้ (Sima Yi) · id: simayi · S+ · กุนซือ
> Character: Sima Yi. Action: feather fan / scroll: raise slowly, then thrust the hand forward casting. Save as **simayi_poses.png**

### ซุนเซ็ก (Sun Ce) · id: sunce · S+ · ทหารม้า
> Character: Sun Ce. Action: spear: pull back with both hands, then a lunging thrust. Save as **sunce_poses.png**

### ซุนเกียน (Sun Jian) · id: sunjian · S+ · นักรบ
> Character: Sun Jian. Action: large dao saber: lift overhead, then a powerful downward slash. Save as **sunjian_poses.png**

### เตียวก๊ก (Zhang Jiao) · id: zhangjiao · S+ · กุนซือ
> Character: Zhang Jiao. Action: taiping staff and talisman: raise the talisman, then thrust the staff forward. Save as **zhangjiao_poses.png**

### จิวยี่ (Zhou Yu) · id: zhouyu · S+ · กุนซือ
> Character: Zhou Yu. Action: sword and flame scroll: raise the scroll, then fling it forward. Save as **zhouyu_poses.png**

### จอจู้ (Zuo Ci) · id: zuoci · S+ · กุนซือ
> Character: Zuo Ci. Action: taoist whisk: swirl overhead, then point forward. Save as **zuoci_poses.png**

### ชัวเหวินกี (Cai Wenji) · id: caiwenji · S · หมอ
> Character: Cai Wenji. Action: staff, herbs or gourd: raise the healing item, then extend an open hand forward (no effects). Save as **caiwenji_poses.png**

### โจผี (Cao Pi) · id: caopi · S · นักรบ
> Character: Cao Pi. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **caopi_poses.png**

### เตงงาย (Deng Ai) · id: dengai · S · ทหารม้า
> Character: Deng Ai. Action: polearm: pull the weapon back low, then a lunging thrust. Save as **dengai_poses.png**

### เตียวเสี้ยน (Diaochan) · id: diaochan · S · กุนซือ
> Character: Diaochan. Action: ribbon fan dance: spin with fans raised, then sweep both fans forward. Save as **diaochan_poses.png**

### หวดเจ้ง (Fa Zheng) · id: fazheng · S · กุนซือ
> Character: Fa Zheng. Action: fan, scroll or staff: raise it, then extend the hand forward casting a command (no effects). Save as **fazheng_poses.png**

### กวนอิ๋นผิง (Guan Yinping) · id: guanyinping · S · นักรบ
> Character: Guan Yinping. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **guanyinping_poses.png**

### เกียงอุย (Jiang Wei) · id: jiangwei · S · ทหารม้า
> Character: Jiang Wei. Action: polearm: pull the weapon back low, then a lunging thrust. Save as **jiangwei_poses.png**

### เล่าปี่ (Liu Bei) · id: liubei · S · นักรบ
> Character: Liu Bei. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **liubei_poses.png**

### ลกซุน (Lu Xun) · id: luxun · S · กุนซือ
> Character: Lu Xun. Action: fan, scroll or staff: raise it, then extend the hand forward casting a command (no effects). Save as **luxun_poses.png**

### ม้าเฉียว (Ma Chao) · id: machao · S · ทหารม้า
> Character: Ma Chao. Action: silver spear: twirl back, then a long lunge. Save as **machao_poses.png**

### เบ้งเฮ็ก (Meng Huo) · id: menghuo · S · นักรบ
> Character: Meng Huo. Action: large axe: swing back, then a heavy overhead chop. Save as **menghuo_poses.png**

### ซุนกวน (Sun Quan) · id: sunquan · S · นักรบ
> Character: Sun Quan. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **sunquan_poses.png**

### ซุนซ่างเซียง (Sun Shangxiang) · id: sunshangxiang · S · นักธนู
> Character: Sun Shangxiang. Action: compound bow: draw the string fully back, then release with the bow arm extended. Save as **sunshangxiang_poses.png**

### แฮหัวตุ้น (Xiahou Dun) · id: xiahoudun · S · นักรบ
> Character: Xiahou Dun. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **xiahoudun_poses.png**

### แฮหัวเอี๋ยน (Xiahou Yuan) · id: xiahouyuan · S · นักธนู
> Character: Xiahou Yuan. Action: bow: quick draw, then release leaning forward. Save as **xiahouyuan_poses.png**

### เตียวเลี้ยว (Zhang Liao) · id: zhangliao · S · ทหารม้า
> Character: Zhang Liao. Action: twin halberd spear: pull back on one side, then a charging thrust. Save as **zhangliao_poses.png**

### เอียนสี (Zhen Ji) · id: zhenji · S · กุนซือ
> Character: Zhen Ji. Action: fan, scroll or staff: raise it, then extend the hand forward casting a command (no effects). Save as **zhenji_poses.png**

### โจหยิน (Cao Ren) · id: caoren · A · นักรบ
> Character: Cao Ren. Action: shield and sword: brace behind the shield, then shield bash forward. Save as **caoren_poses.png**

### โจสิด (Cao Zhi) · id: caozhi · A · หมอ
> Character: Cao Zhi. Action: staff, herbs or gourd: raise the healing item, then extend an open hand forward (no effects). Save as **caozhi_poses.png**

### ไต้เกี้ยว (Da Qiao) · id: daqiao · A · หมอ
> Character: Da Qiao. Action: staff, herbs or gourd: raise the healing item, then extend an open hand forward (no effects). Save as **daqiao_poses.png**

### เตียนอุย (Dian Wei) · id: dianwei · A · นักรบ
> Character: Dian Wei. Action: twin halberds: cross them back, then twin forward chops. Save as **dianwei_poses.png**

### เตงฮอง (Ding Feng) · id: dingfeng · A · นักธนู
> Character: Ding Feng. Action: bow: draw the string back, then release with the bow arm extended. Save as **dingfeng_poses.png**

### ตั๋งโต๊ะ (Dong Zhuo) · id: dongzhuo · A · นักรบ
> Character: Dong Zhuo. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **dongzhuo_poses.png**

### กำเหลง (Gan Ning) · id: ganning · A · นักธนู
> Character: Gan Ning. Action: bow: draw the string back, then release with the bow arm extended. Save as **ganning_poses.png**

### กองซุนจ้าน (Gongsun Zan) · id: gongsunzan · A · ทหารม้า
> Character: Gongsun Zan. Action: polearm: pull the weapon back low, then a lunging thrust. Save as **gongsunzan_poses.png**

### กวนหิน (Guan Xing) · id: guanxing · A · นักรบ
> Character: Guan Xing. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **guanxing_poses.png**

### อุยกาย (Huang Gai) · id: huanggai · A · นักรบ
> Character: Huang Gai. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **huanggai_poses.png**

### ฮองตง (Huang Zhong) · id: huangzhong · A · นักธนู
> Character: Huang Zhong. Action: longbow: draw back to the cheek, then release. Save as **huangzhong_poses.png**

### เล่งทอง (Ling Tong) · id: lingtong · A · ทหารม้า
> Character: Ling Tong. Action: polearm: pull the weapon back low, then a lunging thrust. Save as **lingtong_poses.png**

### ลิบอง (Lü Meng) · id: lumeng · A · ทหารม้า
> Character: Lü Meng. Action: polearm: pull the weapon back low, then a lunging thrust. Save as **lumeng_poses.png**

### โลซก (Lu Su) · id: lusu · A · หมอ
> Character: Lu Su. Action: staff, herbs or gourd: raise the healing item, then extend an open hand forward (no effects). Save as **lusu_poses.png**

### ม้าหวินลก (Ma Yunlu) · id: mayunlu · A · ทหารม้า
> Character: Ma Yunlu. Action: polearm: pull the weapon back low, then a lunging thrust. Save as **mayunlu_poses.png**

### ไทสูจู้ (Taishi Ci) · id: taishici · A · นักธนู
> Character: Taishi Ci. Action: bow: draw the string back, then release with the bow arm extended. Save as **taishici_poses.png**

### อุยเอี๋ยน (Wei Yan) · id: weiyan · A · นักรบ
> Character: Wei Yan. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **weiyan_poses.png**

### เคาทู (Xu Chu) · id: xuchu · A · นักรบ
> Character: Xu Chu. Action: heavy club / dao: lift over the head, then smash downward. Save as **xuchu_poses.png**

### ซิหลง (Xu Huang) · id: xuhuang · A · นักรบ
> Character: Xu Huang. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **xuhuang_poses.png**

### ซุนฮก (Xun Yu) · id: xunyu · A · หมอ
> Character: Xun Yu. Action: staff, herbs or gourd: raise the healing item, then extend an open hand forward (no effects). Save as **xunyu_poses.png**

### อ้วนเสี้ยว (Yuan Shao) · id: yuanshao · A · นักธนู
> Character: Yuan Shao. Action: bow: draw the string back, then release with the bow arm extended. Save as **yuanshao_poses.png**

### อ้วนสุด (Yuan Shu) · id: yuanshu · A · กุนซือ
> Character: Yuan Shu. Action: fan, scroll or staff: raise it, then extend the hand forward casting a command (no effects). Save as **yuanshu_poses.png**

### งักจิ้น (Yue Jin) · id: yuejin · A · นักรบ
> Character: Yue Jin. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **yuejin_poses.png**

### อุยซี (Huang Yueying) · id: yueying · A · หมอ
> Character: Huang Yueying. Action: staff, herbs or gourd: raise the healing item, then extend an open hand forward (no effects). Save as **yueying_poses.png**

### เตียวเปา (Zhang Bao) · id: zhangbao · A · ทหารม้า
> Character: Zhang Bao. Action: polearm: pull the weapon back low, then a lunging thrust. Save as **zhangbao_poses.png**

### เตียวหุย (Zhang Fei) · id: zhangfei · A · นักรบ
> Character: Zhang Fei. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **zhangfei_poses.png**

### จงโฮ่ย (Zhong Hui) · id: zhonghui · A · กุนซือ
> Character: Zhong Hui. Action: fan, scroll or staff: raise it, then extend the hand forward casting a command (no effects). Save as **zhonghui_poses.png**

### จิวท่าย (Zhou Tai) · id: zhoutai · A · นักรบ
> Character: Zhou Tai. Action: melee weapon: wind up by pulling the weapon back, then a strong forward strike. Save as **zhoutai_poses.png**

### นางจูหยง (Zhurong) · id: zhurong · A · นักธนู
> Character: Zhurong. Action: flying knives: raise a fan of blades, then throw forward. Save as **zhurong_poses.png**
