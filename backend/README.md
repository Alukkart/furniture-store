# Furniture Store Backend

Каркас бекенда для магазина мебели на Go (Fiber + GORM + PostgreSQL) со Swagger UI.

## Возможности
- Fiber HTTP сервер
- GORM для работы с PostgreSQL
- Swagger UI (`/swagger/index.html`)
- Dockerfile и docker-compose

## Структура
- `main.go` - точка входа
- `internal/config` - конфигурация из переменных окружения
- `internal/database` - подключение к БД и миграции
- `internal/models` - модели
- `internal/handlers` - обработчики HTTP
- `internal/routes` - маршруты
- `docs` - Swagger описание

## Переменные окружения
- `APP_HOST` (по умолчанию `0.0.0.0`)
- `APP_PORT` (по умолчанию `8080`)
- `DB_HOST` (по умолчанию `localhost`)
- `DB_PORT` (по умолчанию `5432`)
- `DB_USER` (по умолчанию `postgres`)
- `DB_PASSWORD` (по умолчанию `postgres`)
- `DB_NAME` (по умолчанию `furniture`)
- `DB_SSLMODE` (по умолчанию `disable`)

## Запуск локально
```bash
go mod tidy
go run .
```

## Запуск в Docker
```bash
docker compose up --build
```

## Swagger
UI доступен по адресу:
```
http://localhost:8080/swagger/index.html
```

Для автогенерации описания можно использовать `swag init` (требует установки `swag`).
