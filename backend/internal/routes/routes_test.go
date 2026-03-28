package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"backend/internal/ai"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestApp(t *testing.T) (*fiber.App, *gorm.DB) {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&models.Product{}, &models.Order{}, &models.AuditLog{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	product := models.Product{
		ID:          "p-test",
		Name:        "Test Chair",
		Category:    "Living Room",
		Price:       100,
		Image:       "/images/test.jpg",
		Description: "Test product",
		Dimensions:  "10x10x10",
		Material:    "Wood",
		Stock:       5,
		SKU:         "SKU-TEST",
		Rating:      4.5,
		Reviews:     10,
	}
	if err := db.Create(&product).Error; err != nil {
		t.Fatalf("seed product: %v", err)
	}

	order := models.Order{
		ID:       "ORD-test",
		Customer: "Jane Doe",
		Email:    "jane@example.com",
		Total:    100,
		Status:   models.OrderStatusPending,
		Address:  "Test Address",
	}
	if err := order.SetItems([]models.CartItem{{Product: product, Quantity: 1}}); err != nil {
		t.Fatalf("encode order items: %v", err)
	}
	if err := db.Create(&order).Error; err != nil {
		t.Fatalf("seed order: %v", err)
	}

	app := fiber.New()
	forecastService, err := ai.NewService(db, filepath.Join(t.TempDir(), "model.json"), filepath.Join(t.TempDir(), "dataset.csv"))
	if err != nil {
		t.Fatalf("init forecast service: %v", err)
	}
	Register(app, db, forecastService)
	return app, db
}

func performJSONRequest(t *testing.T, app *fiber.App, method, path string, payload any, headers map[string]string) *http.Response {
	t.Helper()

	var body bytes.Buffer
	if payload != nil {
		if err := json.NewEncoder(&body).Encode(payload); err != nil {
			t.Fatalf("encode payload: %v", err)
		}
	}

	req := httptest.NewRequest(method, path, &body)
	req.Header.Set("Content-Type", "application/json")
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("perform request: %v", err)
	}

	return resp
}

func TestLoginCreatesAuditLog(t *testing.T) {
	app, db := setupTestApp(t)

	resp := performJSONRequest(t, app, http.MethodPost, "/api/auth/login", map[string]string{
		"email":    "admin@maison.co",
		"password": "admin123",
	}, nil)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var count int64
	if err := db.Model(&models.AuditLog{}).Where("action = ?", "User Login").Count(&count).Error; err != nil {
		t.Fatalf("count audit logs: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 login audit log, got %d", count)
	}
}

func TestProductCreateRequiresAdministratorRole(t *testing.T) {
	app, _ := setupTestApp(t)

	payload := map[string]any{
		"id":          "p-admin",
		"name":        "Admin Product",
		"category":    "Living Room",
		"price":       120,
		"image":       "/images/admin.jpg",
		"description": "Created by admin",
		"dimensions":  "10x10x10",
		"material":    "Oak",
		"stock":       3,
		"sku":         "SKU-ADMIN",
		"featured":    false,
		"rating":      4.0,
		"reviews":     0,
	}

	resp := performJSONRequest(t, app, http.MethodPost, "/api/products", payload, nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401 without admin headers, got %d", resp.StatusCode)
	}

	resp = performJSONRequest(t, app, http.MethodPost, "/api/products", payload, map[string]string{
		HeaderAdminEmail: "manager@maison.co",
		HeaderAdminRole:  "Manager",
	})
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 for manager role, got %d", resp.StatusCode)
	}

	resp = performJSONRequest(t, app, http.MethodPost, "/api/products", payload, map[string]string{
		HeaderAdminEmail: "admin@maison.co",
		HeaderAdminRole:  "Administrator",
	})
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 for administrator role, got %d", resp.StatusCode)
	}
}

func TestCreateOrderRollsBackOnInsufficientStock(t *testing.T) {
	app, db := setupTestApp(t)

	resp := performJSONRequest(t, app, http.MethodPost, "/api/orders", map[string]any{
		"customer": "John Doe",
		"email":    "john@example.com",
		"address":  "Main Street",
		"items": []map[string]any{
			{
				"product":  map[string]any{"id": "p-test"},
				"quantity": 10,
			},
		},
	}, nil)

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400 for insufficient stock, got %d", resp.StatusCode)
	}

	var product models.Product
	if err := db.First(&product, "id = ?", "p-test").Error; err != nil {
		t.Fatalf("fetch product: %v", err)
	}
	if product.Stock != 5 {
		t.Fatalf("expected stock rollback to preserve 5 items, got %d", product.Stock)
	}
}

func TestManagerCanUpdateOrderStatus(t *testing.T) {
	app, db := setupTestApp(t)

	resp := performJSONRequest(t, app, http.MethodPatch, "/api/orders/ORD-test/status", map[string]any{
		"status": "shipped",
	}, map[string]string{
		HeaderAdminEmail: "manager@maison.co",
		HeaderAdminRole:  "Manager",
	})

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 for manager order update, got %d", resp.StatusCode)
	}

	var order models.Order
	if err := db.First(&order, "id = ?", "ORD-test").Error; err != nil {
		t.Fatalf("fetch order: %v", err)
	}
	if order.Status != models.OrderStatusShipped {
		t.Fatalf("expected order status shipped, got %s", order.Status)
	}

	var count int64
	if err := db.Model(&models.AuditLog{}).Where("action = ?", "Order Status Changed").Count(&count).Error; err != nil {
		t.Fatalf("count audit logs: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 order status audit log, got %d", count)
	}
}

func TestManagerCanUpdateOrderDetails(t *testing.T) {
	app, db := setupTestApp(t)

	resp := performJSONRequest(t, app, http.MethodPut, "/api/orders/ORD-test", map[string]any{
		"customer": "Jane Manager",
		"email":    "manager@example.com",
		"address":  "Updated Address",
		"status":   "processing",
		"date":     "2026-03-24T10:00:00Z",
		"items": []map[string]any{
			{
				"product":  map[string]any{"id": "p-test"},
				"quantity": 2,
			},
		},
	}, map[string]string{
		HeaderAdminEmail: "manager@maison.co",
		HeaderAdminRole:  "Manager",
	})

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 for manager order update, got %d", resp.StatusCode)
	}

	var order models.Order
	if err := db.First(&order, "id = ?", "ORD-test").Error; err != nil {
		t.Fatalf("fetch order: %v", err)
	}
	if order.Customer != "Jane Manager" {
		t.Fatalf("expected updated customer, got %s", order.Customer)
	}
	if order.Status != models.OrderStatusProcessing {
		t.Fatalf("expected order status processing, got %s", order.Status)
	}
	if order.Total != 200 {
		t.Fatalf("expected recalculated total 200, got %d", order.Total)
	}

	var product models.Product
	if err := db.First(&product, "id = ?", "p-test").Error; err != nil {
		t.Fatalf("fetch product: %v", err)
	}
	if product.Stock != 4 {
		t.Fatalf("expected stock 4 after order update, got %d", product.Stock)
	}
}

func TestForecastRequiresAdminRole(t *testing.T) {
	app, _ := setupTestApp(t)

	resp := performJSONRequest(t, app, http.MethodGet, "/api/forecast?days=30", nil, nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401 without headers, got %d", resp.StatusCode)
	}

	resp = performJSONRequest(t, app, http.MethodGet, "/api/forecast?days=30", nil, map[string]string{
		HeaderAdminEmail: "manager@maison.co",
		HeaderAdminRole:  "Manager",
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 for manager role, got %d", resp.StatusCode)
	}
}
