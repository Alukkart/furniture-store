package handlers

import (
	"fmt"
	"strings"
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
)

func createAuditLog(db *gorm.DB, entry models.AuditLog) error {
	entry.Action = strings.TrimSpace(entry.Action)
	entry.User = strings.TrimSpace(entry.User)
	entry.Details = strings.TrimSpace(entry.Details)

	if entry.ID == "" {
		entry.ID = generateID("log")
	}
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now().UTC()
	}

	return db.Create(&entry).Error
}

func generateID(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
}
