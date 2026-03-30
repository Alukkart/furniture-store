# Furniture Store

Furniture Store is a split client-server web system with:

- `frontend/` — Next.js browser client
- `backend/` — Go/Fiber API with repository and service layers
- `furniture_db` — PostgreSQL database in a separate container

## Architecture

The project follows the required separated architecture:

- client application: browser UI on Next.js/React
- server application: Go API exposing JSON over HTTP
- database component: PostgreSQL with GORM ORM

Applied backend patterns:

- MVC: `internal/models`, `internal/handlers`, frontend/admin views
- Repository: `backend/internal/repositories`
- Service layer: `backend/internal/services`

## Security

- Authentication uses signed bearer tokens returned by `/api/auth/login`
- Authorization is role-based: `Administrator`, `Manager`, `Warehouse`, `Executive`, `Client`
- Passwords are stored only as hashes in the `users` table
- Database access is performed through GORM with parameterized queries

## Run With Docker

```bash
docker compose up --build
```

Services:

- frontend: [http://localhost:3000](http://localhost:3000)
- backend API: [http://localhost:8080](http://localhost:8080)
- Swagger: [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)

## Environment Variables

Backend:

- `APP_HOST`
- `APP_PORT`
- `APP_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSLMODE`

Frontend:

- `NEXT_PUBLIC_API_URL`

## Key User Flows

- internal administration through `/admin`
- public client signup through `/register`
- client order tracking through `/account/orders`
- interface preferences through `/settings`

## Network And Storage

- Containers communicate over the default Docker Compose network created for the project
- `postgres` volume stores PostgreSQL data persistently
- `model_data` volume stores the trained ML model artifact at `/app/data`

## Database Migrations

- Schema changes are applied automatically on startup through GORM `AutoMigrate`
- Seed data is inserted only when the corresponding tables are empty
- RBAC reference data includes roles, permissions, and role-permission mappings

## Backup

Example PostgreSQL backup command:

```bash
docker compose exec furniture_db pg_dump -U user -d furniture > furniture_backup.sql
```

Example restore command:

```bash
cat furniture_backup.sql | docker compose exec -T furniture_db psql -U user -d furniture
```

Automation-friendly scripts:

- `scripts/backup-db.sh`
- `scripts/restore-db.sh`

Regular backup can be scheduled by the administrator using `cron`, Task Scheduler, or CI runner execution of `scripts/backup-db.sh`.

## аварийное восстановление

Administrator actions in case of failure:

1. Stop the application containers.
2. Verify PostgreSQL container health and persistent volume availability.
3. Restore the latest SQL dump with `scripts/restore-db.sh`.
4. Start containers again with `docker compose up -d`.
5. Validate login, product list, order list, and forecast endpoint.

## HTTPS Publication

- local development runs over HTTP inside Docker Compose
- for public deployment, place `frontend` and `api` behind an HTTPS reverse proxy such as Caddy or Nginx with TLS termination

## Testing

Backend tests:

```bash
cd backend
go test ./...
```
