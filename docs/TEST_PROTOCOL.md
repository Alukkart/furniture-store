# Test Protocol

## Backend (10 checks)
| # | Check | Expected | Actual |
|---|---|---|---|
| 1 | Login valid credentials | 200 + token | Pending verification |
| 2 | Login invalid credentials | 401 | Pending verification |
| 3 | Product create without token | 401 | Pending verification |
| 4 | Product create by manager | 201 | Pending verification |
| 5 | Product delete by manager | 403 | Pending verification |
| 6 | Order create with stock > 0 | 201 | Pending verification |
| 7 | Order create with insufficient stock | 400 | Pending verification |
| 8 | Order status update by warehouse | 200 | Pending verification |
| 9 | Forecast endpoint by executive | 200 + rows | Pending verification |
| 10 | User block endpoint by non-admin | 403 | Pending verification |

## UI (10 checks)
| # | Check | Expected | Actual |
|---|---|---|---|
| 1 | Login page validation | Inline errors | Pending verification |
| 2 | Admin login redirect | Open `/admin` | Pending verification |
| 3 | Role-based menu | Only allowed sections | Pending verification |
| 4 | Inventory search | Filtered list | Pending verification |
| 5 | Inventory update | Updated product row | Pending verification |
| 6 | Order status change | Updated badge/status | Pending verification |
| 7 | Audit page filters | Filtered rows | Pending verification |
| 8 | Forecast page load | MAE/RMSE + table | Pending verification |
| 9 | Forecast retrain button | Model retrained | Pending verification |
| 10 | Logout | Redirect to login | Pending verification |

## End-to-End Processes (5 checks)
| # | Process | Expected | Actual |
|---|---|---|---|
| 1 | Order placement | Order + items + stock update | Pending verification |
| 2 | Order processing/shipment | Status transitions + audit log | Pending verification |
| 3 | Demand forecast | Forecast table + recommendations | Pending verification |
| 4 | User administration | Create/block user with RBAC | Pending verification |
| 5 | Audit investigation | View action timeline | Pending verification |

## Defects and Fixes
- Unauthorized access on protected endpoints before token setup -> fixed by `Authorization: Bearer <token>` interceptor.
- Missing role constraints on UI navigation -> fixed with role-aware `AdminLayout` menu filtering.
