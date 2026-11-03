# Frontend: Next.js + TypeScript

หน้าเว็บตัวอย่างสำหรับค้นหาและจัดการหนังสือ อ่าน/เพิ่มรีวิว และอัปโหลดรูปปก เชื่อมกับ backend ใน repo `node-ts-docker`

รูปแบบหน้าเว็บใช้ **Tailwind CSS v4** ซึ่งตั้งค่าไว้ใน `package.json`, `next.config.ts` และ `app/globals.css` (`@import "tailwindcss";`) ไม่ได้ใช้ Bootstrap

## เครื่องมือที่ต้องมี

- Git
- Node.js 22 ขึ้นไป (แนะนำ Node.js 24 ให้ตรงกับ Docker image ของ backend)
- Docker Desktop หากต้องการเปิด frontend ด้วย Docker Compose
- ใช้ Command Prompt (CMD) ตามตัวอย่าง

## เริ่มจาก clone ใหม่

เปิด CMD แล้ว clone ทั้งสอง repo แยกกัน โดยแทน URL placeholder ด้วย URL จริงของแต่ละ repo:

```cmd
git clone <FRONTEND_REPOSITORY_URL>
git clone <BACKEND_REPOSITORY_URL>
```

เริ่ม backend ก่อนตาม README ของ `node-ts-docker` ที่พอร์ต `3000` จากนั้นเปิด frontend ใน CMD อีกหน้าต่าง:

```cmd
cd nextjs-ts-docker
copy .env.example .env.local
npm ci
npm run dev -- --port 3001
```

เปิด `http://localhost:3001` ใน browser ค่าใน `.env.local` ตั้ง `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` ให้ตรงกับ backend

> คำสั่ง `npm run dev -- --port 3001` ระบุพอร์ตให้ Next.js โดยตรง เพื่อไม่ให้ชนกับ backend ที่ใช้พอร์ต 3000

### เปิด frontend ด้วย Docker Compose

เมื่อเตรียม backend และฐานข้อมูลแล้ว เปิด CMD ในโฟลเดอร์ frontend:

```cmd
docker compose up --build
```

Compose map พอร์ตเครื่อง `3001` ไปยังพอร์ต `3000` ใน container และตั้ง `NEXT_PUBLIC_API_BASE_URL` ให้ชี้ `http://localhost:3000` หยุด service ด้วย `Ctrl+C` หรือ `docker compose down`

## โครงสร้างสำคัญ

```text
app/
  page.tsx              # หน้า client ที่จัดการ state, form และ event
  globals.css           # import Tailwind CSS v4 และ global styles
  layout.tsx            # root layout และ metadata
  lib/
    books-api.ts        # fetch helper สำหรับ Books, Reviews และ upload
    types.ts            # TypeScript types ของ Book และ Review
```

## การเชื่อม API

ฟังก์ชันใน `app/lib/books-api.ts` อ่าน base URL จาก `NEXT_PUBLIC_API_BASE_URL` และส่ง request ไปยัง backend:

| ฟังก์ชัน | Request |
| --- | --- |
| `getBooks()` | `GET /books` |
| `createBook()` | `POST /books` ส่ง JSON |
| `updateBook()` | `PUT /books/:id` ส่ง JSON |
| `deleteBook()` | `DELETE /books/:id` |
| `createReview()` | `POST /books/:id/reviews` ส่ง JSON |
| `uploadBookCover()` | `POST /books/:id/cover` ส่ง `FormData` |

รูปปกที่ตอบกลับเป็น relative URL เช่น `/uploads/covers/name.jpg`; หน้าเว็บนำไปประกอบกับ API base URL เพื่อแสดงรูป

### รูปแบบเรียก API จากหน้า Client Component

1. เรียก helper จาก `app/lib/books-api.ts` แทนการเขียน URL ซ้ำใน component
2. ตรวจ `response.ok` ใน helper และส่ง error ที่อ่านเข้าใจได้กลับไปให้หน้าเว็บ
3. เก็บผลลัพธ์และสถานะ เช่น loading/error ใน state ของ component
4. ปิดปุ่มระหว่างส่ง request และแสดง error เมื่อ request ล้มเหลว
5. เมื่อบันทึกสำเร็จ ให้อัปเดต state หรือโหลดข้อมูลใหม่

หน้า `app/page.tsx` เป็นตัวอย่างการโหลดรายการหนังสือ, กรองด้วยข้อความค้นหา, เพิ่ม/แก้ไข/ลบหนังสือ, ส่งรีวิว และอัปโหลดปก

### ส่งไฟล์จาก browser

