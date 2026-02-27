package models

import (
	"encoding/json"
	"strings"
	"time"
)

type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusProcessing OrderStatus = "processing"
	OrderStatusShipped    OrderStatus = "shipped"
	OrderStatusDelivered  OrderStatus = "delivered"
	OrderStatusCancelled  OrderStatus = "cancelled"
)

type CartItem struct {
	Product  Product `json:"product"`
	Quantity int     `json:"quantity"`
}

type Order struct {
	ID        string      `gorm:"primaryKey;size:64" json:"id"`
	Customer  string      `json:"customer"`
	Email     string      `json:"email"`
	ItemsJSON string      `gorm:"type:text;column:items_json" json:"-"`
	Total     int64       `json:"total"`
	Status    OrderStatus `json:"status"`
	Date      time.Time   `json:"date"`
	Address   string      `json:"address"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

type OrderResponse struct {
	ID       string      `json:"id"`
	Customer string      `json:"customer"`
	Email    string      `json:"email"`
	Items    []CartItem  `json:"items"`
	Total    int64       `json:"total"`
	Status   OrderStatus `json:"status"`
	Date     time.Time   `json:"date"`
	Address  string      `json:"address"`
}

func (o *Order) SetItems(items []CartItem) error {
	payload, err := json.Marshal(items)
	if err != nil {
		return err
	}
	o.ItemsJSON = string(payload)
	return nil
}

func (o *Order) Items() ([]CartItem, error) {
	if strings.TrimSpace(o.ItemsJSON) == "" {
		return []CartItem{}, nil
	}

	var items []CartItem
	if err := json.Unmarshal([]byte(o.ItemsJSON), &items); err != nil {
		return nil, err
	}

	return items, nil
}

func (o *Order) ToResponse() (OrderResponse, error) {
	items, err := o.Items()
	if err != nil {
		return OrderResponse{}, err
	}

	return OrderResponse{
		ID:       o.ID,
		Customer: o.Customer,
		Email:    o.Email,
		Items:    items,
		Total:    o.Total,
		Status:   o.Status,
		Date:     o.Date,
		Address:  o.Address,
	}, nil
}

func IsValidOrderStatus(status OrderStatus) bool {
	switch status {
	case OrderStatusPending, OrderStatusProcessing, OrderStatusShipped, OrderStatusDelivered, OrderStatusCancelled:
		return true
	default:
		return false
	}
}
