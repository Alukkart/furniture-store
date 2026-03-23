package models

import "time"

type Product struct {
	ID            string    `gorm:"primaryKey;size:64" json:"id"`
	Name          string    `gorm:"size:180;not null" json:"name"`
	SKU           string    `gorm:"size:90;uniqueIndex;not null" json:"sku"`
	CategoryID    uint      `gorm:"index;not null" json:"category_id"`
	CategoryRef   Category  `gorm:"foreignKey:CategoryID" json:"-"`
	Category      string    `gorm:"-" json:"category"`
	Price         int64     `gorm:"not null" json:"price"`
	OriginalPrice *int64    `json:"originalPrice,omitempty"`
	Image         string    `gorm:"size:255;not null" json:"image"`
	Description   string    `gorm:"type:text" json:"description"`
	Dimensions    string    `gorm:"size:120" json:"dimensions"`
	Material      string    `gorm:"size:180" json:"material"`
	StockQty      int       `gorm:"not null;default:0" json:"-"`
	Stock         int       `gorm:"-" json:"stock"`
	IsActive      bool      `gorm:"not null;default:true" json:"is_active"`
	Featured      bool      `gorm:"not null;default:false" json:"featured"`
	Rating        float64   `gorm:"not null;default:0" json:"rating"`
	Reviews       int       `gorm:"not null;default:0" json:"reviews"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (p *Product) SyncViewFields() {
	if p.Stock == 0 || p.Stock != p.StockQty {
		p.Stock = p.StockQty
	}
}

func (p *Product) SyncDBFields() {
	p.StockQty = p.Stock
}
