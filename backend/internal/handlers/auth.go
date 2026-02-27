package handlers

import (
	"strings"

	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	User models.AdminUser `json:"user"`
}

type adminAccount struct {
	models.AdminUser
	Password string
}

var demoAccounts = []adminAccount{
	{
		AdminUser: models.AdminUser{
			Email: "admin@maison.co",
			Name:  "Admin",
			Role:  "Administrator",
		},
		Password: "admin123",
	},
	{
		AdminUser: models.AdminUser{
			Email: "manager@maison.co",
			Name:  "Manager",
			Role:  "Manager",
		},
		Password: "manager123",
	},
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var payload loginRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	email := strings.TrimSpace(strings.ToLower(payload.Email))
	password := payload.Password
	if email == "" || password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "email and password are required")
	}

	var account *adminAccount
	for i := range demoAccounts {
		if strings.ToLower(demoAccounts[i].Email) == email && demoAccounts[i].Password == password {
			account = &demoAccounts[i]
			break
		}
	}

	if account == nil {
		_ = createAuditLog(h.db, models.AuditLog{
			Action:   "Failed Login Attempt",
			Category: models.AuditCategoryUser,
			User:     email,
			Details:  "Failed login attempt for " + email,
			Severity: models.AuditSeverityWarning,
		})
		return fiber.NewError(fiber.StatusUnauthorized, "invalid email or password")
	}

	_ = createAuditLog(h.db, models.AuditLog{
		Action:   "User Login",
		Category: models.AuditCategoryUser,
		User:     account.Email,
		Details:  "Successful admin login for " + account.Email,
		Severity: models.AuditSeverityInfo,
	})

	return c.JSON(loginResponse{User: account.AdminUser})
}
