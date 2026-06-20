# API Documentation

## Base URL

```
http://127.0.0.1:8787
```

## Endpoints

### GET /devices

Returns all devices from the D1 database.

**Response**

```json
[
  {
    "id": 1,
    "name": "Device A",
    "status": "active"
  }
]
```

### GET /

Health check — returns "EDA API Running".

## CORS

All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
