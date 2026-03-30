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

type tokenRequest struct {
	Username  string `form:"username" json:"username"`
	Email     string `form:"email" json:"email"`
	Password  string `form:"password" json:"password"`
	GrantType string `form:"grant_type" json:"grant_type"`
}

type registerRequest struct {
	Email    string          `json:"email"`
	Password string          `json:"password"`
	Name     string          `json:"name"`
	Role     models.RoleName `json:"role"`
}

type signupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// Login authenticates a user and returns a bearer token.
// @Summary Login
// @Tags auth
// @Accept json
// @Produce json
// @Param payload body loginRequest true "Login payload"
// @Success 200 {object} models.LoginResponse
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Router /auth/login [post]
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

// Token authenticates a user for Swagger OAuth2 password flow.
// Use the `username` field to pass the email address.
// @Summary OAuth2 token
// @Description Swagger-friendly token endpoint. Put the email into the `username` field and the password into `password`.
// @Tags auth
// @Accept application/x-www-form-urlencoded
// @Produce json
// @Param username formData string false "Email address"
// @Param email formData string false "Alternative email field"
// @Param password formData string true "Password"
// @Param grant_type formData string false "OAuth2 grant type"
// @Success 200 {object} models.TokenResponse
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Router /auth/token [post]
func (h *AuthHandler) Token(c *fiber.Ctx) error {
	var payload tokenRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request payload")
	}

	email := strings.TrimSpace(payload.Email)
	if email == "" {
		email = strings.TrimSpace(payload.Username)
	}

	response, err := h.authService.Login(email, payload.Password)
	if err != nil {
		_ = h.createAudit("Failed Token Request", models.AuditCategoryUser, email, "Failed OAuth2 token request", models.AuditSeverityWarning, "user", "", "failed")
		return fiber.NewError(fiber.StatusUnauthorized, err.Error())
	}

	_ = h.createAudit("OAuth2 Token Issued", models.AuditCategoryUser, response.User.Email, "OAuth2 password flow token issued", models.AuditSeverityInfo, "user", response.User.ID, "ok")
	return c.JSON(models.TokenResponse{
		AccessToken: response.Token,
		TokenType:   "Bearer",
		ExpiresIn:   43200,
	})
}

// Register creates a new internal user account.
// @Summary Register user
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param payload body registerRequest true "Registration payload"
// @Success 201 {object} models.AdminUser
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Router /auth/register [post]
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

// Signup creates a new external client account.
// @Summary Public client signup
// @Tags auth
// @Accept json
// @Produce json
// @Param payload body signupRequest true "Signup payload"
// @Success 201 {object} models.AdminUser
// @Failure 400 {object} handlers.errorResponse
// @Router /auth/signup [post]
func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var payload signupRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	user, err := h.authService.CreateUser(payload.Email, payload.Password, payload.Name, models.RoleClient)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	_ = h.createAudit("Client Registered", models.AuditCategoryUser, user.Email, "Client account created", models.AuditSeverityInfo, "user", user.ID, "ok")
	return c.Status(fiber.StatusCreated).JSON(models.AdminUser{ID: user.ID, Email: user.Email, Name: user.Name, Role: user.Role.Name})
}

// Me returns current authenticated user.
// @Summary Current user
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Success 200 {object} models.AdminUser
// @Failure 401 {object} handlers.errorResponse
// @Router /auth/me [get]
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
