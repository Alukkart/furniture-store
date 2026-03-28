package models

import "time"

type OrderState string

const (
	OrderStatusPending    OrderState = "pending"
	OrderStatusProcessing OrderState = "processing"
	OrderStatusShipped    OrderState = "shipped"
	OrderStatusDelivered  OrderState = "delivered"
	OrderStatusCancelled  OrderState = "cancelled"
)

type CartItem struct {
	Product  Product `json:"product"`
	Quantity int     `json:"quantity"`
}

type OrderItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	OrderID   string    `gorm:"size:64;index;not null" json:"order_id"`
	Order     Order     `gorm:"foreignKey:OrderID" json:"-"`
	ProductID string    `gorm:"size:64;index;not null" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product"`
	Qty       int       `gorm:"not null" json:"qty"`
	Price     int64     `gorm:"not null" json:"price"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Order struct {
	ID         string         `gorm:"primaryKey;size:64" json:"id"`
	CustomerID string         `gorm:"size:64;index;not null" json:"customer_id"`
	Customer   Customer       `gorm:"foreignKey:CustomerID" json:"-"`
	StatusID   uint           `gorm:"index;not null" json:"status_id"`
	StatusRef  OrderStatusRef `gorm:"foreignKey:StatusID" json:"-"`
	TotalSum   int64          `gorm:"not null;default:0" json:"total_sum"`
	Address    string         `gorm:"size:255;not null" json:"address"`
	Items      []OrderItem    `gorm:"foreignKey:OrderID" json:"-"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

type OrderResponse struct {
	ID       string     `json:"id"`
	Customer string     `json:"customer"`
	Email    string     `json:"email"`
	Items    []CartItem `json:"items"`
	Total    int64      `json:"total"`
	Status   OrderState `json:"status"`
	Date     time.Time  `json:"date"`
	Address  string     `json:"address"`
}

func IsValidOrderStatus(status OrderState) bool {
	switch status {
	case OrderStatusPending, OrderStatusProcessing, OrderStatusShipped, OrderStatusDelivered, OrderStatusCancelled:
		return true
	default:
		return false
	}
}
