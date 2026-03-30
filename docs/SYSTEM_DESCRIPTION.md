# System Description

## Purpose

The system automates furniture store operations with a split client-server architecture:
- storefront and administrative web UI
- backend API with business rules and RBAC
- PostgreSQL database for transactional and analytical storage
- machine-learning module for demand forecasting

## Problem In The Current Process

Before automation, the domain bottlenecks are typical:
- product catalog and stock updates are maintained manually in spreadsheets
- order statuses are tracked in chats or ad hoc tables
- there is no single audit trail for who changed prices, stock, or order state
- purchasing decisions are made without structured demand analytics
- external clients do not have a self-service channel for tracking orders

Consequences without the system:
- delayed order handling
- stock inconsistencies
- pricing and inventory mistakes
- no transparent control over employee actions
- no forecast-based replenishment planning

## Roles

- Administrator: manages users, roles, product data, orders, audit, and forecast retraining
- Manager: maintains catalog, works with orders, views audit and forecast
- Warehouse: processes order execution and stock-related order changes
- Executive: monitors reports, audit trail, and forecast results
- Client: registers, signs in, places orders, and tracks personal orders

## Core Entities

- User
- Role
- Permission
- RolePermission
- Category
- Product
- Customer
- Order
- OrderItem
- OrderStatusRef
- AuditLog
- MLDataset

## AI Module

Task type:
- forecasting

Input features:
- category identifier
- monthly sales history
- month value
- seasonality coefficient
- price bucket metadata

Output:
- forecast quantity by category
- recommended replenishment amount
- confidence score
- quality metrics `MAE` and `RMSE`

Where it is used:
- purchasing and replenishment planning before managerial decision-making

## Lifecycle Conclusion

The implemented artifacts follow the logic of a cascade lifecycle:
1. Analysis: domain problem, roles, entities, and business processes are defined.
2. Design: ER diagram, class diagram, API structure, and split architecture are documented.
3. Implementation: frontend, backend, database, RBAC, audit, and AI module are developed.
4. Testing: backend integration tests and build verification are executed and recorded.
5. Deployment preparation: Docker Compose, backup and restore scripts, and run instructions are prepared.
