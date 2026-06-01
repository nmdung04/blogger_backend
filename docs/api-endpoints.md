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

### 3.0 AI Chat công khai

Module AI Chat hiện hoạt động theo mô hình **anonymous + stateless**:

- **Không yêu cầu đăng nhập**
- **Không lưu conversation/message ở backend**
- Frontend phải tự giữ lịch sử chat cục bộ và gửi lại qua field `history`
- Backend tự thêm `system prompt`; frontend **không được** gửi role `system`
- `history` chỉ chấp nhận các role:
  - `user`
  - `assistant`
- Provider hiện tại là **Gemini**
- Giới hạn mặc định hiện tại:
  - `history` tối đa `20` messages
  - mỗi message tối đa `8000` ký tự
  - rate limit theo IP/client trong cửa sổ thời gian ngắn

### 3.0.1 Gửi message AI thường

- **Method + URL**: `POST /api/chat`
- **Query params**: _None_
- **Request body schema**:
  ```json
  {
    "content": "string (required)",
    "history": [
      {
        "role": "user | assistant",
        "content": "string"
      }
    ]
  }
  ```
- **Response schema (success – 201)**:
  ```json
  {
    "ok": true,
    "data": {
      "message": {
        "role": "assistant",
        "content": "string",
        "model": "string",
        "finishReason": "string | null"
      },
      "usage": {
        "promptTokens": 123,
        "completionTokens": 45,
        "totalTokens": 168,
        "estimatedCost": 0
      }
    }
  }
  ```
- **Frontend flow khuyến nghị**:
  - Gửi `content` hiện tại
  - Gửi kèm `history` là các cặp hỏi/đáp gần nhất mà UI đang giữ
  - Khi nhận response:
    - append `{ role: "user", content }`
    - append `data.message`
  - Không cần lưu `conversationId`
- **Auth required?**: No
- **Role required?**: None
- **Error codes**:
  - `400`: Request không hợp lệ
  - `429`: Vượt rate limit
  - `502`: AI trả về nội dung rỗng
  - `503`: thiếu `GEMINI_API_KEY` hoặc AI bị disable
  - `500`: Lỗi server khác

### 3.0.2 Gửi message AI dạng stream

- **Method + URL**: `POST /api/chat/stream`
- **Headers quan trọng**:
  - `Content-Type: application/json`
  - `Accept: text/event-stream`
- **Query params**: _None_
- **Request body schema**:
  ```json
  {
    "content": "string (required)",
    "history": [
      {
        "role": "user | assistant",
        "content": "string"
      }
    ]
  }
  ```
- **Response type**: `text/event-stream`
- **SSE event contract**:
  - `start`
    ```json
    { "ok": true }
    ```
  - `delta`
    ```json
    { "delta": "partial token text" }
    ```
  - `done`
    ```json
    {
      "message": {
        "role": "assistant",
        "content": "full response text",
        "model": "string",
        "finishReason": "string | null"
      }
    }
    ```
  - `usage`
    ```json
    {
      "promptTokens": 123,
      "completionTokens": 45,
      "totalTokens": 168,
      "estimatedCost": 0
    }
    ```
  - `error`
    ```json
    {
      "message": "string",
      "status": 400
    }
    ```
- **Auth required?**: No
- **Role required?**: None
- **Error behavior**:
  - Lỗi sẽ được phát qua event `error` thay vì JSON response thông thường
  - Một số lỗi phổ biến:
    - `400`: body/history không hợp lệ
    - `429`: vượt rate limit hoặc đang có stream khác từ cùng client
    - `503`: thiếu `GEMINI_API_KEY` hoặc AI bị disable

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

