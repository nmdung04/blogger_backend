# Blogger API – Tài liệu endpoint cho frontend

Tất cả response (trừ vài lỗi đặc biệt) đều theo format:

- Thành công: `{ ok: true, data: <payload> }` hoặc `{ ok: true, message: string }`
- Thất bại: `{ ok: false, message: string, errors?: any }`

Auth sử dụng Bearer JWT ở header:

- `Authorization: Bearer <token>`

---

## 1. Health check

- **Method + URL**: `GET /`
- **Query params**: _None_
- **Request body schema**: _None_
- **Response schema**:
  ```json
  {
    "ok": true,
    "message": "Blogger API"
  }
  ```
- **Auth required?**: No
- **Role required?**: None
- **Error codes**: `500` (Internal Server Error – qua `errorHandler`)

---

## 2. Auth

### 2.1 Đăng nhập admin

- **Method + URL**: `POST /api/auth/login`
- **Query params**: _None_
- **Request body schema**:
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "token": "string (JWT)"
  }
  ```
- **Auth required?**: No
- **Role required?**: None
- **Error codes**:
  - `400`: Thiếu `email` hoặc `password` – `{ ok: false, message: "Email and password are required" }`
  - `401`: Sai thông tin đăng nhập – `{ ok: false, message: "Invalid credentials" }`
  - `500`: Lỗi không xác định – `{ ok: false, message: "Internal Server Error" }`

---

## 3. Public – Courses & Posts

Các endpoint này **không yêu cầu auth**.

### 3.1 Lấy danh sách courses

- **Method + URL**: `GET /api/courses`
- **Query params**: _None_
- **Request body schema**: _None_
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "_id": "string",
        "title": "string",
        "slug": "string",
        "description": "string | null",
        "thumbnail": "string | null",
        "createdAt": "ISODate",
        "updatedAt": "ISODate",
        "__v": 0
      }
    ]
  }
  ```
- **Auth required?**: No
- **Role required?**: None
- **Error codes**:
  - `500`: Lỗi server – `{ ok: false, message: "Internal Server Error" }`

### 3.2 Lấy chi tiết 1 course

- **Method + URL**: `GET /api/courses/:courseId`
- **Path params**:
  - `courseId`: string – Mongo ObjectId của `Course`
- **Query params**: _None_
- **Request body schema**: _None_
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "string",
      "title": "string",
      "slug": "string",
      "description": "string | null",
      "thumbnail": "string | null",
      "createdAt": "ISODate",
      "updatedAt": "ISODate",
      "__v": 0
    }
  }
  ```
- **Auth required?**: No
- **Role required?**: None
- **Error codes**:
  - `404`: Course không tồn tại – `{ ok: false, message: "Course not found" }`
  - `500`: Lỗi server

### 3.3 Lấy danh sách posts đã publish trong 1 course

- **Method + URL**: `GET /api/courses/:courseId/posts`
- **Path params**:
  - `courseId`: string – Mongo ObjectId của `Course`
- **Query params**: _None_
- **Request body schema**: _None_
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "_id": "string",
        "course": "string (Course ObjectId)",
        "title": "string",
        "slug": "string",
        "contentHtml": "string",
        "thumbnail": "string | null",
        "status": "draft | published",
        "createdAt": "ISODate",
        "updatedAt": "ISODate",
        "__v": 0
      }
    ]
  }
  ```
- **Ghi chú**: Controller chỉ lấy posts với `status: "published"`.
- **Auth required?**: No
- **Role required?**: None
- **Error codes**:
  - `500`: Lỗi server

### 3.4 Lấy chi tiết 1 post trong 1 course

- **Method + URL**: `GET /api/courses/:courseId/posts/:postId`
- **Path params**:
  - `courseId`: string – Mongo ObjectId của `Course`
  - `postId`: string – Mongo ObjectId của `Post`
- **Query params**: _None_
- **Request body schema**: _None_
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "string",
      "course": "string (Course ObjectId)",
      "title": "string",
      "slug": "string",
      "contentHtml": "string",
      "thumbnail": "string | null",
      "status": "draft | published",
      "createdAt": "ISODate",
      "updatedAt": "ISODate",
      "__v": 0
    }
  }
  ```
- **Auth required?**: No
- **Role required?**: None
- **Error codes**:
  - `404`: Không tìm thấy post hoặc post không thuộc course – `{ ok: false, message: "Post not found" }`
  - `500`: Lỗi server

---

## 4. Admin – Courses (Yêu cầu Bearer token + admin)

Tất cả endpoint dưới `/api/admin` dùng middleware `requireAdmin`, nghĩa là:

- Header bắt buộc: `Authorization: Bearer <token>`
- Token phải hợp lệ, còn hạn và `payload.role === "admin"`

### 4.1 Tạo mới course

- **Method + URL**: `POST /api/admin/courses`
- **Query params**: _None_
- **Request body schema**:
  ```json
  {
    "title": "string (required)",
    "slug": "string (optional, unique – nếu không gửi, backend tự sinh từ title)",
    "description": "string (optional)",
    "thumbnail": "string (optional, URL hoặc path)"
  }
  ```
- **Response schema (success – 201)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "string",
      "title": "string",
      "slug": "string",
      "description": "string | null",
      "thumbnail": "string | null",
      "createdAt": "ISODate",
      "updatedAt": "ISODate",
      "__v": 0
    }
  }
  ```
