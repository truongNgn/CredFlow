# CredFlow — Implementation Plan

> **Project:** CredFlow — SaaS Credit Management Platform  
> **Stack:** Python FastAPI (backend) · ReactJS/Node.js (frontend) · PostgreSQL · Docker  
> **Docs:** [AGENT.md](./AGENT.md) · [BRAIN.md](./BRAIN.md) · [BRAIN_SKILL.md](./BRAIN_SKILL.md) · [developer_log.md](./developer_log.md)

---

## Stage 0 — Project Bootstrap

- [x] Khởi tạo mono-repo với cấu trúc thư mục: `backend/`, `frontend/`
- [x] Tạo `.gitignore` (Python, Node, Docker, secrets)
- [x] Tạo `README.md` ban đầu
- [x] Tạo `docker-compose.yml` với services: `postgres`, `backend`, `frontend`
- [x] Cấu hình `.env.example`
- [x] Init git và cấu hình remote GitHub

---

## Stage 1 — Database Design & Migration

- [x] Tạo `backend/alembic.ini` và `alembic/env.py` (async config)
- [x] Tạo SQLAlchemy models:
  - [x] `models/user.py` — users table
  - [x] `models/package.py` — packages + package_features pivot
  - [x] `models/feature.py` — features table
  - [x] `models/user_credit.py` — user_credits table
  - [x] `models/transaction.py` — transactions table
  - [x] `models/user_feature.py` — user_features pivot
- [x] Tạo Alembic migration: `alembic revision --autogenerate -m "initial schema"`
- [x] Tạo `alembic/versions/seed_data.py` — seed 3 packages, 5 features, 2 demo users
- [x] Test migration: `alembic upgrade head`
- [x] Cập nhật [BRAIN.md](./BRAIN.md) nếu schema thay đổi

---

## Stage 2 — Backend: Core Setup (FastAPI)

- [x] Tạo `requirements.txt` với toàn bộ dependencies
- [x] Tạo `app/config.py` — load settings từ `.env` dùng pydantic-settings
- [x] Tạo `app/database.py` — async SQLAlchemy engine + `AsyncSession` factory
- [x] Tạo `app/dependencies.py` — `get_db()` dependency (yield AsyncSession)
- [x] Tạo `app/main.py` — FastAPI app, CORS middleware, include routers
- [x] Health check endpoint `GET /api/health`
- [x] Verify server chạy: `uvicorn app.main:app --reload`
- [x] Cập nhật [BRAIN.md](./BRAIN.md) với backend structure

---

## Stage 3 — Backend: Auth Module

- [x] Tạo `app/schemas/auth.py` — `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserResponse`
- [x] Tạo `app/services/auth_service.py`:
  - [x] `register_user()` — hash password, insert user, init user_credits row
  - [x] `login_user()` — verify password, return JWT
  - [x] `get_current_user()` — FastAPI Dependency: decode JWT → return User
  - [x] `require_admin()` — Dependency: check role == 'admin'
- [x] Tạo `app/routers/auth.py`:
  - [x] `POST /api/auth/register`
  - [x] `POST /api/auth/login`
  - [x] `GET /api/auth/me` (protected)
- [x] Test với Swagger UI (`/docs`)

---

## Stage 4 — Backend: Package Management API

- [x] Tạo `app/schemas/package.py` — `PackageCreate`, `PackageUpdate`, `PackageResponse`
- [x] Tạo `app/services/package_service.py` — CRUD + liên kết features
- [x] Tạo `app/routers/packages.py`:
  - [x] `GET /api/packages` — list (public)
  - [x] `GET /api/packages/{id}` — detail (public)
  - [x] `POST /api/admin/packages` — tạo (admin)
  - [x] `PUT /api/admin/packages/{id}` — sửa (admin)
  - [x] `DELETE /api/admin/packages/{id}` — xóa (admin)

---

## Stage 5 — Backend: Credits & Purchase Flow

- [x] Tạo `app/schemas/credits.py` — `PurchaseRequest`, `PurchaseResponse`, `TransactionResponse`, `BalanceResponse`
- [x] Tạo `app/services/credit_service.py`:
  - [x] `purchase_package()` — simulate payment, atomic DB transaction
  - [x] `get_balance()` — trả về số credits hiện tại
  - [x] `get_transactions()` — lịch sử với pagination
  - [x] `get_user_features()` — list features đã unlock
- [x] Tạo `app/routers/credits.py`:
  - [x] `POST /api/credits/purchase`
  - [x] `GET /api/credits/balance`
  - [x] `GET /api/credits/transactions`
  - [x] `GET /api/credits/features`
- [x] Test purchase flow: success và failed case

---

## Stage 6 — Backend: Feature Permission Middleware

- [x] Tạo `app/middleware/feature_guard.py` — `require_feature(slug: str)` FastAPI Dependency factory
- [x] Dependency check `user_features` table → raise `HTTPException(403)` nếu chưa unlock
- [x] Tạo `app/routers/features.py` với 3 demo endpoints:
  - [x] `POST /api/features/generate-image` — require `image_generation`
  - [x] `POST /api/features/auto-post` — require `auto_post`
  - [x] `GET /api/features/analytics` — require `analytics`
- [x] Test với user chưa mua và đã mua gói tương ứng

---

## Stage 7 — Frontend: Project Setup (ReactJS)

