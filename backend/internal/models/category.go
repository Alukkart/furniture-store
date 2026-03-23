package models

import "time"

type Category struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:120;uniqueIndex;not null" json:"name"`
	ParentID  *uint     `json:"parent_id,omitempty"`
	Parent    *Category `json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
