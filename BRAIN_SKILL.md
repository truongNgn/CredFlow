# BRAIN_SKILL.md — CredFlow Agent Skills

> File chứa các kỹ năng đặc biệt mà Agent sử dụng trong project này.  
> Bao gồm: MCP tools, markdown techniques, Python/Node commands, debugging tips.

**Navigation:**
- [AGENT.md](./AGENT.md) — Guidelines & conventions
- [BRAIN.md](./BRAIN.md) — Project structure & knowledge
- [implement_plan.md](./implement_plan.md) — Implementation plan
- [developer_log.md](./developer_log.md) — Activity log

---

## 1. MCP Tools Available

### File System Tools
```
Read(file_path)           — Đọc file theo đường dẫn tuyệt đối
Write(file_path, content) — Ghi/tạo file mới (overwrite)
Edit(file_path, old, new) — Sửa nội dung file (exact string match)
Glob(pattern)             — Tìm file theo glob pattern
Grep(pattern, path, type) — Tìm nội dung trong file (regex)
```

**Rules:**
- Luôn `Read` trước `Edit` — tool sẽ báo lỗi nếu không đọc trước
- Dùng `Glob("**/*.py")` để tìm tất cả Python files
- Dùng `Grep("def .*route", type="py")` để tìm route functions

### Shell Tool (Windows — PowerShell)
```
PowerShell(command) — Chạy lệnh trên Windows PowerShell
Bash(command)       — Chạy bash (khả dụng qua Git Bash)
```

**Môi trường:** win32, PowerShell là mặc định.

---

## 2. Python FastAPI Commands

### Setup môi trường
```powershell
cd backend

# Tạo virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Cài dependencies
pip install -r requirements.txt

# Tạo requirements.txt
pip freeze > requirements.txt
```

### Chạy server dev
```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Alembic (migrations)
```powershell
cd backend

# Init alembic (lần đầu)
alembic init alembic

# Tạo migration từ models
alembic revision --autogenerate -m "initial schema"

# Chạy migration
alembic upgrade head

# Rollback 1 bước
alembic downgrade -1

# Xem lịch sử
alembic history
```

### Test với pytest
```powershell
cd backend
pytest tests/ -v
pytest tests/test_auth.py -v
```

---

## 3. FastAPI Code Patterns

### Main app setup (`app/main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, packages, credits, features

app = FastAPI(title="CredFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(packages.router, prefix="/api", tags=["packages"])
app.include_router(credits.router, prefix="/api/credits", tags=["credits"])
app.include_router(features.router, prefix="/api/features", tags=["features"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

### Settings (`app/config.py`)
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
```

### Async DB session (`app/database.py`)
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

### SQLAlchemy Model Pattern
```python
# app/models/package.py
import uuid
from datetime import datetime
from sqlalchemy import String, Text, Numeric, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Package(Base):
    __tablename__ = "packages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    credit_amount: Mapped[int] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

### JWT Auth Dependency
```python
# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

### Feature Guard Dependency Factory
```python
# app/middleware/feature_guard.py
from fastapi import Depends, HTTPException
from sqlalchemy import select
from app.models import UserFeature, Feature

def require_feature(feature_slug: str):
    async def dependency(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        feature = await db.scalar(select(Feature).where(Feature.slug == feature_slug))
        if not feature:
            raise HTTPException(status_code=404, detail="Feature not found")
        user_feature = await db.scalar(
            select(UserFeature).where(
                UserFeature.user_id == current_user.id,
                UserFeature.feature_id == feature.id
            )
        )
        if not user_feature:
            raise HTTPException(status_code=403, detail=f"Feature '{feature_slug}' not unlocked")
        return current_user
    return dependency
```

### Router Pattern với Dependency Injection
```python
# app/routers/features.py
from fastapi import APIRouter, Depends
from app.middleware.feature_guard import require_feature

router = APIRouter()

@router.post("/generate-image")
async def generate_image(
    current_user = Depends(require_feature("image_generation"))
):
    return {"success": True, "data": {"message": "Image generation simulated", "url": "https://placeholder.com/img"}}
```

---

## 4. Node.js / React Commands

### Setup Frontend
```powershell
# Tạo project
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Cài dependencies
npm install react-router-dom axios zustand react-hot-toast
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Cài shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input table dialog badge
```

### Chạy Dev Server
```powershell
cd frontend
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build
```

### Zustand Store Pattern
```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { id: string; email: string; role: string }

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'credflow-auth' }
  )
)
```

### Axios Instance với JWT
```typescript
// src/api/client.ts
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)

export default api
```

### Protected Route
```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function ProtectedRoute({ children, adminOnly = false }: {
  children: React.ReactNode
  adminOnly?: boolean
}) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
```

---

## 5. Docker Skills

### backend/Dockerfile (Python multi-stage)
```dockerfile
FROM python:3.11-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

### frontend/Dockerfile (React + Nginx)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### frontend/nginx.conf (SPA routing)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://backend:8000;
    }
}
```

### docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: credflow
      POSTGRES_PASSWORD: credflow_secret
      POSTGRES_DB: credflow_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U credflow"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    depends_on:
      postgres:
        condition: service_healthy
    env_file: ./backend/.env
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Docker commands thường dùng
```powershell
# Build và chạy toàn bộ stack
docker compose up --build -d

# Xem logs
docker compose logs -f backend
docker compose logs -f frontend

# Vào container
docker exec -it credflow-backend-1 bash
docker exec -it credflow-postgres-1 psql -U credflow -d credflow_db

# Dừng
docker compose down
docker compose down -v  # Xóa cả volumes (reset DB)
```

---

## 6. Markdown Skills

### Tick checkbox trong implement_plan.md
Dùng `Edit` tool:
```
old_string: "- [ ] Tên task cụ thể"
new_string: "- [x] Tên task cụ thể"
```

### Update bảng status
```
old_string: "| 2 | Backend Core Setup | ⬜ |"
new_string: "| 2 | Backend Core Setup | ✅ |"
```

### Status symbols
| Symbol | Nghĩa |
|--------|-------|
| ⬜ | Chưa làm |
| 🔄 | Đang làm |
| ✅ | Hoàn thành |
| 🚫 | Bị block |

---

## 7. Debugging Tips

### FastAPI không kết nối được DB
```powershell
# Kiểm tra postgres container
docker compose ps
docker compose logs postgres

# Test kết nối thủ công
docker exec -it credflow-postgres-1 psql -U credflow -d credflow_db -c "\dt"
```

### CORS error ở frontend
1. Kiểm tra `CORS_ORIGINS` trong backend `.env` có chứa frontend URL
2. Kiểm tra `allow_credentials=True` trong CORS middleware
3. `VITE_API_URL` không có trailing slash

### Alembic migration lỗi
```powershell
# Xem trạng thái hiện tại
alembic current

# Reset (dev only — xóa hết data)
docker compose down -v
docker compose up postgres -d
alembic upgrade head
```

### JWT 401 error
1. Header phải là `Authorization: Bearer <token>` (có space)
2. Check token chưa hết hạn (24h)
3. `JWT_SECRET` phải khớp giữa generate và verify
4. Swagger UI: click "Authorize" button, nhập `Bearer <token>`
