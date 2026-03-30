# API Description

Base URL: `/api`

## Auth
- `POST /auth/login` -> `{ user, token }`
- `POST /auth/token` (Swagger OAuth2 password flow; put email into `username`)
- `POST /auth/signup` (public client registration)
- `GET /auth/me` (Bearer)
- `POST /auth/register` (Admin only)

## Products
- `GET /products`
- `GET /products/:id`
- `POST /products` (Admin, Manager)
- `PUT /products/:id` (Admin, Manager)
- `DELETE /products/:id` (Admin)

## Orders
- `POST /orders` (public checkout)
- `GET /orders` (Admin, Manager, Warehouse, Executive)
- `GET /orders/my` (Client)
- `PATCH /orders/:id/status` (Admin, Manager, Warehouse)

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
- `GET /audit-logs` (Admin, Manager, Warehouse, Executive)
- `POST /audit-logs` (Admin, Manager)

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
