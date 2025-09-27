# Frontend (Vue 3 + TypeScript + Vite + Tailwind + PrimeVue)

## Prerequisites

- Node.js 18+ (20 LTS recommended)
- npm (or pnpm/yarn)
- Docker (optional) and Docker Compose

## Local Development

Install dependencies and start the dev server:

```powershell
npm install
npm run dev
```

Then open http://localhost:5173.

## Build

```powershell
npm run build
npm run preview
```

## Docker - Development (hot reload)

```powershell
docker compose -f docker-compose.yml up --build frontend-dev
```

Dev server runs on http://localhost:5173.

## Docker - Production image

```powershell
docker compose -f docker-compose.yml up --build frontend
```

Nginx serves the built app on http://localhost:8080.
