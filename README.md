# CredFlow

CredFlow is a full-stack SaaS credit management demo. Users can register, purchase credit packages, unlock product features, inspect transaction history, and manage packages through an admin panel.

## Stack

- FastAPI, SQLAlchemy async, Alembic, PostgreSQL 16
- React 18, TypeScript, Vite, Zustand, Tailwind CSS
- Docker Compose, Nginx

## Run with Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
Start-Process http://localhost:3000
```

The default `docker-compose.override.yml` enables backend and frontend hot reload. For production-style containers:

```powershell
docker compose -f docker-compose.yml up --build
```

## Local development

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. Swagger is available at `http://localhost:8000/docs`.

## Main API

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Packages | `GET /api/packages`, `GET /api/packages/{id}` |
| Credits | `POST /api/credits/purchase`, balance, transactions, unlocked features |
| Admin | package CRUD, feature catalog and aggregate stats under `/api/admin/*` |

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@credflow.dev` | `Admin@123` |
| User | `user@credflow.dev` | `User@123` |

## Verification

```powershell
cd backend
pytest -q -p no:cacheprovider

cd ..\frontend
npm run build
npm run lint
```
