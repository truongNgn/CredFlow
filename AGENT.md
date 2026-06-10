# AGENT.md — CredFlow Agent Guidelines

> Đây là file hướng dẫn dành cho AI Agent thực hiện dự án **CredFlow**.  
> Đọc file này TRƯỚC KHI bắt đầu bất kỳ task nào.

**Navigation:**
- [BRAIN.md](./BRAIN.md) — Cấu trúc project, schema, conventions
- [BRAIN_SKILL.md](./BRAIN_SKILL.md) — MCP tools, markdown skills, kỹ năng đặc biệt
- [implement_plan.md](./implement_plan.md) — Kế hoạch thực thi theo stages
- [developer_log.md](./developer_log.md) — Log công việc đã làm

---

## 1. Nguyên tắc làm việc

### Trước khi bắt đầu task
1. Đọc [implement_plan.md](./implement_plan.md) để biết task thuộc Stage nào
2. Đọc [BRAIN.md](./BRAIN.md) để nắm cấu trúc hiện tại của project
3. Đọc [developer_log.md](./developer_log.md) để biết những gì đã làm gần nhất
4. Đọc [BRAIN_SKILL.md](./BRAIN_SKILL.md) nếu cần dùng tool đặc biệt

### Trong khi làm task
- Tick checkbox trong [implement_plan.md](./implement_plan.md) ngay khi hoàn thành mỗi sub-task
- Log tiến độ vào [developer_log.md](./developer_log.md)
- Nếu tạo file/folder mới → cập nhật [BRAIN.md](./BRAIN.md)
- Nếu thêm feature mới → cập nhật section tương ứng trong [BRAIN.md](./BRAIN.md)

### Sau khi hoàn thành task
- Cập nhật status trong bảng tổng quan của [implement_plan.md](./implement_plan.md): `⬜ → ✅`
- Xóa log cũ trong [developer_log.md](./developer_log.md), chỉ giữ log của task hiện tại
- Cập nhật [BRAIN.md](./BRAIN.md) nếu có thay đổi cấu trúc

---

## 2. Coding Conventions

### Python FastAPI (Backend)
- Python 3.11+, dùng type hints đầy đủ
- File naming: `snake_case.py` (`package_router.py`, `auth_service.py`)
- Router → Service → Repository pattern (tương tự MVC)
- Dùng **Pydantic v2** cho request/response schemas
- Dùng **SQLAlchemy 2.0** async ORM + **asyncpg** driver
- Dùng **Alembic** cho database migrations
- Response format chuẩn:
  ```json
  { "success": true, "data": {...}, "message": "..." }
  { "success": false, "error": "...", "message": "..." }
  ```
- Tổ chức thư mục theo feature (không theo layer):
  ```
  app/
  ├── auth/          # router, service, schemas
  ├── packages/
  ├── credits/
  └── features/
  ```
- Exception handling: dùng `HTTPException` với status code rõ ràng
- Không dùng `print()` để debug — dùng `logging` module

### ReactJS (Frontend)
- Node.js 20+, TypeScript strict mode
- Component file: PascalCase (`PricingCard.tsx`)
- Hook file: camelCase bắt đầu bằng `use` (`useCredits.ts`)
- Zustand store: tách theo domain (`authStore.ts`, `creditsStore.ts`)
- API calls: tập trung trong `src/api/` folder, không gọi axios trực tiếp trong component
- Dùng `shadcn/ui` + `tailwindcss` cho UI, không custom CSS trừ khi cần thiết

### Database (PostgreSQL)
- Table names: snake_case, số nhiều (`user_credits`, `package_features`)
- Column names: snake_case
- Luôn có `created_at`, `updated_at` cho các bảng chính
- Foreign key: `{table_singular}_id` (e.g., `user_id`, `package_id`)
- Soft delete: `deleted_at` nullable thay vì xóa cứng với bảng quan trọng

### Git
- Commit message format: `type(scope): description`
  - Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`
  - Examples:
    - `feat(auth): add JWT middleware`
    - `feat(packages): implement CRUD API`
    - `fix(purchase): handle duplicate transaction`
    - `chore(docker): add multi-stage build`
- Commit nhỏ, thường xuyên — mỗi feature/fix là 1 commit

---

## 3. Architecture Decisions

### Backend Architecture
```
Request → FastAPI Router → Dependency (Auth/FeatureGuard) → Service → Repository → DB
                                                                  ↓
                                                           Response ←
```
- **Router**: HTTP layer — định nghĩa endpoint, validate via Pydantic, gọi service
- **Service**: Business logic — orchestrate repositories, enforce rules
- **Repository**: Data access — SQLAlchemy queries

### Auth Flow
- JWT Bearer token trong `Authorization` header
- Token payload: `{ user_id, email, role, exp }`
- Token expiry: 24h
- Dùng `python-jose` để sign/verify JWT
- `get_current_user` là FastAPI Dependency được inject vào protected routes

### Purchase Flow (Simulated)
```
User clicks "Buy" → POST /api/purchase
  → Validate package exists & is_active
  → Simulate payment (sleep 1s, 90% success rate)
  → BEGIN TRANSACTION
    → INSERT transactions (status=success/failed)
    → UPDATE user_credits.balance += credits_amount
    → UPSERT user_features (unlock features of package)
  → COMMIT
  → Return result
```

### Feature Permission System
- Mỗi package có danh sách `features` (many-to-many)
- Khi mua package → copy features vào `user_features`
- FastAPI Dependency `require_feature(slug)` check `user_features` table
- User giữ features đã unlock kể cả khi mua gói thấp hơn (không expire trong MVP)

---

## 4. Environment Variables

```env
# Backend (.env trong /backend)
DATABASE_URL=postgresql+asyncpg://credflow:credflow_secret@postgres:5432/credflow_db
JWT_SECRET=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
APP_ENV=development
CORS_ORIGINS=http://localhost:3000

# Frontend (.env trong /frontend)
VITE_API_URL=http://localhost:8000/api
```

---

## 5. Demo Data (Seed)

### Packages
| Name | Price | Credits | Features |
|------|-------|---------|----------|
| Basic | $9/mo | 100 | basic_api |
| Pro | $29/mo | 500 | basic_api, image_generation, analytics |
| Enterprise | $99/mo | 2000 | basic_api, image_generation, analytics, auto_post, priority_support |

### Features
| Slug | Name |
|------|------|
| basic_api | Basic API Access |
| image_generation | AI Image Generation |
| analytics | Advanced Analytics |
| auto_post | Auto Post Scheduler |
| priority_support | Priority Support |

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@credflow.dev | Admin@123 | admin |
| user@credflow.dev | User@123 | user |

---

## 6. Quy tắc cập nhật tài liệu

| Sự kiện | File cần cập nhật |
|---------|-----------------|
| Tạo file/folder mới | [BRAIN.md](./BRAIN.md) — File Structure |
| Thêm API endpoint mới | [BRAIN.md](./BRAIN.md) — API Reference |
| Thay đổi schema DB | [BRAIN.md](./BRAIN.md) — Database Schema |
| Hoàn thành 1 sub-task | [implement_plan.md](./implement_plan.md) — tick checkbox |
| Hoàn thành 1 stage | [implement_plan.md](./implement_plan.md) — cập nhật bảng tổng quan |
| Bắt đầu/kết thúc task | [developer_log.md](./developer_log.md) |
| Thêm feature hoàn chỉnh | [BRAIN.md](./BRAIN.md) — Features section |
| Học được skill/tool mới | [BRAIN_SKILL.md](./BRAIN_SKILL.md) |
