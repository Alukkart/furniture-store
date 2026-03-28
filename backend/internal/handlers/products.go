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

func (h *ProductHandler) List(c *fiber.Ctx) error {
	products, err := h.service.List()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch products")
	}
	return c.JSON(products)
}

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
