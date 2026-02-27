package models

import "time"

type Product struct {
	ID            string    `gorm:"primaryKey;size:64" json:"id"`
	Name          string    `json:"name"`
	Category      string    `json:"category"`
	Price         int64     `json:"price"`
	OriginalPrice *int64    `json:"originalPrice,omitempty"`
	Image         string    `json:"image"`
	Description   string    `json:"description"`
	Dimensions    string    `json:"dimensions"`
	Material      string    `json:"material"`
	Stock         int       `json:"stock"`
	SKU           string    `json:"sku"`
	Featured      bool      `json:"featured"`
	Rating        float64   `json:"rating"`
	Reviews       int       `json:"reviews"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
