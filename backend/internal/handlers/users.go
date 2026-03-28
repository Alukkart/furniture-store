package handlers

import (
	"strings"

	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type UserHandler struct {
	service *services.UserService
}

func NewUserHandler(db *gorm.DB, appSecret string) *UserHandler {
	userRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(userRepo, appSecret)
	return &UserHandler{service: services.NewUserService(userRepo, authService)}
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

func (h *UserHandler) List(c *fiber.Ctx) error {
	users, err := h.service.List()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch users")
	}
	return c.JSON(users)
}

func (h *UserHandler) Create(c *fiber.Ctx) error {
	var payload createUserRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	user, err := h.service.Create(payload.Email, payload.Password, payload.Name, payload.Role)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(user)
}

func (h *UserHandler) SetBlocked(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	var payload blockUserRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if err := h.service.SetBlocked(id, payload.IsBlocked); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}
