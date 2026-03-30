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

// ListCategories returns reference categories.
// @Summary List categories
// @Tags references
// @Produce json
// @Success 200 {array} models.Category
// @Failure 500 {object} handlers.errorResponse
// @Router /categories [get]
func (h *ReferenceHandler) ListCategories(c *fiber.Ctx) error {
	items, err := h.service.ListCategories()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch categories")
	}
	return c.JSON(items)
}

// CreateCategory creates a category reference.
// @Summary Create category
// @Tags references
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param payload body createCategoryRequest true "Category payload"
// @Success 201 {object} models.Category
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Router /categories [post]
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

// ListCustomers returns customers.
// @Summary List customers
// @Tags references
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Success 200 {array} models.Customer
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 500 {object} handlers.errorResponse
// @Router /customers [get]
func (h *ReferenceHandler) ListCustomers(c *fiber.Ctx) error {
	items, err := h.service.ListCustomers()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch customers")
	}
	return c.JSON(items)
}

// CreateCustomer creates a customer record.
// @Summary Create customer
// @Tags references
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param payload body createCustomerRequest true "Customer payload"
// @Success 201 {object} models.Customer
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Router /customers [post]
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
