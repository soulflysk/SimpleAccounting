# SimpleAccounting — React + .NET Web API

```
backend/    .NET 8 Web API (EF Core SQL Server + ClosedXML)
frontend/   React 18 + TypeScript + Vite + Bootstrap 5
```

## รัน Backend
```bash
cd backend
# แก้ ConnectionStrings:DefaultConnection ใน appsettings.json ให้ตรงกับฐานข้อมูลเดิม
dotnet restore
dotnet run            # http://localhost:5000
```
ถ้าใช้ฐานข้อมูลเดิมอยู่แล้ว ตาราง `Transactions` ใช้ schema เดิมได้เลย
ถ้าเริ่มใหม่: `dotnet ef migrations add Init && dotnet ef database update`

## รัน Frontend
```bash
cd frontend
npm install
npm run dev           # http://localhost:5173  (proxy /api -> http://localhost:5000)
```
Production: ตั้ง `VITE_API_URL=https://your-api-host` ก่อน `npm run build`
และเพิ่มโดเมนของ frontend ใน `Cors:Origins` ของ `appsettings.json`

## API
| Method | URL | หน้าที่ |
|---|---|---|
| GET | `/api/transactions?pageNumber=1` | รายการหน้าละ 50 + summary |
| POST | `/api/transactions` | เพิ่มรายการ |
| PUT | `/api/transactions/{id}` | แก้ไข (วันที่/ประเภท/รายการ/ราคา) |
| DELETE | `/api/transactions/{id}` | ลบ |
| POST | `/api/transactions/{id}/toggle-disabled` | สลับ "ไม่รวม" |
| POST | `/api/transactions/import` | อัปโหลด .xlsx (field `file`) |

## หมายเหตุการเปลี่ยนแปลงจากเวอร์ชัน MVC
- ตัด Anti-Forgery token ออก (ใช้ API + CORS แทน) — ถ้าจะใช้งานจริงบนอินเทอร์เน็ต ควรเพิ่ม authentication (JWT/cookie)
- ฝั่ง API คืน `summary` มากับทุก action ทำให้ยอดรวมอัปเดตโดยไม่ต้องคำนวณฝั่ง client
- Import Excel ถ้าแถวใดประเภทไม่ถูกต้อง จะหยุดและไม่บันทึกอะไรเลย (เหมือนเดิม)
