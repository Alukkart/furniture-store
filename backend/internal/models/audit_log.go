package models

import "time"

type AuditCategory string

const (
	AuditCategoryProduct AuditCategory = "product"
	AuditCategoryOrder   AuditCategory = "order"
	AuditCategoryUser    AuditCategory = "user"
	AuditCategorySystem  AuditCategory = "system"
)

type AuditSeverity string

const (
	AuditSeverityInfo     AuditSeverity = "info"
	AuditSeverityWarning  AuditSeverity = "warning"
	AuditSeverityCritical AuditSeverity = "critical"
)

type AuditLog struct {
	ID        string        `gorm:"primaryKey;size:64" json:"id"`
	UserID    *string       `gorm:"size:64;index" json:"user_id,omitempty"`
	Action    string        `gorm:"size:180;not null" json:"action"`
	Category  AuditCategory `gorm:"size:40;not null" json:"category"`
	User      string        `gorm:"size:180;not null" json:"user"`
	Entity    string        `gorm:"size:80" json:"entity,omitempty"`
	EntityID  string        `gorm:"size:64" json:"entity_id,omitempty"`
	Details   string        `gorm:"type:text;not null" json:"details"`
	Timestamp time.Time     `gorm:"index" json:"timestamp"`
	Severity  AuditSeverity `gorm:"size:40;not null" json:"severity"`
	Result    string        `gorm:"size:40;default:'ok'" json:"result"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

func IsValidAuditCategory(category AuditCategory) bool {
	switch category {
	case AuditCategoryProduct, AuditCategoryOrder, AuditCategoryUser, AuditCategorySystem:
		return true
	default:
		return false
	}
}

func IsValidAuditSeverity(severity AuditSeverity) bool {
	switch severity {
	case AuditSeverityInfo, AuditSeverityWarning, AuditSeverityCritical:
		return true
	default:
		return false
	}
}
