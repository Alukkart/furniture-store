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
| 11 | Invalid order status transition (pending → delivered) | 400 | Pass (`go test`, route integration) |
| 12 | Order cancellation restores reserved stock | Stock returns to initial value | Pass (`go test`, route integration) |
| 13 | Client requests a foreign order by ID | 403 | Pass (`go test`, route integration) |
| 14 | Blocked user acts with a still-valid token | 403 | Pass (`go test`, route integration) |
| 15 | Products filtered by category and minPrice on the server | 200 + filtered list | Pass (`go test`, route integration) |

## Frontend automated (13 Vitest checks)
| # | Check | Expected | Actual |
|---|---|---|---|
| 1 | Email normalization | Trim + lowercase | Pass (`npm test`, Vitest) |
| 2 | Invalid email rejection | Invalid formats return false | Pass (`npm test`, Vitest) |
| 3 | Russian name sanitizing | Digits/symbols removed, hyphen preserved | Pass (`npm test`, Vitest) |
| 4 | Personal name validation | Capitalized Russian name accepted | Pass (`npm test`, Vitest) |
| 5 | Full name validation | Two or three name parts accepted | Pass (`npm test`, Vitest) |
| 6 | City/location validation | Russian city accepted, Latin value rejected | Pass (`npm test`, Vitest) |
| 7 | Address validation | Address must include letters and digits | Pass (`npm test`, Vitest) |
| 8 | Russian phone normalization | `8...` and 10-digit forms normalize to `7...` | Pass (`npm test`, Vitest) |
| 9 | Phone and postal code validation | Correct lengths accepted, short values rejected | Pass (`npm test`, Vitest) |
| 10 | Cardholder validation | Two-part name accepted, one-part name rejected | Pass (`npm test`, Vitest) |
| 11 | Card number validation | Formatting + Luhn check | Pass (`npm test`, Vitest) |
| 12 | Card expiry validation | Current/future month accepted, expired/invalid month rejected | Pass (`npm test`, Vitest) |
| 13 | CVV validation | Three or four digits accepted | Pass (`npm test`, Vitest) |

## Frontend components (13 Vitest checks)
| # | Check | Expected | Actual |
|---|---|---|---|
| 1 | Product card content | Title, sale badge, prices, and low-stock message are rendered | Pass (`npm test`, Vitest + jsdom) |
| 2 | Product card add to cart | Add button writes product to cart store | Pass (`npm test`, Vitest + jsdom) |
| 3 | Product card quantity controls | Increase and decrease update cart quantity | Pass (`npm test`, Vitest + jsdom) |
| 4 | Product card out-of-stock state | Add button is disabled and stock message is shown | Pass (`npm test`, Vitest + jsdom) |
| 5 | Product form empty draft | New product defaults are initialized | Pass (`npm test`, Vitest + jsdom) |
| 6 | Product form initial render | Existing product fields and preview are shown | Pass (`npm test`, Vitest + jsdom) |
| 7 | Product form required validation | Empty required fields block submit | Pass (`npm test`, Vitest + jsdom) |
| 8 | Product form submit payload | Text is trimmed, numbers converted, featured flag submitted | Pass (`npm test`, Vitest + jsdom) |
| 9 | Order form initial render | Order fields, line total, and total are shown | Pass (`npm test`, Vitest + jsdom) |
| 10 | Order form item editing | Add and remove item controls update rows | Pass (`npm test`, Vitest + jsdom) |
| 11 | Order form customer validation | Invalid customer, email, or address blocks submit | Pass (`npm test`, Vitest + jsdom) |
| 12 | Order form quantity validation | Zero quantity blocks submit | Pass (`npm test`, Vitest + jsdom) |
| 13 | Order form submit payload | Customer, email, address, status, product, and quantity are submitted correctly | Pass (`npm test`, Vitest + jsdom) |

## UI manual (10 checks)
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
