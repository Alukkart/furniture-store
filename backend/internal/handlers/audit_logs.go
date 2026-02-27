package handlers

import (
	"strings"

	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuditLogHandler struct {
	db *gorm.DB
}

func NewAuditLogHandler(db *gorm.DB) *AuditLogHandler {
	return &AuditLogHandler{db: db}
}

type createAuditLogRequest struct {
	Action   string               `json:"action"`
	Category models.AuditCategory `json:"category"`
	User     string               `json:"user"`
	Details  string               `json:"details"`
	Severity models.AuditSeverity `json:"severity"`
}

func (h *AuditLogHandler) List(c *fiber.Ctx) error {
	var logs []models.AuditLog
	if err := h.db.Order("timestamp desc").Find(&logs).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch audit logs")
	}
	return c.JSON(logs)
}

func (h *AuditLogHandler) Create(c *fiber.Ctx) error {
	var payload createAuditLogRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	payload.Action = strings.TrimSpace(payload.Action)
	payload.User = strings.TrimSpace(payload.User)
	payload.Details = strings.TrimSpace(payload.Details)

	if payload.Action == "" {
		return fiber.NewError(fiber.StatusBadRequest, "action is required")
	}
	if payload.User == "" {
		return fiber.NewError(fiber.StatusBadRequest, "user is required")
	}
	if payload.Details == "" {
		return fiber.NewError(fiber.StatusBadRequest, "details are required")
	}
	if !models.IsValidAuditCategory(payload.Category) {
		return fiber.NewError(fiber.StatusBadRequest, "invalid category")
	}
	if !models.IsValidAuditSeverity(payload.Severity) {
		return fiber.NewError(fiber.StatusBadRequest, "invalid severity")
	}

	log := models.AuditLog{
		ID:       generateID("log"),
		Action:   payload.Action,
		Category: payload.Category,
		User:     payload.User,
		Details:  payload.Details,
		Severity: payload.Severity,
	}
	if err := createAuditLog(h.db, log); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create audit log")
	}

	var saved models.AuditLog
	if err := h.db.First(&saved, "id = ?", log.ID).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch created audit log")
	}

	return c.Status(fiber.StatusCreated).JSON(saved)
}
