# API Description

Base URL: `/api`

## Auth
- `POST /auth/login` -> `{ user, token }`
- `POST /auth/token` (Swagger OAuth2 password flow; put email into `username`)
- `POST /auth/signup` (public client registration)
- `GET /auth/me` (Bearer)
- `POST /auth/logout` (Bearer; writes server-side audit entry)
- `POST /auth/register` (Admin only)

Blocked accounts are rejected on every authenticated request with `403`, even if the token is still valid.

## Products
- `GET /products` — optional query params: `category`, `minPrice`, `maxPrice`, `q` (name/SKU search), `limit`, `offset`
- `GET /products/:id`
- `POST /products` (Admin, Manager)
- `PUT /products/:id` (Admin, Manager)
- `DELETE /products/:id` (Admin)

## Orders
- `POST /orders` (public checkout)
- `GET /orders` (Admin, Manager, Warehouse, Executive)
- `GET /orders/my` (Client)
- `GET /orders/:id` (staff roles see any order; Client only own, otherwise `403`)
- `PUT /orders/:id` (Admin, Manager, Warehouse)
- `PATCH /orders/:id/status` (Admin, Manager, Warehouse)

Status transitions follow the order lifecycle: `pending → processing → shipped → delivered`; `cancelled` is allowed from any non-terminal state. Invalid transitions are rejected with `400`. Cancelling an order returns reserved stock to the warehouse.

## References
- `GET /categories`
- `POST /categories` (Admin, Manager)
- `GET /customers` (Admin, Manager)
- `POST /customers` (Admin, Manager)

## Users
- `GET /users` (Admin)
- `POST /users` (Admin)
- `PATCH /users/:id/block` (Admin)

## Audit
- `GET /audit-logs` (Admin, Manager, Warehouse, Executive) — optional query params: `category`, `severity`, `q`, `limit`, `offset`

Audit entries are created exclusively by the server when significant operations succeed; clients cannot insert audit records directly.

## AI Forecast
- `POST /forecast/train` (Admin, Executive)
- `GET /forecast?months=3` (Admin, Manager, Executive)

## Example Client Signup Request
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "client123"
}
```

## Example Login Request
```json
{
  "email": "admin@maison.co",
  "password": "admin123"
}
```

## Example Login Response
```json
{
  "user": {
    "id": "u-admin",
    "email": "admin@maison.co",
    "name": "Admin",
    "role": "Administrator"
  },
  "token": "<signed-token>"
}
```
