# Challenge

Full‑stack app to create purchase requests from pasted text or PDFs. The backend extracts structured data (including order lines, per-line discounts, and extra costs) using OpenAI, stores it in a database, and the frontend lets users review and submit.

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm 8+ (bundled with Node)
- Docker Desktop (to run the database)
- An OpenAI API key

## Project Structure

- `backend/` — Node/TypeScript, Express, Prisma, OpenAI SDK, Docker Compose for DB
- `frontend/` — Vue 3 + Vite + PrimeVue

## Quick Start

Open two terminals (one for backend, one for frontend).

### 1) Start the Database (Docker)

```powershell
cd .\backend
docker compose up -d db
```

### 2) Backend Setup

```powershell
cd .\backend
copy .env.example .env          # Windows PowerShell – edit .env afterwards
# In .env, set:
#   OPENAI_API_KEY=sk-...
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/?schema=public

npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The backend will start (check the console for the port, commonly http://localhost:3000).

Useful DB maintenance commands:

```powershell
# Reset DB (DANGEROUS: drops data)
npx prisma migrate reset --force

# If Prisma Client seems out of date
npx prisma generate
```

### 3) Frontend Setup

```powershell
cd .\frontend
npm install
npm run dev
```

Open the URL Vite prints (default: http://localhost:5173). The frontend is configured to talk to the backend running locally.

## Environment Variables

Backend (`backend/.env`)

- OPENAI_API_KEY: your OpenAI key (required for text/PDF extraction).
- OPENAI_MODEL: optional model override (default: gpt-4o-mini).
- DATABASE_URL: Postgres connection string. Example:
  `postgresql://postgres:postgres@localhost:5432?schema=public`
- PORT: optional backend port.

Frontend

- Typically no .env required for local dev. If you need to point to a non-default backend URL, add a Vite env and use it in `frontend/src/api.ts`.

## Features

- Paste text or upload a PDF and extract fields via OpenAI.
- Order lines with:
  - Unit price, amount, unit
  - Optional per-line discount (entered as an absolute number like `5` or percentage like `10%`).
  - Discounts are always treated as reductions (e.g., "-20%" becomes "20%").
- Extras (other costs like VAT, shipping, fees) editable and included in total.
  - Multiple extra-cost lines in a document are summed into a single `extras` value.
- Total cost = sum(order lines after discount) + extras.
- Commodity group selection mapped to predefined IDs.

## Troubleshooting

- Docker not running: ensure Docker Desktop is started before `docker compose up -d db`.
- Prisma client errors:
  - Run `npx prisma generate`.
  - Run `npx prisma migrate dev`.
  - As last resort: `npx prisma migrate reset --force` (drops data).
- Port conflicts:
  - Change backend `PORT` in `backend/.env`.
  - Vite dev server port can be changed with `--port` flag: `npm run dev -- --port 5174`.

## Scripts (common)

Backend

- `npm run dev` — start backend in watch mode
- `npx prisma migrate dev` — apply migrations
- `npx prisma generate` — regenerate Prisma client

Frontend

- `npm run dev` — start Vite dev server
- `npm run build` — build production bundle
- `npm run preview` — preview production build
