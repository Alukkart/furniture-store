package handlers

import (
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ReferenceHandler struct {
	service *services.ReferenceService
}

func NewReferenceHandler(db *gorm.DB) *ReferenceHandler {
	return &ReferenceHandler{service: services.NewReferenceService(repositories.NewCategoryRepository(db), repositories.NewCustomerRepository(db))}
}

type createCategoryRequest struct {
	Name     string `json:"name"`
	ParentID *uint  `json:"parent_id"`
}

type createCustomerRequest struct {
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
}

func (h *ReferenceHandler) ListCategories(c *fiber.Ctx) error {
	items, err := h.service.ListCategories()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch categories")
	}
	return c.JSON(items)
}

func (h *ReferenceHandler) CreateCategory(c *fiber.Ctx) error {
	var payload createCategoryRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	item, err := h.service.CreateCategory(payload.Name, payload.ParentID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}

func (h *ReferenceHandler) ListCustomers(c *fiber.Ctx) error {
	items, err := h.service.ListCustomers()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch customers")
	}
	return c.JSON(items)
}

func (h *ReferenceHandler) CreateCustomer(c *fiber.Ctx) error {
	var payload createCustomerRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	item, err := h.service.CreateCustomer(payload.FullName, payload.Phone, payload.Email)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}
