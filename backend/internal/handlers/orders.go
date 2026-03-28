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

func (h *OrderHandler) List(c *fiber.Ctx) error {
	orders, err := h.service.List()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch orders")
	}
	return c.JSON(orders)
}

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

func (h *OrderHandler) audit(action string, category models.AuditCategory, user, details string, severity models.AuditSeverity, entity, entityID, result string) error {
	_, err := h.auditService.Create(models.AuditLog{Action: action, Category: category, User: user, Details: details, Severity: severity, Entity: entity, EntityID: entityID, Result: result})
	return err
}
