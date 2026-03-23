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

type AuthHandler struct {
	authService  *services.AuthService
	auditService *services.AuditService
}

func NewAuthHandler(db *gorm.DB, appSecret string) *AuthHandler {
	userRepo := repositories.NewUserRepository(db)
	auditRepo := repositories.NewAuditRepository(db)
	return &AuthHandler{
		authService:  services.NewAuthService(userRepo, appSecret),
		auditService: services.NewAuditService(auditRepo),
	}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type registerRequest struct {
	Email    string          `json:"email"`
	Password string          `json:"password"`
	Name     string          `json:"name"`
	Role     models.RoleName `json:"role"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var payload loginRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	response, err := h.authService.Login(payload.Email, payload.Password)
	if err != nil {
		_ = h.createAudit("Failed Login Attempt", models.AuditCategoryUser, strings.TrimSpace(payload.Email), "Failed login attempt", models.AuditSeverityWarning, "user", "", "failed")
		return fiber.NewError(fiber.StatusUnauthorized, err.Error())
	}

	_ = h.createAudit("User Login", models.AuditCategoryUser, response.User.Email, "Successful login", models.AuditSeverityInfo, "user", response.User.ID, "ok")
	return c.JSON(response)
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var payload registerRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	user, err := h.authService.CreateUser(payload.Email, payload.Password, payload.Name, payload.Role)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	_ = h.createAudit("User Created", models.AuditCategoryUser, user.Email, "User registered", models.AuditSeverityInfo, "user", user.ID, "ok")
	return c.Status(fiber.StatusCreated).JSON(models.AdminUser{ID: user.ID, Email: user.Email, Name: user.Name, Role: user.Role.Name})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	claims, ok := middleware.ClaimsFromCtx(c)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}
	return c.JSON(models.AdminUser{ID: claims.UserID, Email: claims.Email, Role: claims.Role, Name: claims.Email})
}

func (h *AuthHandler) createAudit(action string, category models.AuditCategory, user, details string, severity models.AuditSeverity, entity, entityID, result string) error {
	_, err := h.auditService.Create(models.AuditLog{Action: action, Category: category, User: user, Details: details, Severity: severity, Entity: entity, EntityID: entityID, Result: result})
	return err
}
