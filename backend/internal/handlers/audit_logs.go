package handlers

import (
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

// List returns audit logs with optional filtering and pagination.
// @Summary List audit logs
// @Tags audit
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param category query string false "Filter by category (product/order/user/system)"
// @Param severity query string false "Filter by severity (info/warning/critical)"
// @Param q query string false "Search in action, details and user"
// @Param limit query int false "Page size"
// @Param offset query int false "Page offset"
// @Success 200 {array} models.AuditLog
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 500 {object} handlers.errorResponse
// @Router /audit-logs [get]
func (h *AuditLogHandler) List(c *fiber.Ctx) error {
	filter := repositories.AuditFilter{
		Category: c.Query("category"),
		Severity: c.Query("severity"),
		Query:    c.Query("q"),
		Limit:    c.QueryInt("limit"),
		Offset:   c.QueryInt("offset"),
	}
	logs, err := h.service.List(filter)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch audit logs")
	}
	return c.JSON(logs)
}
