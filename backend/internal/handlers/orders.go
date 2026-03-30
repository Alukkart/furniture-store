package handlers

import (
	"fmt"
	"strings"
	"time"

	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type OrderHandler struct {
	service      *services.OrderService
	auditService *services.AuditService
}

func NewOrderHandler(db *gorm.DB) *OrderHandler {
	return &OrderHandler{
		service:      services.NewOrderService(repositories.NewOrderRepository(db)),
		auditService: services.NewAuditService(repositories.NewAuditRepository(db)),
	}
}

type createOrderRequest struct {
	Customer string            `json:"customer"`
	Email    string            `json:"email"`
	Address  string            `json:"address"`
	Items    []models.CartItem `json:"items"`
}

type updateOrderStatusRequest struct {
	Status models.OrderState `json:"status"`
	User   string            `json:"user"`
}

type updateOrderRequest struct {
	Customer string            `json:"customer"`
	Email    string            `json:"email"`
	Address  string            `json:"address"`
	Date     string            `json:"date"`
	Status   models.OrderState `json:"status"`
	Items    []models.CartItem `json:"items"`
	User     string            `json:"user"`
}

// List returns orders.
// @Summary List orders
// @Tags orders
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Success 200 {array} models.OrderResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 500 {object} handlers.errorResponse
// @Router /orders [get]
func (h *OrderHandler) List(c *fiber.Ctx) error {
	orders, err := h.service.List()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch orders")
	}
	return c.JSON(orders)
}

// ListMine returns orders of the authenticated client.
// @Summary List current client orders
// @Tags orders
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Success 200 {array} models.OrderResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 500 {object} handlers.errorResponse
// @Router /orders/my [get]
func (h *OrderHandler) ListMine(c *fiber.Ctx) error {
	claims, ok := middleware.ClaimsFromCtx(c)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	orders, err := h.service.ListByCustomerEmail(claims.Email)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch client orders")
	}
	return c.JSON(orders)
}

// Create places a new order.
// @Summary Create order
// @Tags orders
// @Accept json
// @Produce json
// @Param payload body createOrderRequest true "Order payload"
// @Success 201 {object} models.OrderResponse
// @Failure 400 {object} handlers.errorResponse
// @Router /orders [post]
func (h *OrderHandler) Create(c *fiber.Ctx) error {
	var payload createOrderRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	order, err := h.service.Create(services.CreateOrderInput{
		Customer: payload.Customer,
		Email:    payload.Email,
		Address:  payload.Address,
		Items:    payload.Items,
	})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	_ = h.audit("New Order Placed", models.AuditCategoryOrder, payload.Email, fmt.Sprintf("Order %s created", order.ID), models.AuditSeverityInfo, "order", order.ID, "ok")
	return c.Status(fiber.StatusCreated).JSON(order)
}

// UpdateStatus updates only the order status.
// @Summary Update order status
// @Tags orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param id path string true "Order ID"
// @Param payload body updateOrderStatusRequest true "Status payload"
// @Success 200 {object} models.OrderResponse
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Router /orders/{id}/status [patch]
func (h *OrderHandler) UpdateStatus(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	var payload updateOrderStatusRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	updated, prev, err := h.service.UpdateStatus(id, payload.Status)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	claims, _ := middleware.ClaimsFromCtx(c)
	user := strings.TrimSpace(payload.User)
	if user == "" {
		user = claims.Email
	}
	severity := models.AuditSeverityInfo
	if payload.Status == models.OrderStatusCancelled {
		severity = models.AuditSeverityWarning
	}
	_ = h.audit("Order Status Changed", models.AuditCategoryOrder, user, fmt.Sprintf("Order %s status changed from '%s' to '%s'", updated.ID, prev, payload.Status), severity, "order", updated.ID, "ok")
	return c.JSON(updated)
}

// Update updates an order and its items.
// @Summary Update order
// @Tags orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param id path string true "Order ID"
// @Param payload body updateOrderRequest true "Order payload"
// @Success 200 {object} models.OrderResponse
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Router /orders/{id} [put]
func (h *OrderHandler) Update(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	var payload updateOrderRequest
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	date, err := time.Parse(time.RFC3339, payload.Date)
	if payload.Date == "" || err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid date")
	}

	updated, prev, err := h.service.Update(id, services.UpdateOrderInput{
		Customer: payload.Customer,
		Email:    payload.Email,
		Address:  payload.Address,
		Date:     date,
		Status:   payload.Status,
		Items:    payload.Items,
	})
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	claims, _ := middleware.ClaimsFromCtx(c)
	user := strings.TrimSpace(payload.User)
	if user == "" {
		user = claims.Email
	}
	_ = h.audit("Order Updated", models.AuditCategoryOrder, user, fmt.Sprintf("Order %s updated from '%s' to '%s'", updated.ID, prev, updated.Status), models.AuditSeverityInfo, "order", updated.ID, "ok")
	return c.JSON(updated)
}

func (h *OrderHandler) audit(action string, category models.AuditCategory, user, details string, severity models.AuditSeverity, entity, entityID, result string) error {
	_, err := h.auditService.Create(models.AuditLog{Action: action, Category: category, User: user, Details: details, Severity: severity, Entity: entity, EntityID: entityID, Result: result})
	return err
}
