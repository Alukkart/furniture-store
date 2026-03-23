# Docker Run Instruction

From project root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- Swagger: `http://localhost:8080/swagger/index.html`
- PostgreSQL: `localhost:5432`

Optional environment variables:
- `APP_SECRET`
- `NEXT_PUBLIC_API_URL`
