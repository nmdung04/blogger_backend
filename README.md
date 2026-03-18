# Blogger Backend (Node.js + Express + MongoDB)

Backend REST API cho website blogger với 2 role:
- **User** (không cần đăng nhập): xem khóa học và bài viết
- **Admin**: quản lý khóa học và bài viết

## 🚀 Quick Start

1. Copy `.env.example` thành `.env` và cấu hình biến môi trường
2. Cài dependencies:
   ```bash
   npm install
   ```
3. Chạy server (dev):
   ```bash
   npm run dev
   ```

## 📁 Cấu trúc chính

- `src/server.js` – khởi tạo kết nối DB, khởi động server
- `src/app.js` – cấu hình Express, routes, middleware
- `src/routes` – định nghĩa các endpoint API
- `src/controllers` – xử lý request/response
- `src/models` – định nghĩa schema MongoDB (Mongoose)
- `src/middlewares` – auth + error handling

## 🔐 Admin (Auth)
- POST `/api/auth/login`

## 📚 Public
- GET `/api/courses`
- GET `/api/courses/:courseId`
- GET `/api/courses/:courseId/posts/:postId`
