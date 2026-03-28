# Furniture Store Backend

Backend for furniture store automation built on Go (`Fiber + GORM + PostgreSQL`).

## Implemented
- JWT-like signed token authentication (`/api/auth/login`)
- Role-based authorization (Administrator / Manager / Warehouse / Executive)
- Product CRUD with validation
- Orders with stock control and status transitions
- Customer/category/user reference APIs
- Audit log API
- AI demand forecasting (`/api/forecast`) with model training and persisted model file
- Swagger UI (`/swagger/index.html`)

## Layers
- MVC controllers: `internal/handlers`
- Service layer: `internal/services`
- Repository layer: `internal/repositories`

## Environment Variables
- `APP_HOST` (default `0.0.0.0`)
- `APP_PORT` (default `8080`)
- `APP_SECRET` (default `dev-secret-change-me`)
- `DB_HOST` (default `localhost`)
- `DB_PORT` (default `5432`)
- `DB_USER` (default `user`)
- `DB_PASSWORD` (default `root`)
- `DB_NAME` (default `furniture`)
- `DB_SSLMODE` (default `disable`)

## Demo Accounts
- `admin@maison.co / admin123`
- `manager@maison.co / manager123`
- `warehouse@maison.co / warehouse123`
- `executive@maison.co / executive123`

## Run
```bash
go run .
```

Or with Docker Compose from project root.
