# Administrator Guide

## Startup
- Use Docker Compose from project root.
- Ensure ports `3000`, `5432`, `8080` are available.

## Demo Accounts
- `admin@maison.co / admin123`
- `manager@maison.co / manager123`
- `warehouse@maison.co / warehouse123`
- `executive@maison.co / executive123`

## Security
- Passwords are stored hashed.
- API uses Bearer token authentication.
- Role checks are enforced on protected endpoints.

## Backup
- PostgreSQL data is stored in Docker volume `postgres`.
- Use standard `pg_dump` on `furniture_db` container.
