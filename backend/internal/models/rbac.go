package models

import "time"

type RoleName string

const (
	RoleAdmin     RoleName = "Administrator"
	RoleManager   RoleName = "Manager"
	RoleWarehouse RoleName = "Warehouse"
	RoleExecutive RoleName = "Executive"
)

type Role struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      RoleName  `gorm:"size:64;uniqueIndex;not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type User struct {
	ID           string    `gorm:"primaryKey;size:64" json:"id"`
	Email        string    `gorm:"size:180;uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Name         string    `gorm:"size:120;not null" json:"name"`
	RoleID       uint      `gorm:"not null" json:"role_id"`
	Role         Role      `gorm:"foreignKey:RoleID" json:"role"`
	IsBlocked    bool      `gorm:"not null;default:false" json:"is_blocked"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
