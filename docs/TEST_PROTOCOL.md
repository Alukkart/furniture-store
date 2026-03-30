# Test Protocol

## Backend (10 checks)
| # | Check | Expected | Actual |
|---|---|---|---|
| 1 | Login valid credentials | 200 + token | Pass (`go test`, route integration) |
| 2 | Login invalid credentials | 401 | Pass (`go test`, route integration) |
| 3 | Product create without token | 401 | Pass (`go test`, route integration) |
| 4 | Product create by manager | 201 | Pass (`go test`, route integration) |
| 5 | Product delete by manager | 403 | Pass (`go test`, route integration) |
| 6 | Order create with stock > 0 | 201 | Pass (`go test`, route integration) |
| 7 | Order create with insufficient stock | 400 | Pass (`go test`, route integration) |
| 8 | Order status update by warehouse/manager | 200 | Pass (`go test`, route integration) |
| 9 | Forecast endpoint by executive | 200 + rows | Pass (`go test`, route integration) |
| 10 | User block endpoint by non-admin | 403 | Pass (`go test`, route integration) |

## UI (10 checks)
| # | Check | Expected | Actual |
|---|---|---|---|
| 1 | Login page validation | Inline errors | Implemented; page compiles in production build |
| 2 | Admin login redirect | Open `/admin` | Implemented in route guard and redirect logic |
| 3 | Role-based menu | Only allowed sections | Implemented in `AdminLayout` role filter |
| 4 | Inventory search | Filtered list | Implemented in inventory page state filter |
| 5 | Inventory update | Updated product row | Implemented through inline edit and product form |
| 6 | Order status change | Updated badge/status | Implemented in admin orders UI |
| 7 | Audit page filters | Filtered rows | Implemented in audit log page |
| 8 | Forecast page load | MAE/RMSE + table | Pass (`npm run build`, route generated) |
| 9 | Forecast retrain button | Model retrained | Implemented in forecast page |
| 10 | Logout | Redirect to login | Implemented in navbar/admin layout |

## End-to-End Processes (5 checks)
| # | Process | Expected | Actual |
|---|---|---|---|
| 1 | Order placement | Order + items + stock update | Pass on API integration tests |
| 2 | Order processing/shipment | Status transitions + audit log | Pass on API integration tests + UI implementation |
| 3 | Demand forecast | Forecast table + recommendations | Pass on API integration tests + frontend build |
| 4 | User administration | Create/block user with RBAC | Pass on API integration tests |
| 5 | Audit investigation | View action timeline | Implemented in audit page with search and filters |

## Defects and Fixes
- Unauthorized access on protected endpoints before token setup -> fixed by `Authorization: Bearer <token>` interceptor.
- Missing role constraints on UI navigation -> fixed with role-aware `AdminLayout` menu filtering.
- Missing external client role and self-service account flow -> fixed by public signup and `/account/orders`.
- Missing forecast retraining control in UI -> fixed by adding retrain button for Administrator and Executive.
