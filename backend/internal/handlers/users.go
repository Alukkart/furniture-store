package handlers

import (
	"strings"

	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type UserHandler struct {
	service      *services.UserService
	auditService *services.AuditService
}

func NewUserHandler(db *gorm.DB, appSecret string) *UserHandler {
	userRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(userRepo, appSecret)
	return &UserHandler{
		service:      services.NewUserService(userRepo, authService),
		auditService: services.NewAuditService(repositories.NewAuditRepository(db)),
	}
}

type createUserRequest struct {
	Email    string          `json:"email"`
	Password string          `json:"password"`
	Name     string          `json:"name"`
	Role     models.RoleName `json:"role"`
}

type blockUserRequest struct {
	IsBlocked bool `json:"is_blocked"`
}

// List returns internal users.
// @Summary List users
// @Tags users
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Success 200 {array} models.User
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 500 {object} handlers.errorResponse
// @Router /users [get]
func (h *UserHandler) List(c *fiber.Ctx) error {
	users, err := h.service.List()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch users")
	}
	return c.JSON(users)
}

// Create creates an internal user.
// @Summary Create user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param payload body createUserRequest true "User payload"
// @Success 201 {object} models.User
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Router /users [post]
func (h *UserHandler) Create(c *fiber.Ctx) error {
	var payload createUserRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	user, err := h.service.Create(payload.Email, payload.Password, payload.Name, payload.Role)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	claims, _ := middleware.ClaimsFromCtx(c)
	_, _ = h.auditService.Create(models.AuditLog{
		Action:   "User Created",
		Category: models.AuditCategoryUser,
		User:     claims.Email,
		Details:  "Created user " + user.Email,
		Severity: models.AuditSeverityInfo,
		Entity:   "user",
		EntityID: user.ID,
		Result:   "ok",
	})
	return c.Status(fiber.StatusCreated).JSON(user)
}

// SetBlocked blocks or unblocks a user.
// @Summary Block or unblock user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param id path string true "User ID"
// @Param payload body blockUserRequest true "Block payload"
// @Success 204
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Router /users/{id}/block [patch]
func (h *UserHandler) SetBlocked(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	var payload blockUserRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if err := h.service.SetBlocked(id, payload.IsBlocked); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	claims, _ := middleware.ClaimsFromCtx(c)
	action := "User Unblocked"
	details := "Unblocked user " + id
	severity := models.AuditSeverityInfo
	if payload.IsBlocked {
		action = "User Blocked"
		details = "Blocked user " + id
		severity = models.AuditSeverityWarning
	}
	_, _ = h.auditService.Create(models.AuditLog{
		Action:   action,
		Category: models.AuditCategoryUser,
		User:     claims.Email,
		Details:  details,
		Severity: severity,
		Entity:   "user",
		EntityID: id,
		Result:   "ok",
	})
	return c.SendStatus(fiber.StatusNoContent)
}
