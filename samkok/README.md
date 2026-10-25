# เวอร์ชัน 3D ใน repository นี้

เกมในโฟลเดอร์นี้นำมาจากต้นฉบับและปรับ renderer เป็น 3D แล้ว ดู [คู่มือ 3D](three/README.md) สำหรับวิธีรัน ขอบเขต และข้อจำกัด ข้อความด้านล่างเป็น README ต้นฉบับเพื่ออ้างอิง ความสามารถออนไลน์ของต้นฉบับไม่ได้เปิดใช้โดยค่าเริ่มต้นใน fork นี้

---

# ขุนพลสามก๊ก

เล่นได้ที่: https://niasmin.github.io/samkok/

เกมสะสมขุนพลสามก๊กแบบ idle RPG สร้างขึ้นใหม่ทั้งหมด โค้ด กลไก และภาพเป็นงานของโปรเจกต์นี้เอง ตัวละครมาจากวรรณกรรมสามก๊กซึ่งเป็นสาธารณสมบัติ ไม่มีโค้ด ภาพ เสียง หรือข้อมูลจากเกมเชิงพาณิชย์ใด ๆ

## โครงสร้าง
| โฟลเดอร์ | เนื้อหา |
| --- | --- |
| `web/` | เกมเวอร์ชันเว็บ ไฟล์เดียว เล่นได้ทันที (GitHub Pages deploy จากโฟลเดอร์นี้) |
| `web/art/` | ภาพขุนพล 16 ตัว (สร้างด้วย ChatGPT) ย่อเป็น WebP |
| `cocos/` | โปรเจกต์ Cocos Creator 3.8: ตรรกะเกม, component ตัวอย่าง, เทสต์, ภาพขนาดเต็ม |
| `docs/prompts.csv` | prompt สร้างภาพของขุนพลทั้ง 61 คน |

## ระบบในเกม
ขุนพล 64 คน (A / S / S+) · เริ่มเกมด้วยเล่าปี่วัยหนุ่มพร้อมระบบสอนเล่น · ทัพ 6 ช่อง · ป้องกันกายภาพและเวท · เศษขุนพล · แผนที่โลก 15 แคว้น · ยา EXP · แต้มมิตรภาพและร้านมิตรภาพ · ต้นทุนเลื่อนระดับตามอาชีพ · ช่วยสู้ (ยืมขุนพล) · ลานฝึกและอัปเกรดทั้งทัพ · ทดลองใช้ขุนพล · อันดับกิจกรรมรายสัปดาห์ · ด่านพิชิตศึกและรางวัลออฟไลน์ · เนื้อเรื่อง 8 บท · หอท้าขุนพล · อัญเชิญพร้อมการันตี · ศาลตื่นจิต · ตื่นจิต 5 ขั้น เลเวลสูงสุด 1000 · ร่างจักรกล · สกิล 5 แบบ · มิตรภาพ · อุปกรณ์ · สัตว์เทพ · ตกปลา · ประลอง · กิลด์และบอส · ร้านค้า · ภารกิจรายวัน · ของขวัญ 7 วัน · กิจกรรมรายสัปดาห์ · เพลงและเสียงประกอบสังเคราะห์สด

## รัน
- เล่นเวอร์ชันเว็บ: เปิด `web/index.html` หรือรัน static server ในโฟลเดอร์ `web/`
- เทสต์ตรรกะเกม (Node 22.6+): `cd cocos && npm test`

## ข้อจำกัด
- ระบบเล่นหลายคน (ประลองกับผู้เล่นจริง แชต กิลด์ร่วมกัน) ทำงานเฉพาะเมื่อเปิดผ่าน claude.ai เพราะใช้ฐานข้อมูลของ artifact เมื่อเปิดจาก GitHub Pages เกมจะเล่นแบบออฟไลน์กับคู่ต่อสู้ NPC
- ขุนพล 45 คนยังใช้ภาพที่วาดด้วยโค้ด รอภาพจริง (ตั้งชื่อไฟล์ตามรหัสใน `docs/prompts.csv`)
- โปรเจกต์ Cocos ยังไม่มีหน้าจอ และ component ยังไม่ได้ทดสอบใน editor

## ที่มาของภาพ
ภาพขุนพล 16 ตัวสร้างด้วย ChatGPT ภาพอื่นวาดด้วยโค้ดในเกม

## Online backend (web build)

The GitHub Pages build talks to the Supabase project `kunphon-samkok` (ref `wkbpbihsdymjwapqgvpp`, Singapore).
Inside Claude the game keeps using the artifact's own storage instead.

- `players`: one row per player (name + shared doc: defence team, arena points, guild, recent chat). Everyone signed in can read; only the owner writes.
- `saves`: private cloud save per player, plus a one-day, one-time transfer code (`make_transfer_code` / `claim_transfer`).
- `coupons` / `coupon_redemptions`: server-checked codes via `redeem_coupon`; admins create and list codes with `admin_create_coupons` / `admin_list_coupons` using a passphrase stored hashed in `private.admin_secret` (`admin_change_pass` rotates it).
- Players sign in anonymously, so **Authentication → Sign In / Providers → Allow anonymous sign-ins** must be on.
- The publishable key in `web/index.html` is meant to be public; all access is enforced by row-level security.

### Building and running the web build

- `python3 tools/build_web.py <kunphon-samkok.html>` writes `web/index.html` with the PWA, share-card and favicon tags and stamps `web/sw.js` with a new cache version.
- The web build installs as an app ("Add to Home Screen") and keeps working offline after the first visit; Supabase features need a connection.
- The coupon admin form is hidden from players; open the game at `…/web/#admin` to use it.
- `tools/sql/insights.sql` has queries for the play funnel, hardest stages, daily players and feedback; `tools/sql/cleanup_test_accounts.sql` removes the accounts made during testing.
