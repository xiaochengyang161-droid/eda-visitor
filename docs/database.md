# Database

## D1 Database

**Database Name**: `eda-db`
**Binding**: `eda_db`

## Schema

See `backend/schema.sql` for the full database schema.

### Tables

#### devices

| Column  | Type    | Description        |
| ------- | ------- | ------------------ |
| id      | INTEGER | Primary key        |
| name    | TEXT    | Device name        |
| status  | TEXT    | Device status      |

## Local Development

Wrangler manages the local D1 instance automatically when running `npm run dev`.

```bash
cd backend
npm run dev
```