- [x] Init project: `npm create vite@latest frontend -- --template react-ts`
- [x] Cài dependencies: `react-router-dom`, `axios`, `zustand`, `tailwindcss`, `react-hot-toast`
- [x] Cài và config `shadcn/ui` (init + add button, card, input, table, dialog, badge)
- [x] Tạo `src/api/client.ts` — axios instance với JWT interceptor
- [x] Tạo Zustand stores: `authStore.ts`, `creditsStore.ts`
- [x] Setup React Router: định nghĩa tất cả routes trong `App.tsx`
- [x] Tạo `ProtectedRoute` component
- [x] Cập nhật [BRAIN.md](./BRAIN.md) với frontend structure

---

## Stage 8 — Frontend: Auth Pages

- [x] Tạo `src/api/authApi.ts` — `login()`, `register()`, `getMe()`
- [x] Trang `/login` — form với email/password, error handling
- [x] Trang `/register` — form với email/password/confirm, error handling
- [x] Tích hợp Zustand authStore: lưu token, user info
- [x] Auto redirect sau login thành công
- [x] Toast thông báo lỗi/thành công

---

## Stage 9 — Frontend: Pricing / Package List Page

- [x] Tạo `src/api/packagesApi.ts` — `getPackages()`, `getPackage(id)`
- [x] Trang `/pricing` — grid cards các gói:
  - [x] Tên, mô tả, giá, số credits
  - [x] Danh sách features với checkmark icon
  - [x] Badge "Most Popular" cho gói Pro
  - [x] Button "Mua ngay" (disabled nếu chưa login)
- [x] Highlight gói user đang có
- [x] Responsive: 1 col mobile, 3 col desktop

---

## Stage 10 — Frontend: Dashboard & Credits Page

- [x] Tạo `src/api/creditsApi.ts` — `getBalance()`, `getTransactions()`, `getFeatures()`
- [x] Trang `/dashboard`:
  - [x] Credits balance hiển thị lớn (animated number)
  - [x] Grid features đã unlock (icon + tên + description)
  - [x] Quick stats: tổng chi tiêu, số lần mua
  - [x] Button "Nạp thêm credits" → link đến `/pricing`
- [x] Trang `/transactions`:
  - [x] Table có pagination (10 rows/page)
  - [x] Columns: ngày, tên gói, credits, giá, trạng thái (badge màu)
  - [x] Filter theo status

---

## Stage 11 — Frontend: Purchase Flow

- [x] Modal xác nhận mua khi click "Mua ngay" (Dialog component)
- [x] Form giả lập thanh toán (dummy card number, name, CVV — chỉ UI, không validate thật)
- [x] Loading spinner khi đang xử lý (1-2s simulate)
- [x] Success state: confetti/animation + hiển thị credits mới + features unlocked
- [x] Error state: thông báo rõ ràng
- [x] Cập nhật credits balance trong Zustand store sau mua thành công

---

## Stage 12 — Frontend: Admin Panel

- [x] Route `/admin` — guard chỉ admin role
- [ ] Trang quản lý packages:
  - [x] Table danh sách packages với status toggle
  - [x] Button "Tạo mới" → Dialog form (tên, mô tả, giá, credits, chọn features)
  - [x] Button "Sửa" mỗi row → Dialog form pre-filled
  - [x] Button "Xóa" với confirm dialog
- [x] Hiển thị số users, tổng transactions (basic stats)

---

## Stage 13 — Docker & DevOps

- [x] `backend/Dockerfile` — multi-stage: builder + runtime (python:3.11-slim)
- [x] `frontend/Dockerfile` — build static với node:20-alpine + serve với nginx:alpine
- [x] `frontend/nginx.conf` — config cho React SPA (try_files $uri /index.html)
- [ ] `docker-compose.yml` hoàn chỉnh:
  - [x] `postgres` với healthcheck + volume
  - [x] `backend` với depends_on postgres (condition: healthy) + run migrations on start
  - [x] `frontend` với depends_on backend
- [x] `docker-compose.override.yml` — volume mount cho hot reload dev
- [x] Test `docker compose up --build` — toàn bộ stack chạy OK

---

## Stage 14 — Documentation & Final Polish

- [x] Viết `README.md` đầy đủ:
  - [ ] Giới thiệu + screenshot UI
  - [x] Tech stack
  - [x] Hướng dẫn chạy với Docker (3 lệnh)
  - [x] Hướng dẫn chạy local dev (backend + frontend riêng)
  - [x] API endpoints overview + link Swagger
  - [x] Tài khoản demo
- [x] Review code: xóa debug code, thêm comment cho logic phức tạp
- [x] Final commit: `chore: production ready`
- [x] Push lên GitHub public repo

## Stage 15 — Final Verification

- [x] Backend tests và Python compile pass
- [x] Frontend TypeScript build và ESLint pass
- [x] Docker Compose dev/production config validation pass
- [x] Docker image build và end-to-end smoke test

---

## Checklist Tổng Quan

| Stage | Tên | Status |
|-------|-----|--------|
| 0 | Project Bootstrap | ✅ |
| 1 | Database Design & Migration | ✅ |
| 2 | Backend Core Setup | ✅ |
| 3 | Auth Module | ✅ |
| 4 | Package Management API | ✅ |
| 5 | Credits & Purchase Flow | ✅ |
| 6 | Feature Permission Middleware | ✅ |
| 7 | Frontend Setup | ✅ |
| 8 | Auth Pages | ✅ |
| 9 | Pricing Page | ✅ |
| 10 | Dashboard & Credits | ✅ |
| 11 | Purchase Flow UI | ✅ |
| 12 | Admin Panel | ✅ |
| 13 | Docker & DevOps | ✅ |
| 14 | Docs & Final Polish | ✅ |
| 15 | Final Verification | ✅ |
