package handlers

import (
	"errors"
	"strconv"
	"strings"

	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ProductHandler struct {
	db *gorm.DB
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

type createProductRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	PriceCents  int64  `json:"price_cents"`
}

type updateProductRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	PriceCents  int64  `json:"price_cents"`
}

// List returns all products.
// @Summary List products
// @Tags products
// @Success 200 {array} models.Product
// @Router /products [get]
func (h *ProductHandler) List(c *fiber.Ctx) error {
	var products []models.Product
	if err := h.db.Order("created_at desc").Find(&products).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch products")
	}
	return c.JSON(products)
}

// Create creates a new product.
// @Summary Create product
// @Tags products
// @Accept json
// @Produce json
// @Param payload body createProductRequest true "Product payload"
// @Success 201 {object} models.Product
// @Failure 400 {object} map[string]string
// @Router /products [post]
func (h *ProductHandler) Create(c *fiber.Ctx) error {
	var payload createProductRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "name is required")
	}
	if payload.PriceCents < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "price_cents must be >= 0")
	}

	product := models.Product{
		Name:        payload.Name,
		Description: strings.TrimSpace(payload.Description),
		Category:    strings.TrimSpace(payload.Category),
		PriceCents:  payload.PriceCents,
	}

	if err := h.db.Create(&product).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create product")
	}

	return c.Status(fiber.StatusCreated).JSON(product)
}

// Get returns a single product by ID.
// @Summary Get product
// @Tags products
// @Param id path int true "Product ID"
// @Success 200 {object} models.Product
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /products/{id} [get]
func (h *ProductHandler) Get(c *fiber.Ctx) error {
	id, err := parseProductID(c)
	if err != nil {
		return err
	}

	var product models.Product
	if err := h.db.First(&product, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "product not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch product")
	}

	return c.JSON(product)
}

// Update replaces a product by ID.
// @Summary Update product
// @Tags products
// @Accept json
// @Produce json
// @Param id path int true "Product ID"
// @Param payload body updateProductRequest true "Product payload"
// @Success 200 {object} models.Product
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /products/{id} [put]
func (h *ProductHandler) Update(c *fiber.Ctx) error {
	id, err := parseProductID(c)
	if err != nil {
		return err
	}

	var payload updateProductRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "name is required")
	}
	if payload.PriceCents < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "price_cents must be >= 0")
	}

	var product models.Product
	if err := h.db.First(&product, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "product not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch product")
	}

	product.Name = payload.Name
	product.Description = strings.TrimSpace(payload.Description)
	product.Category = strings.TrimSpace(payload.Category)
	product.PriceCents = payload.PriceCents

	if err := h.db.Save(&product).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to update product")
	}

	return c.JSON(product)
}

// Delete removes a product by ID.
// @Summary Delete product
// @Tags products
// @Param id path int true "Product ID"
// @Success 204 {string} string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /products/{id} [delete]
func (h *ProductHandler) Delete(c *fiber.Ctx) error {
	id, err := parseProductID(c)
	if err != nil {
		return err
	}

	if err := h.db.Delete(&models.Product{}, id).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to delete product")
	}

	if h.db.RowsAffected == 0 {
		return fiber.NewError(fiber.StatusNotFound, "product not found")
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func parseProductID(c *fiber.Ctx) (uint, error) {
	rawID := c.Params("id")
	id, err := strconv.Atoi(rawID)
	if err != nil || id <= 0 {
		return 0, fiber.NewError(fiber.StatusBadRequest, "invalid product id")
	}
	return uint(id), nil
}
