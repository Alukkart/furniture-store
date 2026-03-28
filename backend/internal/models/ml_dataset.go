package models

import "time"

type MLDataset struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	DT          time.Time `gorm:"index;not null" json:"dt"`
	CategoryID  uint      `gorm:"index;not null" json:"category_id"`
	Category    Category  `gorm:"foreignKey:CategoryID" json:"-"`
	PriceBucket string    `gorm:"size:64;not null" json:"price_bucket"`
	SoldQty     int       `gorm:"not null" json:"sold_qty"`
	FeaturesJSON string   `gorm:"type:text;not null" json:"features_json"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
