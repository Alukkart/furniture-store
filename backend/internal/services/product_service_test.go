package services

import (
	"testing"

	"backend/internal/models"
)

func TestValidateProductPayloadRequiredFields(t *testing.T) {
	p := &models.Product{}
	if err := validateProductPayload(p); err == nil {
		t.Fatalf("expected error for empty payload")
	}
}

func TestValidateProductPayloadRangeChecks(t *testing.T) {
	orig := int64(50)
	p := &models.Product{
		Name: "Desk", Category: "Office", Image: "img", SKU: "sku", Price: 100, Stock: 1, Rating: 4, Reviews: 1, OriginalPrice: &orig,
	}
	if err := validateProductPayload(p); err == nil {
		t.Fatalf("expected originalPrice validation error")
	}
}
