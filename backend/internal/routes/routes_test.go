package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

const testSecret = "test-secret"

func setupTestApp(t *testing.T) (*fiber.App, *gorm.DB) {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	if err := database.ConnectSeedOnlyForTests(db, config.Config{}); err != nil {
		t.Fatalf("seed database: %v", err)
	}

	modelPath := t.TempDir() + "/forecast_model.json"
	t.Setenv("AI_MODEL_PATH", modelPath)
	t.Setenv("APP_SECRET", testSecret)

	app := fiber.New()
	Register(app, db, testSecret)
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

func loginAndGetToken(t *testing.T, app *fiber.App, email, password string) string {
	t.Helper()

	resp := performJSONRequest(t, app, http.MethodPost, "/api/auth/login", map[string]string{
		"email":    email,
		"password": password,
	}, nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected successful login, got %d", resp.StatusCode)
	}

	var payload struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode login payload: %v", err)
	}
	if payload.Token == "" {
		t.Fatalf("expected bearer token in login response")
	}
	return payload.Token
}

func TestLoginCreatesAuditLog(t *testing.T) {
	app, db := setupTestApp(t)

	resp := performJSONRequest(t, app, http.MethodPost, "/api/auth/login", map[string]string{
		"email":    "admin@mebel-dom.ru",
		"password": "admin123",
	}, nil)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var count int64
	if err := db.Model(&models.AuditLog{}).Where("action = ?", "User Login").Count(&count).Error; err != nil {
		t.Fatalf("count audit logs: %v", err)
	}
	if count == 0 {
		t.Fatalf("expected login audit log to be created")
	}
}