```ts
const formData = new FormData();
formData.append("file", file);

await fetch(`${apiBaseUrl}/books/${bookId}/cover`, {
  method: "POST",
  body: formData,
});
```

ชื่อ field ต้องเป็น `file` ตาม backend และไม่ต้องกำหนด `Content-Type` เอง รูปที่ backend รองรับคือ JPEG, PNG หรือ WebP ขนาดไม่เกิน 5 MB

## ใช้ Tailwind CSS v4

- เขียน utility classes ใน `className` ของ JSX เช่น `"rounded-md border px-3 py-2"`
- `app/globals.css` เริ่ม Tailwind ด้วย `@import "tailwindcss";`
- เพิ่ม global styles หรือ theme variables ใน `globals.css` ตามรูปแบบที่มีอยู่
- ก่อนเพิ่ม CSS framework อื่น ตรวจ `package.json` และ stylesheet เดิมเพื่อหลีกเลี่ยงการเพิ่ม dependency ซ้ำ

## เพิ่ม CRUD ให้ entity ใหม่ เช่น Catalog

ทำ API contract และแบบข้อมูลให้ชัดก่อน แล้วทำงานตามลำดับ:

1. เพิ่ม type ของ entity ใน `app/lib/types.ts`
2. เพิ่มฟังก์ชัน list/detail/create/update/delete ใน API helper
3. สร้าง UI แสดงรายการและฟอร์ม โดยใช้ state หรือ `FormData` ตามความเหมาะสม
4. แสดง loading, success และ error state; ป้องกันการส่งซ้ำระหว่างบันทึก
5. เชื่อม relation ให้ตรงกับ response ของ API และทดสอบ flow create → read → update → delete

ในตัวอย่างปัจจุบัน Book มี CRUD ครบ ส่วน Review สร้างได้และอ่านซ้อนในข้อมูล Book แต่ API ยังไม่มีแก้ไขหรือลบ Review ถ้าโจทย์ต้องการ CRUD สองตาราง ให้เพิ่ม endpoint ที่ backend ก่อน แล้วค่อยเพิ่ม helper และ UI ที่ตรงกับ contract นั้น

## Swagger / OpenAPI และ Postman

เมื่อได้รับ spec จากโจทย์ ให้ import เข้า Postman เพื่อสำรวจ paths, methods, schemas และตัวอย่าง request/response จากนั้นสร้าง collection สำหรับลองเรียก API ตาม [คู่มือ Postman](https://learning.postman.com/docs/design-apis/specifications/generate-collections)

หากต้องการ generate TypeScript Fetch client ให้ทำงานในโฟลเดอร์ frontend และวาง spec ไว้ชื่อ `openapi.yaml`:

```cmd
docker run --rm -v "%cd%:/local" openapitools/openapi-generator-cli generate -i /local/openapi.yaml -g typescript-fetch -o /local/generated-client
```

โฟลเดอร์ `generated-client` ถูก ignore โดย Git ตรวจชื่อ operation, types, รูปแบบ error และ base URL ที่สร้างมา แล้วเลือกใช้จาก API helper ของแอป ดูรายละเอียด generator ใน [เอกสาร OpenAPI Generator](https://openapi-generator.tech/docs/generators/typescript-fetch/) ใช้วิธีนี้เมื่อกติกาสอบอนุญาต

## ตรวจเมื่อหน้าเว็บคุยกับ API ไม่ได้

- ตรวจว่า backend เปิดอยู่ที่ `http://localhost:3000/`
- ตรวจค่า `NEXT_PUBLIC_API_BASE_URL` ใน `.env.local` หรือ Compose environment
- ถ้าแก้ `.env.local` ขณะ Next.js ทำงาน ให้หยุดแล้วรัน `npm run dev -- --port 3001` ใหม่
- ตรวจว่า backend อนุญาต CORS จาก `http://localhost:3001`
- เปิด DevTools ใน browser ดู status code และ response ของ request ที่ล้มเหลว

## Checklist ก่อนเริ่มทำงาน

- [ ] เปิด backend ที่พอร์ต `3000` และ frontend ที่พอร์ต `3001`
- [ ] ตรวจค่า API base URL
- [ ] ทดสอบโหลดรายการหนังสือก่อนเริ่มแก้ UI
- [ ] ตรวจ request/response schema จาก Swagger/OpenAPI หากโจทย์ให้มา
- [ ] ทดสอบ form ทั้งกรณีสำเร็จและ validation/error
- [ ] ปฏิบัติตามกติกาสอบ รวมถึงข้อกำหนดเรื่องเครื่องมือและ AI