- **Auth required?**: Yes (Bearer token)
- **Role required?**: admin
- **Error codes**:
  - `401`: Thiếu/invalid/expired token
    - `{ ok: false, message: "Missing authorization token" }`
    - `{ ok: false, message: "Invalid or expired token" }`
  - `403`: Token hợp lệ nhưng không phải admin – `{ ok: false, message: "Forbidden" }`
  - `409`: Trùng `slug` – `{ ok: false, message: "Course slug already exists" }`
  - `500`: Lỗi server hoặc lỗi validate khác

### 4.2 Cập nhật course

- **Method + URL**: `PUT /api/admin/courses/:courseId`
- **Path params**:
  - `courseId`: string – Mongo ObjectId của `Course`
- **Query params**: _None_
- **Request body schema** (tương tự create, tất cả field optional):
  ```json
  {
    "title": "string (optional)",
    "slug": "string (optional, unique – nếu không gửi mà có title mới, backend có thể generate slug mới)",
    "description": "string (optional)",
    "thumbnail": "string (optional)"
  }
  ```
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "data": { /* Course object như trên */ }
  }
  ```
- **Auth required?**: Yes
- **Role required?**: admin
- **Error codes**:
  - `401`: Missing / invalid / expired token
  - `403`: Không phải admin
  - `404`: Course không tồn tại – `{ ok: false, message: "Course not found" }`
  - `409`: Trùng `slug` – như trên
  - `500`: Lỗi server

### 4.3 Xoá course

- **Method + URL**: `DELETE /api/admin/courses/:courseId`
- **Path params**:
  - `courseId`: string – Mongo ObjectId của `Course`
- **Query params**: _None_
- **Request body schema**: _None_
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "message": "Course deleted"
  }
  ```
- **Auth required?**: Yes
- **Role required?**: admin
- **Error codes**:
  - `401`: Missing / invalid / expired token
  - `403`: Không phải admin
  - `404`: Course không tồn tại – `{ ok: false, message: "Course not found" }`
  - `500`: Lỗi server

---

## 5. Admin – Posts (Yêu cầu Bearer token + admin)

### 5.1 Tạo mới post cho 1 course

- **Method + URL**: `POST /api/admin/courses/:courseId/posts`
- **Path params**:
  - `courseId`: string – Mongo ObjectId của `Course`
- **Query params**: _None_
- **Request body schema**:
  ```json
  {
    "title": "string (required)",
    "slug": "string (optional – nếu không gửi, backend generate từ title)",
    "contentHtml": "string (optional, default: \"\")",
    "thumbnail": "string (optional)",
    "status": "string (optional, enum: \"draft\" | \"published\", default: \"draft\")"
  }
  ```
- **Response schema (success – 201)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "string",
      "course": "string (Course ObjectId)",
      "title": "string",
      "slug": "string",
      "contentHtml": "string",
      "thumbnail": "string | null",
      "status": "draft | published",
      "createdAt": "ISODate",
      "updatedAt": "ISODate",
      "__v": 0
    }
  }
  ```
- **Auth required?**: Yes
- **Role required?**: admin
- **Error codes**:
  - `401`: Missing / invalid / expired token
  - `403`: Không phải admin
  - `409`: Trùng `slug` trong cùng `course` (unique index `{ course, slug }`)
  - `500`: Lỗi server / validate

### 5.2 Cập nhật post

- **Method + URL**: `PUT /api/admin/courses/:courseId/posts/:postId`
- **Path params**:
  - `courseId`: string – Mongo ObjectId của `Course`
  - `postId`: string – Mongo ObjectId của `Post`
- **Query params**: _None_
- **Request body schema** (tất cả field optional, giống create):
  ```json
  {
    "title": "string (optional)",
    "slug": "string (optional)",
    "contentHtml": "string (optional)",
    "thumbnail": "string (optional)",
    "status": "string (optional, \"draft\" | \"published\")"
  }
  ```
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "data": { /* Post object như trên */ }
  }
  ```
- **Auth required?**: Yes
- **Role required?**: admin
- **Error codes**:
  - `401`: Missing / invalid / expired token
  - `403`: Không phải admin
  - `404`: Không tìm thấy post hoặc không thuộc course – `{ ok: false, message: "Post not found" }`
  - `409`: Trùng `slug` (nếu vi phạm unique index)
  - `500`: Lỗi server

### 5.3 Xoá post

- **Method + URL**: `DELETE /api/admin/courses/:courseId/posts/:postId`
- **Path params**:
  - `courseId`: string – Mongo ObjectId của `Course`
  - `postId`: string – Mongo ObjectId của `Post`
- **Query params**: _None_
- **Request body schema**: _None_
- **Response schema (success)**:
  ```json
  {
    "ok": true,
    "message": "Post deleted"
  }
  ```
- **Auth required?**: Yes
- **Role required?**: admin
- **Error codes**:
  - `401`: Missing / invalid / expired token
  - `403`: Không phải admin
  - `404`: Không tìm thấy post hoặc không thuộc course – `{ ok: false, message: "Post not found" }`
  - `500`: Lỗi server

---

## 6. Lỗi chung & error handler

- **404 – Not Found (cho route không khớp)**:
  - Từ `notFoundHandler`
  - Response: `{ ok: false, message: "Not Found" }`

- **Error handler chung (`errorHandler`)**:
  - Nếu lỗi duplicate key (Mongo code `11000`):
    - `409 Conflict`
      - Nếu field chứa `slug`: `{ ok: false, message: "Course slug already exists" }`
      - Nếu field chứa `email`: `{ ok: false, message: "Email already in use" }`
      - Các trường hợp khác: `{ ok: false, message: "Duplicate key error" }`
  - Các lỗi khác:
    - Status mặc định từ `err.status` nếu có, ngược lại `500`
    - Response: `{ ok: false, message, errors?: err.errors }`

