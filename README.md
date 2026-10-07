# 🍽️ RestaurantOS

**Full-stack restaurant management platform** — orders, kitchen, inventory, invoicing, and AI-powered analytics in a single monorepo.

---

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Express API    │────▶│  PostgreSQL  │
│  React/Vite  │     │  (Port 4000)    │     │  (Port 5432) │
│ (Port 5173)  │     │                 │────▶│              │
└─────────────┘     └────────┬────────┘     └──────────────┘
                             │
                    ┌────────▼────────┐     ┌──────────────┐
                    │  FastAPI AI Svc  │     │    Redis     │
                    │  (Port 8000)    │     │  (Port 6379) │
                    │  OCR / Analytics │     │  PubSub/WS   │
                    └─────────────────┘     └──────────────┘
```

## Tech Stack

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| Frontend     | React 18, Vite, Tailwind CSS, Lucide Icons  |
| Backend API  | Node.js 20, Express, Prisma ORM             |
| AI Service   | Python 3.11, FastAPI, Tesseract OCR          |
| Database     | PostgreSQL 16                               |
| Cache/PubSub | Redis 7                                     |
| Containers   | Docker Compose                              |

## Roles

| Role     | Permissions                                      |
| -------- | ------------------------------------------------ |
| Owner    | Full access — settings, reports, user management |
| Manager  | Staff scheduling, inventory, reports             |
| Chef     | Kitchen display, order status updates            |
| Waiter   | Table management, order placement                |
| Cashier  | Billing, payments, daily close                   |

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Node.js ≥ 20 (for local dev without Docker)
- Python ≥ 3.11 (for AI service local dev)

### 1. Clone & configure

```bash
git clone <repo-url> RestaurantOS && cd RestaurantOS
cp .env.example .env        # edit secrets as needed
```

### 2. Start with Docker (recommended)

```bash
npm run docker:up           # builds & starts all services
npm run db:migrate          # apply Prisma migrations
npm run db:seed             # seed demo data
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Local development (without Docker)

```bash
# Terminal 1 — start Postgres & Redis via Docker
docker compose up postgres redis -d

# Terminal 2 — backend
cd backend && npm install && npm run dev

# Terminal 3 — frontend
cd frontend && npm install && npm run dev

# Terminal 4 — AI service
cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload
```

## Project Structure

```
RestaurantOS/
├── frontend/              # React + Vite + Tailwind
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── contexts/      # React contexts (auth, theme)
│       └── pages/         # Route pages
├── backend/               # Express + Prisma
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── controllers/  # Request/response logic
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers
│   └── prisma/
│       └── schema.prisma  # Database schema & migrations
├── ai-service/            # FastAPI — OCR & analytics
│   └── app/
│       ├── routers/       # API endpoints
│       ├── services/      # AI/ML logic
│       └── models/        # Pydantic schemas
├── docker/                # Dockerfiles
├── docker-compose.yml
└── .env.example
```

## API Endpoints

| Method | Endpoint               | Description             |
| ------ | ---------------------- | ----------------------- |
| GET    | `/api/health`          | Backend health check    |
| POST   | `/api/auth/register`   | Register a new user     |
| POST   | `/api/auth/login`      | Login & receive JWT     |
| GET    | `/api/menu`            | List menu items         |
| GET    | `/api/orders`          | List orders             |
| GET    | `/api/tables`          | List tables             |
| GET    | `http://…:8000/health` | AI service health check |

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start backend + frontend locally   |
| `npm run docker:up` | Build & start all Docker services  |
| `npm run docker:down`| Stop all Docker services          |
| `npm run db:migrate`| Run Prisma migrations              |
| `npm run db:seed`   | Seed the database with demo data   |
| `npm run db:studio` | Open Prisma Studio GUI             |

## License

MIT
