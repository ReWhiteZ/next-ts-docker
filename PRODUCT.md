# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router and TypeScript frontend. Express, Prisma, and SQLite backend in the sibling `node-ts-docker` project.

## Users

- ผู้ดูแลหรือเจ้าหน้าที่ที่จัดการข้อมูลหนังสือและรูปปก
- ผู้อ่านที่ค้นหาหนังสือ อ่านรีวิว และเขียนรีวิว

## Product Purpose

เว็บสำหรับค้นหาและจัดการหนังสือ รวมถึงดูและเพิ่มรีวิว เป้าหมายคือให้ทั้งผู้อ่านและผู้ดูแลทำงานกับข้อมูลหนังสือได้จากหน้าเดียว

## Operating Context

เป็นแบบฝึกหัดที่เชื่อม Next.js กับ Backend เดิม ระหว่างพัฒนา Next.js ทำงานที่ `localhost:3001` และ Backend ทำงานใน Docker ที่ `localhost:3000` หน้าจอต้องมีภาษาไทยและภาษาอังกฤษ

## Capabilities and Constraints

- หนังสือรองรับการอ่าน สร้าง แก้ไข และลบ
- หนังสือมีรีวิวซ้อนอยู่ในข้อมูลที่อ่านได้ และเพิ่มรีวิวได้
- API ยังไม่มีการแก้ไขหรือลบรีวิว
- รูปปกเป็น JPEG, PNG หรือ WebP ขนาดไม่เกิน 5 MB อัปโหลดผ่าน `POST /books/:id/cover`
- Backend เก็บรูปใน `uploads/covers` และบันทึก URL ไว้ใน `coverUrl`
- Backend ยังไม่มีระบบล็อกอินหรือกำหนดสิทธิ์ผู้ใช้

## Evidence on Hand

Backend เดิมมี CRUD หนังสือและ API รีวิว รูปปกอัปโหลดผ่าน API ได้ และ URL ที่ตอบกลับเปิดรูปจาก Backend ได้