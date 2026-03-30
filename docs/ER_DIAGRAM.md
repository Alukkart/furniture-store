# ER Diagram

```mermaid
erDiagram
    ROLE ||--o{ USER : assigns
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : maps
    CATEGORY ||--o{ PRODUCT : classifies
    CUSTOMER ||--o{ ORDER : places
    ORDER_STATUS_REF ||--o{ ORDER : tracks
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : references
    CATEGORY ||--o{ ML_DATASET : aggregates

    ROLE {
        uint id PK
        string name UK
    }

    PERMISSION {
        uint id PK
        string action
        string resource
        string effect
        string description
    }

    ROLE_PERMISSION {
        uint id PK
        uint role_id FK
        uint permission_id FK
    }

    USER {
        string id PK
        string email UK
        string password_hash
        string name
        uint role_id FK
        bool is_blocked
    }

    CATEGORY {
        uint id PK
        string name UK
        uint parent_id FK
    }

    PRODUCT {
        string id PK
        string sku UK
        uint category_id FK
        string name
        bigint price
        bigint original_price
        string image
        string description
        string dimensions
        string material
        int stock_qty
        bool is_active
        bool featured
    }

    CUSTOMER {
        string id PK
        string full_name
        string phone
        string email
    }

    ORDER_STATUS_REF {
        uint id PK
        string code UK
        string name
        int sort_order
    }

    ORDER {
        string id PK
        string customer_id FK
        uint status_id FK
        bigint total_sum
        string address
        datetime created_at
    }

    ORDER_ITEM {
        uint id PK
        string order_id FK
        string product_id FK
        int qty
        bigint price
    }

    AUDIT_LOG {
        string id PK
        string user_id FK
        string action
        string category
        string entity
        string entity_id
        string details
        string severity
        string result
        datetime timestamp
    }

    ML_DATASET {
        uint id PK
        datetime dt
        uint category_id FK
        string price_bucket
        int sold_qty
        text features_json
    }
```

## Notes

- Primary keys, foreign keys, uniqueness constraints, and reference tables are represented in the ORM model definitions.
- The schema is normalized around reference entities such as `roles`, `categories`, and `order_status_refs`.
- Role permissions are stored separately from users, which keeps RBAC reference data normalized.
- Order items are stored in a separate table, which keeps the transactional model normalized instead of embedding repeated product data in orders.
