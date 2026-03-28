package ai

import (
	"os"
	"path/filepath"
	"testing"

	"backend/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAIService(t *testing.T) (*Service, string, string) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&models.Product{}, &models.Order{}, &models.AuditLog{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	products := []models.Product{
		{ID: "p1", Name: "Sofa", Category: "Living Room", Price: 2100, Image: "/sofa.jpg", Description: "d", Dimensions: "1", Material: "m", Stock: 12, SKU: "SOFA", Featured: true, Rating: 4.8, Reviews: 10},
		{ID: "p2", Name: "Desk", Category: "Home Office", Price: 650, Image: "/desk.jpg", Description: "d", Dimensions: "1", Material: "m", Stock: 20, SKU: "DESK", Featured: false, Rating: 4.6, Reviews: 5},
	}
	if err := db.Create(&products).Error; err != nil {
		t.Fatalf("seed products: %v", err)
	}

	order := models.Order{
		ID:       "ORD-1",
		Customer: "Jane",
		Email:    "jane@example.com",
		Total:    2750,
		Status:   models.OrderStatusDelivered,
		Address:  "Street",
	}
	if err := order.SetItems([]models.CartItem{
		{Product: products[0], Quantity: 1},
		{Product: products[1], Quantity: 1},
	}); err != nil {
		t.Fatalf("encode order items: %v", err)
	}
	if err := db.Create(&order).Error; err != nil {
		t.Fatalf("seed order: %v", err)
	}

	dir := t.TempDir()
	modelPath := filepath.Join(dir, "model.json")
	datasetPath := filepath.Join(dir, "dataset.csv")

	service, err := NewService(db, modelPath, datasetPath)
	if err != nil {
		t.Fatalf("new service: %v", err)
	}

	return service, modelPath, datasetPath
}

func TestServiceForecastCreatesArtifacts(t *testing.T) {
	service, modelPath, datasetPath := setupAIService(t)

	forecast, err := service.Forecast(30)
	if err != nil {
		t.Fatalf("forecast: %v", err)
	}

	if forecast.PlanningDays != 30 {
		t.Fatalf("expected planning period 30, got %d", forecast.PlanningDays)
	}
	if len(forecast.ShipmentForecasts) != 2 {
		t.Fatalf("expected 2 shipment forecasts, got %d", len(forecast.ShipmentForecasts))
	}
	if forecast.Metrics.ETAMAE <= 0 || forecast.Metrics.ETARMSE <= 0 {
		t.Fatalf("expected positive metrics, got %+v", forecast.Metrics)
	}
	if forecast.ShipmentForecasts[0].EstimatedTransitDays <= 0 {
		t.Fatalf("expected positive transit days, got %+v", forecast.ShipmentForecasts[0])
	}
	if forecast.ShipmentForecasts[0].DelayRiskLabel == "" {
		t.Fatalf("expected delay risk label")
	}
	if _, err := os.Stat(modelPath); err != nil {
		t.Fatalf("expected model artifact: %v", err)
	}
	if _, err := os.Stat(datasetPath); err != nil {
		t.Fatalf("expected dataset artifact: %v", err)
	}
}

func TestServiceLoadsSavedModel(t *testing.T) {
	service, modelPath, datasetPath := setupAIService(t)
	first, err := service.Forecast(14)
	if err != nil {
		t.Fatalf("first forecast: %v", err)
	}

	reloaded, err := NewService(service.db, modelPath, datasetPath)
	if err != nil {
		t.Fatalf("reload service: %v", err)
	}

	second, err := reloaded.Forecast(14)
	if err != nil {
		t.Fatalf("second forecast: %v", err)
	}

	if len(first.ShipmentForecasts) != len(second.ShipmentForecasts) {
		t.Fatalf("forecast size mismatch: %d vs %d", len(first.ShipmentForecasts), len(second.ShipmentForecasts))
	}
	if first.ShipmentForecasts[0].EstimatedTransitDays != second.ShipmentForecasts[0].EstimatedTransitDays {
		t.Fatalf("expected persisted model to reproduce forecast, got %d vs %d", first.ShipmentForecasts[0].EstimatedTransitDays, second.ShipmentForecasts[0].EstimatedTransitDays)
	}
}
