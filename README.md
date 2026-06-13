# CredFlow

> A production-ready SaaS credit management platform — buy credit packages, unlock features, and track spend. Built as a full-stack reference implementation with FastAPI, React, and PostgreSQL.

---

## Features

| Area | What it does |
|---|---|
| **Auth** | JWT-based register / login with role separation (user / admin) |
| **Packages** | Public listing of credit tiers; admin CRUD with feature assignment |
| **Purchase flow** | Simulated payment → atomic credit top-up + feature unlock in one DB transaction |
| **Dashboard** | Live credit balance, unlocked features, spend summary |
| **Transactions** | Paginated history with status badges and filter |
| **Feature guard** | Middleware dependency that blocks endpoints unless the user has the required feature unlocked |
| **Admin panel** | Package management, stats (users, transactions, revenue) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser  (React 18 + TypeScript + Vite)            │
│  Zustand state · Axios JWT interceptor · shadcn/ui  │
└─────────────────────────┬───────────────────────────┘
                          │ HTTP / JSON
┌─────────────────────────▼───────────────────────────┐
│  FastAPI 0.111  (Python 3.11)                       │
│  Router → Service → SQLAlchemy 2.0 async ORM        │
│  Alembic migrations · python-jose JWT · bcrypt      │
└─────────────────────────┬───────────────────────────┘
                          │ asyncpg
┌─────────────────────────▼───────────────────────────┐
│  PostgreSQL 16                                       │
└─────────────────────────────────────────────────────┘
```

In production the frontend is served as a static build behind **Nginx**, which also reverse-proxies `/api` to the backend — so the browser talks to one origin only.

---

## Tech Stack

**Backend**

| Package | Role |
|---|---|
| FastAPI | Async web framework |
| SQLAlchemy 2.0 (asyncio) | ORM |
| asyncpg | PostgreSQL async driver |
| Alembic | Schema migrations |
| python-jose | JWT sign / verify |
| passlib (bcrypt) | Password hashing |
| pydantic-settings | Typed `.env` config |

**Frontend**

| Package | Role |
|---|---|
| React 18 + TypeScript | UI |
| Vite | Build tool + dev server |
| React Router v6 | Client-side routing |
| Zustand | Global state (auth, credits) |
| Axios | HTTP client with JWT interceptor |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible component primitives |
| react-hot-toast | Toast notifications |

**Infrastructure**

| Tool | Role |
|---|---|
| PostgreSQL 16 | Primary datastore |
| Docker Compose | Orchestration |
| Nginx (alpine) | Static file server + reverse proxy |

---

## Quick Start (Docker)

Requirements: Docker Desktop ≥ 24 with Compose v2.

```bash
# 1 — Copy env file and fill in secrets
cp .env.example .env

# 2 — Build and start all services (postgres + backend + frontend)
docker compose up --build

# 3 — Open Docker-served frontend in browser
open http://localhost:3000        # macOS / Linux
start http://localhost:3000       # Windows
```

The backend auto-runs `alembic upgrade head` and seeds demo data on first start.

When using Docker Compose, the frontend is published on `http://localhost:3000`.
The Vite dev-server URL `http://localhost:5173` is only used when running the
frontend locally with `npm run dev` outside Docker.

**Production-mode** (no volume mounts, no hot reload):

```bash
docker compose -f docker-compose.yml up --build
```

---

## Local Development

### Backend

```bash
cd backend

# Create and activate virtualenv
python -m venv .venv
source .venv/bin/activate          # Linux / macOS
.\.venv\Scripts\Activate.ps1       # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to a local PostgreSQL instance

# Run migrations + seed
alembic upgrade head

# Start dev server (hot reload)
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

npm ci
cp .env.example .env               # VITE_API_URL=http://localhost:8000/api
npm run dev
```

App available at `http://localhost:5173`

This URL is for local frontend development only. If the app is running through
Docker Compose, use `http://localhost:3000` instead.

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@credflow.dev` | `Admin@123` |
| User | `user@credflow.dev` | `User@123` |

---

## API Reference

Base URL: `http://localhost:8000`  
Interactive docs: `/docs` (Swagger UI), `/redoc`

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account, returns JWT |
| POST | `/api/auth/login` | Public | Authenticate, returns JWT |
| GET | `/api/auth/me` | Bearer | Current user profile |

### Packages — `/api/packages`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/packages` | Public | List active packages |
| GET | `/api/packages/{id}` | Public | Package detail |

