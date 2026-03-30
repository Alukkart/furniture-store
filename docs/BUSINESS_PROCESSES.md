# Business Processes

## 1. Catalog Management

Input:
- Administrator or Manager opens `/admin/inventory`
- enters product data: SKU, category, name, price, description, stock, media

Processing:
- form validation checks required fields and number ranges
- backend verifies role permissions
- server writes or updates product row and creates an audit record
- users can search and filter products by name, category, or SKU

Result:
- product card and detail page are updated
- stock and pricing become available in storefront and admin tables
- audit log contains create/update/delete event

UI flow:
- `/admin/inventory`
- `/admin/inventory/new`
- `/admin/inventory/[id]`

API flow:
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

## 2. Client Order Placement And Tracking

Input:
- Client registers at `/register` or checks out as a guest
- selects products, quantities, customer email, and delivery address

Processing:
- checkout validates customer and cart data
- backend checks stock for every position
- system creates or updates customer record
- order and order items are written transactionally
- stock is reduced and an audit event is stored
- authenticated client opens `/account/orders` to read only personal orders

Result:
- new order appears with status `pending`
- client can track status progression in personal account
- managers and warehouse staff can continue processing in admin area

UI flow:
- `/shop`
- `/checkout`
- `/account/orders`
- `/admin/orders`
- `/admin/orders/[id]`

API flow:
- `POST /api/auth/signup`
- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/orders`
- `PUT /api/orders/:id`
- `PATCH /api/orders/:id/status`

## 3. Access Control And Audit

Input:
- Administrator creates internal users, assigns role, or blocks access
- users sign in with login and password

Processing:
- password hash is verified on login
- bearer token is issued for authenticated sessions
- role-based middleware authorizes protected routes
- every critical action creates an audit log entry

Result:
- only permitted sections are visible and accessible
- blocked users cannot continue work
- administrator and analysts can inspect action history

UI flow:
- `/login`
- `/admin/users`
- `/admin/audit-log`

API flow:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id/block`
- `GET /api/audit-logs`
- `POST /api/audit-logs`

## 4. Demand Forecasting

Input:
- Administrator, Manager, or Executive opens forecast page
- Administrator or Executive may trigger model retraining

Processing:
- training dataset is prepared from monthly category sales rows
- ML model is trained and evaluated with `MAE` and `RMSE`
- trained artifact is stored on disk for reuse
- forecast endpoint generates category demand, recommended buy amount, and confidence

Result:
- dashboard shows planning horizon, metrics, explanation factors, and category recommendations
- management gets a direct decision-support artifact for replenishment

UI flow:
- `/admin/forecast`

API flow:
- `POST /api/forecast/train`
- `GET /api/forecast`
