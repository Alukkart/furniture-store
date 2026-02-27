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
	Action    string        `json:"action"`
	Category  AuditCategory `json:"category"`
	User      string        `json:"user"`
	Details   string        `json:"details"`
	Timestamp time.Time     `json:"timestamp"`
	Severity  AuditSeverity `json:"severity"`
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
