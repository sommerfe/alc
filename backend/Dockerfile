# syntax=docker/dockerfile:1.7

FROM node:20-bookworm AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM deps AS build
COPY tsconfig.json .
COPY prisma ./prisma
COPY src ./src
RUN npm run build && npx prisma generate

FROM node:20-bookworm
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y poppler-utils tesseract-ocr && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/index.js"]
