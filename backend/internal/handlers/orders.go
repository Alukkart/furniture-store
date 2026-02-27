package handlers

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type OrderHandler struct {
	db *gorm.DB
}

func NewOrderHandler(db *gorm.DB) *OrderHandler {
	return &OrderHandler{db: db}
}

type createOrderRequest struct {
	Customer string            `json:"customer"`
	Email    string            `json:"email"`
	Address  string            `json:"address"`
	Items    []models.CartItem `json:"items"`
}

type updateOrderStatusRequest struct {
	Status models.OrderStatus `json:"status"`
	User   string             `json:"user"`
}

func (h *OrderHandler) List(c *fiber.Ctx) error {
	var orders []models.Order
	if err := h.db.Order("date desc").Find(&orders).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch orders")
	}

	response := make([]models.OrderResponse, 0, len(orders))
	for _, order := range orders {
		orderResponse, err := order.ToResponse()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "failed to decode order items")
		}
		response = append(response, orderResponse)
	}

	return c.JSON(response)
}

func (h *OrderHandler) Create(c *fiber.Ctx) error {
	var payload createOrderRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	payload.Customer = strings.TrimSpace(payload.Customer)
	payload.Email = strings.TrimSpace(payload.Email)
	payload.Address = strings.TrimSpace(payload.Address)

	if payload.Customer == "" {
		return fiber.NewError(fiber.StatusBadRequest, "customer is required")
	}
	if payload.Email == "" {
		return fiber.NewError(fiber.StatusBadRequest, "email is required")
	}
	if payload.Address == "" {
		return fiber.NewError(fiber.StatusBadRequest, "address is required")
	}
	if len(payload.Items) == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "items are required")
	}

	tx := h.db.Begin()
	if tx.Error != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to start transaction")
	}

	preparedItems := make([]models.CartItem, 0, len(payload.Items))
	var total int64

	for _, item := range payload.Items {
		productID := strings.TrimSpace(item.Product.ID)
		if productID == "" {
			tx.Rollback()
			return fiber.NewError(fiber.StatusBadRequest, "product.id is required for each cart item")
		}
		if item.Quantity <= 0 {
			tx.Rollback()
			return fiber.NewError(fiber.StatusBadRequest, "quantity must be greater than 0")
		}

		var product models.Product
		if err := tx.First(&product, "id = ?", productID).Error; err != nil {
			tx.Rollback()
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fiber.NewError(fiber.StatusNotFound, fmt.Sprintf("product %s not found", productID))
			}
			return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch product")
		}

		if product.Stock < item.Quantity {
			tx.Rollback()
			return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("insufficient stock for %s", product.Name))
		}

		product.Stock -= item.Quantity
		if err := tx.Save(&product).Error; err != nil {
			tx.Rollback()
			return fiber.NewError(fiber.StatusInternalServerError, "failed to update stock")
		}

		preparedItems = append(preparedItems, models.CartItem{
			Product:  product,
			Quantity: item.Quantity,
		})
		total += product.Price * int64(item.Quantity)
	}

	order := models.Order{
		ID:       generateID("ORD"),
		Customer: payload.Customer,
		Email:    payload.Email,
		Total:    total,
		Status:   models.OrderStatusPending,
		Date:     time.Now().UTC(),
		Address:  payload.Address,
	}
	if err := order.SetItems(preparedItems); err != nil {
		tx.Rollback()
		return fiber.NewError(fiber.StatusInternalServerError, "failed to encode order items")
	}

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create order")
	}

	_ = createAuditLog(tx, models.AuditLog{
		Action:   "New Order Placed",
		Category: models.AuditCategoryOrder,
		User:     payload.Email,
		Details:  fmt.Sprintf("New order %s placed by %s - $%d", order.ID, payload.Customer, total),
		Severity: models.AuditSeverityInfo,
	})

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return fiber.NewError(fiber.StatusInternalServerError, "failed to commit order")
	}

	response, err := order.ToResponse()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to decode order response")
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

func (h *OrderHandler) UpdateStatus(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return fiber.NewError(fiber.StatusBadRequest, "invalid order id")
	}

	var payload updateOrderStatusRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if !models.IsValidOrderStatus(payload.Status) {
		return fiber.NewError(fiber.StatusBadRequest, "invalid status")
	}

	tx := h.db.Begin()
	if tx.Error != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to start transaction")
	}

	var order models.Order
	if err := tx.First(&order, "id = ?", id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "order not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch order")
	}

	previous := order.Status
	order.Status = payload.Status
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		return fiber.NewError(fiber.StatusInternalServerError, "failed to update order status")
	}

	user := strings.TrimSpace(payload.User)
	if user == "" {
		user = "admin@maison.co"
	}
	severity := models.AuditSeverityInfo
	if payload.Status == models.OrderStatusCancelled {
		severity = models.AuditSeverityWarning
	}

	_ = createAuditLog(tx, models.AuditLog{
		Action:   "Order Status Changed",
		Category: models.AuditCategoryOrder,
		User:     user,
		Details:  fmt.Sprintf("Order %s status changed from '%s' to '%s'", order.ID, previous, order.Status),
		Severity: severity,
	})

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return fiber.NewError(fiber.StatusInternalServerError, "failed to commit status update")
	}

	response, err := order.ToResponse()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to decode order response")
	}

	return c.JSON(response)
}
