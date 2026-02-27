package handlers

import (
	"errors"
	"fmt"
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
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Category      string  `json:"category"`
	Price         int64   `json:"price"`
	OriginalPrice *int64  `json:"originalPrice"`
	Image         string  `json:"image"`
	Description   string  `json:"description"`
	Dimensions    string  `json:"dimensions"`
	Material      string  `json:"material"`
	Stock         int     `json:"stock"`
	SKU           string  `json:"sku"`
	Featured      bool    `json:"featured"`
	Rating        float64 `json:"rating"`
	Reviews       int     `json:"reviews"`
}

type updateProductRequest struct {
	Name          string  `json:"name"`
	Category      string  `json:"category"`
	Price         int64   `json:"price"`
	OriginalPrice *int64  `json:"originalPrice"`
	Image         string  `json:"image"`
	Description   string  `json:"description"`
	Dimensions    string  `json:"dimensions"`
	Material      string  `json:"material"`
	Stock         int     `json:"stock"`
	SKU           string  `json:"sku"`
	Featured      bool    `json:"featured"`
	Rating        float64 `json:"rating"`
	Reviews       int     `json:"reviews"`
}

// List returns all products.
// @Summary List products
// @Tags products
// @Success 200 {array} models.Product
// @Router /products [get]
func (h *ProductHandler) List(c *fiber.Ctx) error {
	var products []models.Product
	if err := h.db.Order("created_at asc").Find(&products).Error; err != nil {
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

	product := models.Product{
		ID:            strings.TrimSpace(payload.ID),
		Name:          strings.TrimSpace(payload.Name),
		Category:      strings.TrimSpace(payload.Category),
		Price:         payload.Price,
		OriginalPrice: payload.OriginalPrice,
		Image:         strings.TrimSpace(payload.Image),
		Description:   strings.TrimSpace(payload.Description),
		Dimensions:    strings.TrimSpace(payload.Dimensions),
		Material:      strings.TrimSpace(payload.Material),
		Stock:         payload.Stock,
		SKU:           strings.TrimSpace(payload.SKU),
		Featured:      payload.Featured,
		Rating:        payload.Rating,
		Reviews:       payload.Reviews,
	}

	if product.ID == "" {
		product.ID = generateID("p")
	}
	if err := validateProductPayload(product); err != nil {
		return err
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
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return fiber.NewError(fiber.StatusBadRequest, "invalid product id")
	}

	var product models.Product
	if err := h.db.First(&product, "id = ?", id).Error; err != nil {
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
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return fiber.NewError(fiber.StatusBadRequest, "invalid product id")
	}

	var payload updateProductRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	var product models.Product
	if err := h.db.First(&product, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "product not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch product")
	}
	prev := product

	product.Name = strings.TrimSpace(payload.Name)
	product.Category = strings.TrimSpace(payload.Category)
	product.Price = payload.Price
	product.OriginalPrice = payload.OriginalPrice
	product.Image = strings.TrimSpace(payload.Image)
	product.Description = strings.TrimSpace(payload.Description)
	product.Dimensions = strings.TrimSpace(payload.Dimensions)
	product.Material = strings.TrimSpace(payload.Material)
	product.Stock = payload.Stock
	product.SKU = strings.TrimSpace(payload.SKU)
	product.Featured = payload.Featured
	product.Rating = payload.Rating
	product.Reviews = payload.Reviews

	if err := validateProductPayload(product); err != nil {
		return err
	}

	if err := h.db.Save(&product).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to update product")
	}

	changes := collectProductChanges(prev, product)
	if len(changes) == 0 {
		changes = []string{"saved without field changes"}
	}
	_ = createAuditLog(h.db, models.AuditLog{
		Action:   "Product Updated",
		Category: models.AuditCategoryProduct,
		User:     "admin@maison.co",
		Details:  fmt.Sprintf("Updated \"%s\": %s", product.Name, strings.Join(changes, ", ")),
		Severity: models.AuditSeverityInfo,
	})

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
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return fiber.NewError(fiber.StatusBadRequest, "invalid product id")
	}

	result := h.db.Delete(&models.Product{}, "id = ?", id)
	if result.Error != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to delete product")
	}

	if result.RowsAffected == 0 {
		return fiber.NewError(fiber.StatusNotFound, "product not found")
	}

	_ = createAuditLog(h.db, models.AuditLog{
		Action:   "Product Deleted",
		Category: models.AuditCategoryProduct,
		User:     "admin@maison.co",
		Details:  fmt.Sprintf("Deleted product %s", id),
		Severity: models.AuditSeverityWarning,
	})

	return c.SendStatus(fiber.StatusNoContent)
}

func validateProductPayload(product models.Product) error {
	if product.Name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "name is required")
	}
	if product.Category == "" {
		return fiber.NewError(fiber.StatusBadRequest, "category is required")
	}
	if product.Image == "" {
		return fiber.NewError(fiber.StatusBadRequest, "image is required")
	}
	if product.SKU == "" {
		return fiber.NewError(fiber.StatusBadRequest, "sku is required")
	}
	if product.Price < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "price must be >= 0")
	}
	if product.Stock < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "stock must be >= 0")
	}
	if product.Reviews < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "reviews must be >= 0")
	}
	if product.Rating < 0 || product.Rating > 5 {
		return fiber.NewError(fiber.StatusBadRequest, "rating must be between 0 and 5")
	}
	if product.OriginalPrice != nil && *product.OriginalPrice < product.Price {
		return fiber.NewError(fiber.StatusBadRequest, "originalPrice must be >= price")
	}
	return nil
}

func collectProductChanges(prev, next models.Product) []string {
	changes := []string{}

	if prev.Name != next.Name {
		changes = append(changes, fmt.Sprintf("name: %q -> %q", prev.Name, next.Name))
	}
	if prev.Price != next.Price {
		changes = append(changes, fmt.Sprintf("price: %d -> %d", prev.Price, next.Price))
	}
	if prev.Stock != next.Stock {
		changes = append(changes, fmt.Sprintf("stock: %d -> %d", prev.Stock, next.Stock))
	}
	if prev.Featured != next.Featured {
		changes = append(changes, fmt.Sprintf("featured: %t -> %t", prev.Featured, next.Featured))
	}
	if prev.Category != next.Category {
		changes = append(changes, fmt.Sprintf("category: %q -> %q", prev.Category, next.Category))
	}
	if prev.Image != next.Image {
		changes = append(changes, "image updated")
	}
	if prev.OriginalPrice == nil && next.OriginalPrice != nil {
		changes = append(changes, fmt.Sprintf("originalPrice: nil -> %d", *next.OriginalPrice))
	}
	if prev.OriginalPrice != nil && next.OriginalPrice == nil {
		changes = append(changes, fmt.Sprintf("originalPrice: %d -> nil", *prev.OriginalPrice))
	}
	if prev.OriginalPrice != nil && next.OriginalPrice != nil && *prev.OriginalPrice != *next.OriginalPrice {
		changes = append(changes, fmt.Sprintf("originalPrice: %d -> %d", *prev.OriginalPrice, *next.OriginalPrice))
	}
	if prev.Rating != next.Rating {
		changes = append(changes, fmt.Sprintf("rating: %.1f -> %.1f", prev.Rating, next.Rating))
	}
	if prev.Reviews != next.Reviews {
		changes = append(changes, fmt.Sprintf("reviews: %d -> %d", prev.Reviews, next.Reviews))
	}

	return changes
}