func TestTokenEndpointReturnsOAuthPayload(t *testing.T) {
	app, _ := setupTestApp(t)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/token", bytes.NewBufferString("username=admin%40mebel-dom.ru&password=admin123&grant_type=password"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("perform token request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var payload struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		ExpiresIn   int64  `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode token payload: %v", err)
	}
	if payload.AccessToken == "" {
		t.Fatalf("expected access token")
	}
	if payload.TokenType != "Bearer" {
		t.Fatalf("expected Bearer token type, got %s", payload.TokenType)
	}
	if payload.ExpiresIn <= 0 {
		t.Fatalf("expected positive expires_in, got %d", payload.ExpiresIn)
	}
}

func TestProductCreateRequiresAuthentication(t *testing.T) {
	app, _ := setupTestApp(t)
	managerToken := loginAndGetToken(t, app, "manager@mebel-dom.ru", "manager123")

	payload := map[string]any{
		"id":          "p-admin",
		"name":        "Admin Product",
		"category":    "Гостиная",
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
		t.Fatalf("expected 401 without token, got %d", resp.StatusCode)
	}

	resp = performJSONRequest(t, app, http.MethodPost, "/api/products", payload, map[string]string{
		"Authorization": "Bearer " + managerToken,
	})
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 for authenticated manager, got %d", resp.StatusCode)
	}
}

func TestCreateOrderRollsBackOnInsufficientStock(t *testing.T) {
	app, db := setupTestApp(t)
	productID := mustFindProductIDBySKU(t, db, "SOF-HVNS-BEI")

	resp := performJSONRequest(t, app, http.MethodPost, "/api/orders", map[string]any{
		"customer": "John Doe",
		"email":    "john@example.com",
		"address":  "Main Street",
		"items": []map[string]any{
			{
				"product":  map[string]any{"id": productID},
				"quantity": 100,
			},
		},
	}, nil)

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400 for insufficient stock, got %d", resp.StatusCode)
	}

	var product models.Product
	if err := db.First(&product, "id = ?", productID).Error; err != nil {
		t.Fatalf("fetch product: %v", err)
	}
	if product.StockQty != 12 {
		t.Fatalf("expected stock rollback to preserve 12 items, got %d", product.StockQty)
	}
}

func TestManagerCanUpdateOrderStatus(t *testing.T) {
	app, db := setupTestApp(t)
	managerToken := loginAndGetToken(t, app, "manager@mebel-dom.ru", "manager123")
	orderID := mustFindOrderIDByAddress(t, db, "г. Екатеринбург, ул. Малышева, д. 18, кв. 24")

	resp := performJSONRequest(t, app, http.MethodPatch, "/api/orders/"+orderID+"/status", map[string]any{
		"status": "shipped",
	}, map[string]string{
		"Authorization": "Bearer " + managerToken,
	})

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 for manager order update, got %d", resp.StatusCode)
	}

	var order models.Order
	if err := db.First(&order, "id = ?", orderID).Error; err != nil {
		t.Fatalf("fetch order: %v", err)
	}

	var status models.OrderStatusRef
	if err := db.First(&status, "id = ?", order.StatusID).Error; err != nil {
		t.Fatalf("fetch order status: %v", err)
	}
	if status.Code != string(models.OrderStatusShipped) {
		t.Fatalf("expected order status shipped, got %s", status.Code)
	}
}

func TestForecastRequiresAuthentication(t *testing.T) {
	app, _ := setupTestApp(t)
	managerToken := loginAndGetToken(t, app, "manager@mebel-dom.ru", "manager123")

	resp := performJSONRequest(t, app, http.MethodGet, "/api/forecast?months=3", nil, nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401 without token, got %d", resp.StatusCode)
	}

	resp = performJSONRequest(t, app, http.MethodGet, "/api/forecast?months=3", nil, map[string]string{
		"Authorization": "Bearer " + managerToken,
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 for manager role, got %d", resp.StatusCode)
	}
}

func TestLoginRejectsInvalidCredentials(t *testing.T) {
	app, _ := setupTestApp(t)

	resp := performJSONRequest(t, app, http.MethodPost, "/api/auth/login", map[string]string{
		"email":    "admin@mebel-dom.ru",
		"password": "wrong-password",
	}, nil)

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestManagerCannotDeleteProduct(t *testing.T) {
	app, db := setupTestApp(t)
	managerToken := loginAndGetToken(t, app, "manager@mebel-dom.ru", "manager123")
	productID := mustFindProductIDBySKU(t, db, "SOF-HVNS-BEI")

	resp := performJSONRequest(t, app, http.MethodDelete, "/api/products/"+productID, nil, map[string]string{
		"Authorization": "Bearer " + managerToken,
	})

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", resp.StatusCode)
	}
}

func TestCreateOrderSuccess(t *testing.T) {
	app, db := setupTestApp(t)
	productID := mustFindProductIDBySKU(t, db, "SOF-HVNS-BEI")

	resp := performJSONRequest(t, app, http.MethodPost, "/api/orders", map[string]any{
		"customer": "Jane Doe",
		"email":    "jane@example.com",
		"address":  "Ocean Avenue",
		"items": []map[string]any{
			{
				"product":  map[string]any{"id": productID},
				"quantity": 1,
			},
		},
	}, nil)

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 201, got %d: %s", resp.StatusCode, string(body))
	}

	var product models.Product
	if err := db.First(&product, "id = ?", productID).Error; err != nil {
		t.Fatalf("fetch product: %v", err)
	}
	if product.StockQty != 11 {
		t.Fatalf("expected stock to decrease to 11, got %d", product.StockQty)
	}
}

func TestForecastAccessibleByExecutive(t *testing.T) {
	app, _ := setupTestApp(t)
	executiveToken := loginAndGetToken(t, app, "executive@mebel-dom.ru", "executive123")

	resp := performJSONRequest(t, app, http.MethodGet, "/api/forecast?months=3", nil, map[string]string{
		"Authorization": "Bearer " + executiveToken,
	})

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestNonAdminCannotBlockUser(t *testing.T) {
	app, db := setupTestApp(t)
	managerToken := loginAndGetToken(t, app, "manager@mebel-dom.ru", "manager123")
	userID := mustFindUserIDByEmail(t, db, "warehouse@mebel-dom.ru")

	resp := performJSONRequest(t, app, http.MethodPatch, "/api/users/"+userID+"/block", map[string]any{
		"is_blocked": true,
	}, map[string]string{
		"Authorization": "Bearer " + managerToken,
	})

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", resp.StatusCode)
	}
}

func TestClientCanSignupAndViewOwnOrders(t *testing.T) {
	app, db := setupTestApp(t)
	productID := mustFindProductIDBySKU(t, db, "CHR-ARIA-TER")

	signupResp := performJSONRequest(t, app, http.MethodPost, "/api/auth/signup", map[string]string{
		"email":    "client@example.com",
		"password": "client123",
		"name":     "Client User",
	}, nil)
	if signupResp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(signupResp.Body)
		t.Fatalf("expected 201 signup, got %d: %s", signupResp.StatusCode, string(body))
	}

	token := loginAndGetToken(t, app, "client@example.com", "client123")

	orderResp := performJSONRequest(t, app, http.MethodPost, "/api/orders", map[string]any{
		"customer": "Client User",
		"email":    "client@example.com",
		"address":  "Client Street",
		"items": []map[string]any{
			{
				"product":  map[string]any{"id": productID},
				"quantity": 1,
			},
		},
	}, nil)
	if orderResp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(orderResp.Body)
		t.Fatalf("expected 201 order, got %d: %s", orderResp.StatusCode, string(body))
	}

	mineResp := performJSONRequest(t, app, http.MethodGet, "/api/orders/my", nil, map[string]string{
		"Authorization": "Bearer " + token,
	})
	if mineResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(mineResp.Body)
		t.Fatalf("expected 200 for own orders, got %d: %s", mineResp.StatusCode, string(body))
	}

	var orders []models.OrderResponse
	if err := json.NewDecoder(mineResp.Body).Decode(&orders); err != nil {
		t.Fatalf("decode orders: %v", err)
	}
	if len(orders) != 1 {
		t.Fatalf("expected 1 own order, got %d", len(orders))
	}
	if orders[0].Email != "client@example.com" {
		t.Fatalf("expected client order email, got %s", orders[0].Email)
	}
}

func mustFindProductIDBySKU(t *testing.T, db *gorm.DB, sku string) string {
	t.Helper()

	var product models.Product
	if err := db.Where("sku = ?", sku).First(&product).Error; err != nil {
		t.Fatalf("find product by sku %s: %v", sku, err)
	}

	return product.ID
}

func mustFindOrderIDByAddress(t *testing.T, db *gorm.DB, address string) string {
	t.Helper()

	var order models.Order
	if err := db.Where("address = ?", address).First(&order).Error; err != nil {
		t.Fatalf("find order by address %s: %v", address, err)
	}

	return order.ID
}

func mustFindUserIDByEmail(t *testing.T, db *gorm.DB, email string) string {
	t.Helper()

	var user models.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		t.Fatalf("find user by email %s: %v", email, err)
	}

	return user.ID
}
