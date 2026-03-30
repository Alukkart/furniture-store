package models

import "time"

type RoleName string

const (
	RoleAdmin     RoleName = "Administrator"
	RoleManager   RoleName = "Manager"
	RoleWarehouse RoleName = "Warehouse"
	RoleExecutive RoleName = "Executive"
	RoleClient    RoleName = "Client"
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

type Permission struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Action      string    `gorm:"size:80;not null" json:"action"`
	Resource    string    `gorm:"size:80;not null" json:"resource"`
	Effect      string    `gorm:"size:16;not null;default:'allow'" json:"effect"`
	Description string    `gorm:"size:255" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RolePermission struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	RoleID       uint       `gorm:"not null;index" json:"role_id"`
	Role         Role       `gorm:"foreignKey:RoleID" json:"-"`
	PermissionID uint       `gorm:"not null;index" json:"permission_id"`
	Permission   Permission `gorm:"foreignKey:PermissionID" json:"permission"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
