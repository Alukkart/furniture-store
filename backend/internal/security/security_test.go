package security

import (
	"testing"
	"time"

	"backend/internal/models"
)

func TestHashPasswordDeterministic(t *testing.T) {
	h1 := HashPassword("pass123", "salt")
	h2 := HashPassword("pass123", "salt")
	if h1 != h2 {
		t.Fatalf("expected same hash, got %s vs %s", h1, h2)
	}
}

func TestVerifyPassword(t *testing.T) {
	h := HashPassword("pass123", "salt")
	if !VerifyPassword("pass123", h, "salt") {
		t.Fatalf("expected password to verify")
	}
	if VerifyPassword("wrong", h, "salt") {
		t.Fatalf("expected wrong password to fail")
	}
}

func TestSignAndParseToken(t *testing.T) {
	claims := Claims{UserID: "u1", Email: "a@b.c", Role: models.RoleAdmin, Exp: time.Now().Add(1 * time.Hour).Unix()}
	token, err := SignToken("secret", claims)
	if err != nil {
		t.Fatalf("sign failed: %v", err)
	}
	parsed, err := ParseToken("secret", token)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}
	if parsed.UserID != claims.UserID || parsed.Role != claims.Role {
		t.Fatalf("claims mismatch")
	}
}

func TestExpiredToken(t *testing.T) {
	claims := Claims{UserID: "u1", Email: "a@b.c", Role: models.RoleAdmin, Exp: time.Now().Add(-1 * time.Hour).Unix()}
	token, err := SignToken("secret", claims)
	if err != nil {
		t.Fatalf("sign failed: %v", err)
	}
	if _, err := ParseToken("secret", token); err == nil {
		t.Fatalf("expected expired token error")
	}
}
