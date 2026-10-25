# แนวทางภาพ (Art Direction) ขุนพลสามก๊ก

เป้าหมาย: ตัวละคร ฉาก และ UI ต้องดูเป็นโลกเดียวกัน
ภาพที่ทำให้เกมดู "แยกชิ้น" มักต่างกันใน 4 เรื่อง: สไตล์การวาด มุมกล้อง แสง และระดับรายละเอียด
ทุกภาพใหม่ให้ล็อก 4 เรื่องนี้ตามด้านล่าง

## 1. สไตล์เดียวกันทั้งเกม

- **สไตล์:** chibi 2.5D แบบ semi-realistic render หัวโต 1:2.5 ขอบนุ่ม ไม่มีเส้นขอบดำหนา
- **ฉาก:** ต้องเป็นสไตล์ painterly เดียวกับตัวละคร ห้ามใช้ภาพเหมือนจริงแบบภาพถ่ายหรือ concept art แนวสมจริง
- **สี:** โทนอุ่น แดงชาด ทอง เขียวหยก ความอิ่มสีปานกลาง ไม่สดจัด

## 2. มุมกล้อง

- **ฉากรบ:** มองลงทำมุม 25–30 องศา เห็นพื้นลานกว้างตั้งแต่กลางภาพลงไปถึงขอบล่าง
- **พื้นที่ยืน:** ส่วนล่าง 55% ของภาพต้องเป็นพื้นเรียบ ไม่มีของวาง (ตัวละครยืนตรงนี้)
- **ตัวละคร:** มุมกล้องเดียวกับฉาก คือมองลงเล็กน้อย หันขวา 3/4 ฝ่าเท้าอยู่บนพื้น

## 3. แสง

แต่ละฉากกำหนดทิศแสงไว้แล้ว ตัวละครที่สร้างใหม่ควรมี rim light ด้านเดียวกัน:

| ฉาก | แสง | rim light ตัวละคร |
|---|---|---|
| หมู่บ้าน (village) | แดดเช้าทองจากขวาบน | ขอบขวา สีทองอ่อน |
| ประตูป้อม (gate) | แดดเย็นย้อนแสงจากกลางหลัง | ขอบซ้ายและขวา สีส้ม |
| ท่าเรือ (harbor) | พระอาทิตย์ตกขวาหลัง | ขอบขวา สีส้มเข้ม |

ในโค้ด ค่าเหล่านี้อยู่ใน CSS `.sc-village`, `.sc-gate`, `.sc-harbor` (`--rim`, `--rimx`, `--g1`, `--shx`)
ฉากใหม่ให้เพิ่ม preset แบบเดียวกัน

## 4. ระดับรายละเอียด

- **ฉากหลัง:** รายละเอียดหนาแน่นเฉพาะครึ่งบน ส่วนพื้นลานให้เรียบ คอนทราสต์ต่ำ
- **ตัวละคร:** รายละเอียดสูงสุดในเฟรม เพื่อให้เป็นจุดเด่น
- **เอฟเฟกต์:** พื้นหลังโปร่งใส สีเข้ากับธาตุของขุนพล ขอบนุ่ม

## Prompt ต้นแบบ

**ฉากรบใหม่**

```
mobile game battle background, Three Kingdoms ancient China, stylized painterly 2.5D render
matching chibi character art, camera tilted down 28 degrees, wide empty stone courtyard
filling the bottom 55% of the image with low-contrast flat floor, scenery and buildings only
in the top 45%, [warm morning sun from the upper right / sunset backlight], soft atmospheric
haze toward the horizon, no characters, no text, 9:16
```

**ตัวละคร (ร่างยืน หรือ key pose)**

```
chibi Three Kingdoms general [ชื่อ/ลักษณะ], 2.5D semi-realistic game render, 1:2.5 head ratio,
3/4 view facing right, camera slightly above, full body with feet on the ground,
[rim light from the upper right in warm gold], soft ambient light, transparent background,
same style as the existing roster, no text
```

**เอฟเฟกต์สกิล**

```
game skill VFX [ลักษณะ], stylized painterly, glowing [สี] energy with soft edges,
transparent background, centered, no character, no text
```

## สิ่งที่โค้ดช่วยแล้ว

แม้ภาพยังไม่ตรงแนวทางนี้ทั้งหมด เกมก็ช่วยให้ภาพกลมกลืนขึ้นด้วย:
- เกรดสีชั้นเดียวทับทั้งฉากและตัวละคร
- rim light ฝั่งเดียวกับดวงอาทิตย์
- เงาตกตามทิศแสง
- หมอกขอบฟ้าและฉากหลังโฟกัสนุ่ม
- ประกายไฟหรือใบไม้ลอยตามฉาก

เมื่อได้ภาพใหม่ที่ตรงแนวทาง ผลจะเนียนที่สุด
