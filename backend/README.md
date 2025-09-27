# Backend (Node.js + TypeScript)

Features
- OCR: pdf2image + tesseract.js
- OpenAI mapping to structured JSON
- PostgreSQL via Prisma
- REST endpoints for extraction and requests CRUD

## Prerequisites
- Node.js 18+
- Docker (optional, recommended for Postgres + OCR tools)

## Setup
```
cp .env.example .env
npm install
npx prisma generate
```

### Dev
```
npm run dev
```

### Build & Run
```
npm run build
npm start
```

### Docker Compose (DB + Backend)
```
docker compose up --build
```
Backend on http://localhost:3000

## Endpoints
- POST /api/requests/extract (multipart: file)
- POST /api/requests/extract-text { text }
- POST /api/requests (Request body; status forced to open)
- GET /api/requests
- GET /api/requests/:id
- PATCH /api/requests/:id

## Windows Notes
- pdf2image requires poppler; Docker image installs `poppler-utils` and `tesseract-ocr`.
- For local OCR without Docker, install poppler and tesseract on your system or use WSL.