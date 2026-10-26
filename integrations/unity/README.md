# AutoSprite สำหรับ Unity

เตรียม AutoSprite 1.1.1 เป็น submodule ที่ `../autosprite-unity` โดยตรึงต้นทางไว้ที่
`9944d55572ff9772bbb61feb3821a4e1a4738722` เพื่อให้ติดตั้งเวอร์ชันเดิมซ้ำได้

**สถานะ:** ดาวน์โหลดซอร์สและตรวจ manifest/ไฟล์ Editor แล้ว ยังไม่ได้ compile หรือ
เปิดเมนูใน Unity เพราะ workspace นี้ไม่มี Unity Editor และไม่มี Unity project
เกม `samkok/web` ปัจจุบันใช้ Three.js; ส่วนขยายนี้ใช้ใน Unity Editor สำหรับสไปรต์ 2D

## ติดตั้งใน Unity project ของคุณ

ต้องใช้ Unity 2021.3 ขึ้นไป และ Git ที่ Unity เรียกใช้ได้
เปิด **Window → Package Manager → + → Install package from git URL** แล้ววาง:

```text
https://github.com/autospriteio/autosprite-unity.git?path=/Assets/AutoSprite#9944d55572ff9772bbb61feb3821a4e1a4738722
```

Package Manager จะติดตั้ง `com.unity.2d.sprite` ตาม dependency ของปลั๊กอินด้วย
เมื่อติดตั้งเสร็จ ตรวจเมนู **Window → AutoSprite** แล้วตั้งค่า API key จากบัญชี
[AutoSprite](https://www.autosprite.io/apikey) ภายใน Unity เพื่อดึงตัวละครของคุณ
ขั้นตอนนี้ยังไม่ได้เชื่อมบัญชีหรือสั่งสร้างงานบนบริการคลาวด์

ไฟล์ `packages.example.json` เป็นตัวอย่าง dependency สำหรับรวมเข้า
`Packages/manifest.json` ของ Unity project ที่มีอยู่ เก็บ dependencies เดิมไว้ด้วย

## ใช้ซอร์สที่ดาวน์โหลดไว้

```sh
git submodule update --init integrations/autosprite-unity
```

ใน Package Manager เลือก **Install package from disk** และเลือก
`integrations/autosprite-unity/Assets/AutoSprite/package.json`
หรือคัดลอกโฟลเดอร์ `Assets/AutoSprite` จาก submodule ลงใน `Assets/` ของ Unity project
ตามวิธี manual ของต้นทาง

[คู่มือต้นทาง](https://github.com/autospriteio/autosprite-unity)
