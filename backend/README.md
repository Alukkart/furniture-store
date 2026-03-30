# Furniture Store Backend

Backend for the furniture store information system built on Go with `Fiber`, `GORM`, and `PostgreSQL`.

## Implemented Features

- bearer-token authentication via `/api/auth/login`
- swagger OAuth2 password-flow token endpoint via `/api/auth/token`
- role-based authorization for `Administrator`, `Manager`, `Warehouse`, `Executive`, and `Client`
- product CRUD with validation and audit logging
- order creation with stock checks and transactional status updates
- public client signup and personal order tracking API
- reference APIs for categories, customers, and users
- ML demand forecast with model training, metrics, saved artifact, and reusable inference
- Swagger API documentation at `/swagger/index.html`

## Architecture

- `internal/models` — domain models and ORM entities
- `internal/handlers` — controllers / HTTP layer
- `internal/services` — business logic layer
- `internal/repositories` — data access layer
- `internal/middleware` — authentication and authorization middleware
- `internal/database` — connection, migration, and seed logic

## ML Module

The AI module uses machine learning to predict category demand.

- training data is prepared synthetically from application categories and monthly history rows in `ml_datasets`
- the model is trained and evaluated with `MAE` and `RMSE`
- the trained artifact is persisted to `data/forecast_model.json`
- the API exposes:
  - `GET /api/forecast?months=3`
  - `POST /api/forecast/train`

## Environment Variables

- `APP_HOST` default `0.0.0.0`
- `APP_PORT` default `8080`
- `APP_SECRET` default `dev-secret-change-me`
- `DB_HOST` default `localhost`
- `DB_PORT` default `5432`
- `DB_USER` default `user`
- `DB_PASSWORD` default `root`
- `DB_NAME` default `furniture`
- `DB_SSLMODE` default `disable`

## Demo Accounts

- `admin@maison.co / admin123`
- `manager@maison.co / manager123`
- `warehouse@maison.co / warehouse123`
- `executive@maison.co / executive123`

Passwords are stored in the database only as hashes.

## Run Locally

```bash
go run .
```

## Run Tests

```bash
go test ./...
```

## Docker

Run the full system from the project root:

```bash
docker compose up --build
```

Persistent volumes:

- PostgreSQL data: `postgres`
- ML model artifact: `model_data`
