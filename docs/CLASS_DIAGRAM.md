# Class Diagram

```mermaid
classDiagram
    class AuthHandler
    class ProductHandler
    class OrderHandler
    class AuditLogHandler
    class UserHandler
    class ForecastHandler

    class AuthService
    class ProductService
    class OrderService
    class AuditService
    class UserService
    class ForecastService

    class UserRepository
    class ProductRepository
    class OrderRepository
    class AuditRepository
    class ForecastRepository

    class User
    class Role
    class Permission
    class RolePermission
    class Product
    class Category
    class Customer
    class Order
    class OrderItem
    class AuditLog
    class MLDataset

    AuthHandler --> AuthService
    ProductHandler --> ProductService
    OrderHandler --> OrderService
    AuditLogHandler --> AuditService
    UserHandler --> UserService
    ForecastHandler --> ForecastService

    AuthService --> UserRepository
    ProductService --> ProductRepository
    OrderService --> OrderRepository
    AuditService --> AuditRepository
    UserService --> UserRepository
    UserService --> AuthService
    ForecastService --> ForecastRepository

    UserRepository --> User
    UserRepository --> Role
    ProductRepository --> Product
    ProductRepository --> Category
    OrderRepository --> Order
    OrderRepository --> OrderItem
    OrderRepository --> Customer
    AuditRepository --> AuditLog
    ForecastRepository --> MLDataset

    Role --> RolePermission
    Permission --> RolePermission
```

## Applied Patterns

- MVC:
  handlers act as controllers, models describe domain entities, frontend pages render views.
- Repository:
  repositories encapsulate persistence and query details.
- Service layer:
  services hold validations, transaction boundaries, and business rules.
