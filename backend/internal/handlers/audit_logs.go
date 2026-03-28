package handlers

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuditLogHandler struct {
	service *services.AuditService
}

func NewAuditLogHandler(db *gorm.DB) *AuditLogHandler {
	return &AuditLogHandler{service: services.NewAuditService(repositories.NewAuditRepository(db))}
}

func (h *AuditLogHandler) List(c *fiber.Ctx) error {
	logs, err := h.service.List()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch audit logs")
	}
	return c.JSON(logs)
}

func (h *AuditLogHandler) Create(c *fiber.Ctx) error {
	var payload models.AuditLog
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	created, err := h.service.Create(payload)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(created)
}