### Credits — `/api/credits`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/credits/purchase` | Bearer | Buy a package (simulated payment) |
| GET | `/api/credits/balance` | Bearer | Current credit balance |
| GET | `/api/credits/transactions` | Bearer | Paginated transaction history |
| GET | `/api/credits/features` | Bearer | Unlocked features |

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/packages` | Admin | All packages (incl. inactive) |
| POST | `/api/admin/packages` | Admin | Create package |
| PUT | `/api/admin/packages/{id}` | Admin | Update package |
| DELETE | `/api/admin/packages/{id}` | Admin | Delete package |
| GET | `/api/admin/features` | Admin | Feature catalog |
| GET | `/api/admin/stats` | Admin | Users, transactions, revenue |

### Protected Feature Endpoints (demo)

| Method | Endpoint | Required Feature |
|---|---|---|
| POST | `/api/features/generate-image` | `image_generation` |
| POST | `/api/features/auto-post` | `auto_post` |
| GET | `/api/features/analytics` | `analytics` |

---

## Database Schema

```
users                      packages
├── id (PK, UUID)          ├── id (PK, UUID)
├── email (unique)         ├── name
├── password_hash          ├── description
├── role                   ├── price
├── created_at             ├── credit_amount
└── updated_at             ├── is_active
                           ├── created_at
                           └── updated_at

features                   package_features (pivot)
├── id (PK, UUID)          ├── package_id (FK)
├── name                   └── feature_id (FK)
├── slug (unique)
└── description            user_features (pivot)
                           ├── user_id (FK)
user_credits               ├── feature_id (FK)
├── id (PK, UUID)          └── unlocked_at
├── user_id (unique FK)
└── balance                transactions
                           ├── id (PK, UUID)
                           ├── user_id (FK)
                           ├── package_id (FK)
                           ├── amount
                           ├── credits_added
                           ├── status (pending|success|failed)
                           └── created_at
```

---

## Seed Data

### Packages

| Name | Price | Credits | Included Features |
|---|---|---|---|
| Basic | $9/mo | 100 | basic_api |
| Pro | $29/mo | 500 | basic_api, image_generation, analytics |
| Enterprise | $99/mo | 2,000 | basic_api, image_generation, analytics, auto_post, priority_support |

### Feature Slugs

`basic_api` · `image_generation` · `analytics` · `auto_post` · `priority_support`

---

## Running Tests

```bash
cd backend

# Requires a running PostgreSQL instance (or use docker compose for postgres only)
pytest -q

# Type-check + lint frontend
cd ../frontend
npm run build      # TypeScript compile
npm run lint       # ESLint
```

---

## Project Structure

```
credflow/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point, CORS, error handlers
│   │   ├── config.py          # Pydantic-settings env config
│   │   ├── database.py        # Async SQLAlchemy engine + session factory
│   │   ├── dependencies.py    # get_db, get_current_user, require_admin
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── routers/           # FastAPI routers (auth, packages, credits, features)
│   │   ├── services/          # Business logic layer
│   │   └── middleware/
│   │       └── feature_guard.py  # require_feature(slug) dependency
│   ├── alembic/               # Migrations + seed
│   ├── tests/                 # Async integration tests (pytest-asyncio)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios wrappers (authApi, packagesApi, creditsApi, adminApi)
│   │   ├── components/        # AppLayout, AuthShell, ProtectedRoute, shadcn/ui primitives
│   │   ├── pages/             # LoginPage, RegisterPage, PricingPage, DashboardPage,
│   │   │                      #   TransactionsPage, AdminPage, HomePage
│   │   ├── store/             # Zustand stores (authStore, creditsStore)
│   │   └── types/             # Shared TypeScript interfaces
│   ├── nginx.conf             # SPA routing + /api reverse proxy
│   └── Dockerfile
│
├── docker-compose.yml         # Production stack
├── docker-compose.override.yml # Dev overrides (hot reload volumes)
└── .env.example
```

---

## Environment Variables

```env
# Root .env (consumed by Docker Compose)
POSTGRES_USER=credflow
POSTGRES_PASSWORD=credflow_secret
POSTGRES_DB=credflow_db
JWT_SECRET=change-me-in-production

# backend/.env (local dev)
DATABASE_URL=postgresql+asyncpg://credflow:credflow_secret@localhost:5432/credflow_db
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
APP_ENV=development
CORS_ORIGINS=http://localhost:3000

# frontend/.env (local dev)
VITE_API_URL=http://localhost:8000/api
```

---

## License

MIT
