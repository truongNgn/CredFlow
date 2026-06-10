# BRAIN.md — CredFlow Project Knowledge Base

> File này chứa toàn bộ thông tin về cấu trúc, schema, và trạng thái hiện tại của project.  
> Agent phải cập nhật file này sau mỗi feature/structure mới được tạo.

**Navigation:**
- [AGENT.md](./AGENT.md) — Guidelines & conventions
- [BRAIN_SKILL.md](./BRAIN_SKILL.md) — MCP tools & skills
- [implement_plan.md](./implement_plan.md) — Implementation plan
- [developer_log.md](./developer_log.md) — Activity log

---

## Project Overview

| Item | Detail |
|------|--------|
| **Name** | CredFlow |
| **Type** | SaaS Credit Management Module |
| **Backend** | Python 3.11 + FastAPI + SQLAlchemy 2.0 async |
| **Frontend** | ReactJS 18 + TypeScript + Vite + Node.js 20 |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT Bearer Token (`python-jose`) |
| **Migrations** | Alembic |
| **Deployment** | Docker Compose |

---

## File Structure

> Cập nhật section này mỗi khi tạo file/folder mới quan trọng.

```
credflow/                          # Root
├── backend/                       # Python FastAPI server
│   ├── app/
│   │   ├── main.py                # FastAPI app entry point
│   │   ├── database.py            # SQLAlchemy async engine & session
│   │   ├── dependencies.py        # Shared FastAPI dependencies (get_db, get_current_user)
│   │   ├── config.py              # Settings via pydantic-settings
│   │   ├── models/                # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── package.py
│   │   │   ├── feature.py
│   │   │   ├── transaction.py
│   │   │   └── user_credit.py
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── package.py
│   │   │   ├── credits.py
│   │   │   └── transaction.py
│   │   ├── routers/               # FastAPI routers
│   │   │   ├── auth.py
│   │   │   ├── packages.py
│   │   │   ├── credits.py
│   │   │   └── features.py
│   │   ├── services/              # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── package_service.py
│   │   │   ├── credit_service.py
│   │   │   └── feature_service.py
│   │   └── middleware/
│   │       └── feature_guard.py   # Feature permission dependency
│   ├── tests/                      # Async API integration tests
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_packages.py
│   │   └── test_credits.py
│   ├── alembic/                   # DB migrations
│   │   ├── env.py
│   │   └── versions/
│   │       ├── 0001_initial_schema.py
│   │       └── 0002_seed_data.py
│   ├── alembic.ini
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
│
├── frontend/                      # React app
│   ├── src/
│   │   ├── api/                   # Axios instances & API calls
│   │   │   ├── client.ts          # Axios instance with JWT interceptor
│   │   │   ├── authApi.ts
│   │   │   ├── packagesApi.ts
│   │   │   └── creditsApi.ts
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/                # shadcn-style Button, Card, Input, Badge
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AuthShell.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── pages/                 # Route-level page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TransactionsPage.tsx
│   │   │   └── AdminPage.tsx
│   │   ├── store/                 # Zustand state stores
│   │   │   ├── authStore.ts
│   │   │   └── creditsStore.ts
│   │   └── types/                 # TypeScript interfaces
│   │       └── index.ts
│   │   ├── App.tsx                # Router and auth session restore
│   │   ├── main.tsx
│   │   └── index.css              # Tailwind directives and global theme
│   ├── public/
│   ├── components.json            # shadcn/ui aliases and style config
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docker-compose.yml
├── docker-compose.override.yml    # Dev overrides (hot reload)
├── .env.example
├── README.md
├── AGENT.md
├── BRAIN.md                       # This file
├── BRAIN_SKILL.md
├── implement_plan.md
└── developer_log.md
```

---

## Database Schema

> Cập nhật section này khi có migration mới.

### `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `packages`
```sql
CREATE TABLE packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  credit_amount INTEGER NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `features`
```sql
CREATE TABLE features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `package_features` (pivot)
```sql
CREATE TABLE package_features (
  package_id  UUID REFERENCES packages(id) ON DELETE CASCADE,
  feature_id  UUID REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, feature_id)
);
```

### `user_credits`
```sql
CREATE TABLE user_credits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance    INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `transactions`
```sql
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  package_id    UUID REFERENCES packages(id) ON DELETE SET NULL,
  amount        DECIMAL(10,2) NOT NULL,
  credits_added INTEGER NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|success|failed
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `user_features` (pivot)
```sql
CREATE TABLE user_features (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_id  UUID REFERENCES features(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, feature_id)
);
```

---

## API Reference

