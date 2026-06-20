# Deployment Guide

## Prerequisites

- Node.js 18+
- Cloudflare account with Workers Paid plan (for D1)
- Wrangler CLI authenticated

## Backend Deployment

```bash
cd backend
npm install
npx wrangler deploy
```

Before first deploy, create the D1 database:

```bash
npx wrangler d1 create eda-db
npx wrangler d1 execute eda-db --file=schema.sql
```

## Frontend Deployment

```bash
cd frontend
pnpm install
pnpm build
# Deploy dist/ to Cloudflare Pages or any static hosting
```

## Environment Variables

| Variable    | Description              |
| ----------- | ------------------------ |
| (none yet)  | Add vars to wrangler.jsonc |
