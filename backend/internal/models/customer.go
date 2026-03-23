package models

import "time"

type Customer struct {
	ID        string    `gorm:"primaryKey;size:64" json:"id"`
	FullName  string    `gorm:"size:180;not null" json:"full_name"`
	Phone     string    `gorm:"size:64" json:"phone"`
	Email     string    `gorm:"size:180;index" json:"email"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
