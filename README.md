# EDA Cloud

EDA (Electronic Design Automation) Cloud — a full-stack application with:

- **Backend**: Cloudflare Worker + D1 (REST API)
- **Frontend**: Vue 3 + TypeScript + Vite + Element Plus

## Project Structure

```
eda-cloud/
├── backend/          # Cloudflare Worker + D1 backend
│   ├── src/          # Worker source code
│   ├── schema.sql   # D1 database schema
│   └── wrangler.jsonc
├── frontend/        # Vue 3 + Vite frontend
│   ├── src/         # Vue components & API layer
│   └── vite.config.ts
└── docs/            # Project documentation
```

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev      # Start wrangler dev server (http://127.0.0.1:8787)
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev         # Start Vite dev server (http://localhost:5173)
```

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Backend  | Cloudflare Workers, D1, Hono        |
| Frontend | Vue 3, TypeScript, Vite, Element Plus, Pinia |