> Cập nhật section này mỗi khi thêm endpoint mới. Backend chạy trên port **8000**.

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Đăng ký |
| POST | `/api/auth/login` | Public | Đăng nhập, trả JWT |
| GET | `/api/auth/me` | JWT | Thông tin user hiện tại |

### Packages — `/api/packages`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/packages` | Public | List tất cả packages |
| GET | `/api/packages/{id}` | Public | Chi tiết 1 package |
| POST | `/api/admin/packages` | Admin | Tạo package |
| PUT | `/api/admin/packages/{id}` | Admin | Sửa package |
| DELETE | `/api/admin/packages/{id}` | Admin | Xóa package |
| GET | `/api/admin/packages` | Admin | List tất cả packages, gồm inactive |
| GET | `/api/admin/features` | Admin | Feature catalog cho package form |
| GET | `/api/admin/stats` | Admin | User, transaction và revenue stats |

### Credits & Purchase — `/api/credits`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/credits/purchase` | JWT | Mua gói credits |
| GET | `/api/credits/balance` | JWT | Số credits hiện tại |
| GET | `/api/credits/transactions` | JWT | Lịch sử giao dịch |
| GET | `/api/credits/features` | JWT | Features đã unlock |

### Protected Feature Endpoints (Demo)
| Method | Path | Required Feature | Description |
|--------|------|-----------------|-------------|
| POST | `/api/features/generate-image` | `image_generation` | Demo: tạo hình |
| POST | `/api/features/auto-post` | `auto_post` | Demo: auto post |
| GET | `/api/features/analytics` | `analytics` | Demo: analytics |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/docs` | Swagger UI (FastAPI auto-generated) |

---

## Frontend Pages & Routes

| Route | Component | Auth Required | Description |
|-------|-----------|--------------|-------------|
| `/` | `HomePage` | No | Landing / redirect to pricing |
| `/login` | `LoginPage` | No | Đăng nhập |
| `/register` | `RegisterPage` | No | Đăng ký |
| `/pricing` | `PricingPage` | No | Danh sách gói credits |
| `/dashboard` | `DashboardPage` | Yes | Tổng quan tài khoản + credits |
| `/transactions` | `TransactionsPage` | Yes | Lịch sử giao dịch |
| `/admin` | `AdminPage` | Admin | Quản lý packages |

---

## Key Dependencies

### Backend (Python)
| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn[standard]` | ASGI server |
| `sqlalchemy[asyncio]` | Async ORM |
| `asyncpg` | Async PostgreSQL driver |
| `alembic` | DB migrations |
| `pydantic[email]` | Data validation / schemas |
| `pydantic-settings` | Settings from .env |
| `python-jose[cryptography]` | JWT sign/verify |
| `passlib[bcrypt]` | Password hashing |
| `python-multipart` | Form data parsing |

### Frontend (Node.js)
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` v6 | Routing |
| `axios` | HTTP client |
| `zustand` | State management |
| `tailwindcss` | CSS utility framework |
| `@shadcn/ui` | UI component library |
| `react-hot-toast` | Toast notifications |
| `typescript` | Type safety |
| `vite` | Build tool |

---

## Features Implemented

> Cập nhật mỗi khi hoàn thành 1 feature lớn. Format: `- ✅ Feature name (Stage X)`

- ✅ PostgreSQL schema, Alembic initial migration và demo seed (Stage 1)
- ✅ FastAPI core, async database session, CORS và health check (Stage 2)
- ✅ JWT registration, login, current-user và admin authorization (Stage 3)
- ✅ Public package listing/detail và admin package management (Stage 4)
- ✅ Credit purchase, balance, transaction pagination và feature unlock (Stage 5)
- ✅ Feature permission dependency và protected demo endpoints (Stage 6)
- ✅ React/Vite/Tailwind foundation, routing, API client và Zustand stores (Stage 7)
- ✅ Login/register flows với persisted JWT và toast feedback (Stage 8)
- ✅ Responsive pricing cards, current-plan highlight và package API (Stage 9)
- ✅ Dashboard balance/stats/features và paginated transaction table (Stage 10)
- ✅ Purchase dialog, demo payment states và immediate credit refresh (Stage 11)
- ✅ Admin package CRUD, feature selection và aggregate stats (Stage 12)
- ✅ Dockerfiles, Nginx và Compose production/dev configuration (Stage 13)
- ✅ README, ESLint configuration và code polish (Stage 14)
- ✅ Backend/frontend/config verification và Docker production smoke test (Stage 15)

---

## Known Issues / TODOs

- Git repository đã được khởi tạo với remote `https://github.com/truongNgn/CredFlow.git`.
- Migration đã được compile/render offline; cần PostgreSQL đang chạy để kiểm tra `alembic upgrade head` online.
- Docker production stack đã được build và smoke-test thành công trên ports 3000/8000.
