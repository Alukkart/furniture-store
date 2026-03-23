package models

import "time"

type OrderStatusRef struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Code      string    `gorm:"size:40;uniqueIndex;not null" json:"code"`
	Name      string    `gorm:"size:80;not null" json:"name"`
	SortOrder int       `gorm:"not null;default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
