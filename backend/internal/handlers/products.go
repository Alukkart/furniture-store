package handlers

import (
	"fmt"
	"strings"

	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ProductHandler struct {
	service      *services.ProductService
	auditService *services.AuditService
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{
		service:      services.NewProductService(repositories.NewProductRepository(db)),
		auditService: services.NewAuditService(repositories.NewAuditRepository(db)),
	}
}

// List returns all products.
// @Summary List products
// @Tags products
// @Produce json
// @Success 200 {array} models.Product
// @Failure 500 {object} handlers.errorResponse
// @Router /products [get]
func (h *ProductHandler) List(c *fiber.Ctx) error {
	products, err := h.service.List()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch products")
	}
	return c.JSON(products)
}

// Create creates a new product.
// @Summary Create product
// @Tags products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param payload body models.Product true "Product payload"
// @Success 201 {object} models.Product
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Router /products [post]
func (h *ProductHandler) Create(c *fiber.Ctx) error {
	var payload models.Product
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	created, err := h.service.Create(payload)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	claims, _ := middleware.ClaimsFromCtx(c)
	_ = h.audit("Product Created", models.AuditCategoryProduct, claims.Email, fmt.Sprintf("Created product %s", created.Name), models.AuditSeverityInfo, "product", created.ID, "ok")
	return c.Status(fiber.StatusCreated).JSON(created)
}

// Get returns a product by ID.
// @Summary Get product
// @Tags products
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} models.Product
// @Failure 400 {object} handlers.errorResponse
// @Failure 404 {object} handlers.errorResponse
// @Router /products/{id} [get]
func (h *ProductHandler) Get(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	product, err := h.service.Get(id)
	if err != nil {
		if services.IsNotFound(err) {
			return fiber.NewError(fiber.StatusNotFound, "product not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(product)
}

// Update updates a product by ID.
// @Summary Update product
// @Tags products
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param id path string true "Product ID"
// @Param payload body models.Product true "Product payload"
// @Success 200 {object} models.Product
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 404 {object} handlers.errorResponse
// @Router /products/{id} [put]
func (h *ProductHandler) Update(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	var payload models.Product
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	prev, updated, err := h.service.Update(id, payload)
	if err != nil {
		if services.IsNotFound(err) {
			return fiber.NewError(fiber.StatusNotFound, "product not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	claims, _ := middleware.ClaimsFromCtx(c)
	_ = h.audit("Product Updated", models.AuditCategoryProduct, claims.Email, fmt.Sprintf("Updated %s: price %d -> %d, stock %d -> %d", updated.Name, prev.Price, updated.Price, prev.Stock, updated.Stock), models.AuditSeverityInfo, "product", updated.ID, "ok")
	return c.JSON(updated)
}

// Delete removes a product by ID.
// @Summary Delete product
// @Tags products
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param id path string true "Product ID"
// @Success 204
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 404 {object} handlers.errorResponse
// @Router /products/{id} [delete]
func (h *ProductHandler) Delete(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if err := h.service.Delete(id); err != nil {
		if services.IsNotFound(err) {
			return fiber.NewError(fiber.StatusNotFound, "product not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	claims, _ := middleware.ClaimsFromCtx(c)
	_ = h.audit("Product Deleted", models.AuditCategoryProduct, claims.Email, fmt.Sprintf("Deleted product %s", id), models.AuditSeverityWarning, "product", id, "ok")
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *ProductHandler) audit(action string, category models.AuditCategory, user, details string, severity models.AuditSeverity, entity, entityID, result string) error {
	_, err := h.auditService.Create(models.AuditLog{Action: action, Category: category, User: user, Details: details, Severity: severity, Entity: entity, EntityID: entityID, Result: result})
	return err
}
