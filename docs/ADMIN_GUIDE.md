# Administrator Guide

## Startup
- Use Docker Compose from project root.
- Ensure ports `3000`, `5432`, `8080` are available.

## Demo Accounts
- `admin@maison.co / admin123`
- `manager@maison.co / manager123`
- `warehouse@maison.co / warehouse123`
- `executive@maison.co / executive123`
- client accounts are created through `POST /api/auth/signup` or `/register`

## Security
- Passwords are stored hashed.
- API uses Bearer token authentication.
- Role checks are enforced on protected endpoints.

## Backup
- PostgreSQL data is stored in Docker volume `postgres`.
- Use standard `pg_dump` on `furniture_db` container.
- Helper scripts: `scripts/backup-db.sh` and `scripts/restore-db.sh`.
- Recommended schedule: daily backup by `cron` or Task Scheduler.

## Recovery Procedure
1. Stop application containers.
2. Check `furniture_db` health and persistent volume availability.
3. Restore the latest SQL dump using `scripts/restore-db.sh`.
4. Start the stack with `docker compose up -d`.
5. Validate login, product listing, order list, client order tracking, and forecast page.
