package security

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/models"
)

type Claims struct {
	UserID string          `json:"uid"`
	Email  string          `json:"email"`
	Role   models.RoleName `json:"role"`
	Exp    int64           `json:"exp"`
}

func HashPassword(password, salt string) string {
	hash := sha256.Sum256([]byte(salt + ":" + password))
	return hex.EncodeToString(hash[:])
}

func VerifyPassword(password, hash, salt string) bool {
	return HashPassword(password, salt) == hash
}

func SignToken(secret string, claims Claims) (string, error) {
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	payloadEnc := base64.RawURLEncoding.EncodeToString(payload)
	signature := sign(secret, payloadEnc)
	return payloadEnc + "." + signature, nil
}

func ParseToken(secret, token string) (Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return Claims{}, errors.New("invalid token format")
	}
	payloadEnc := parts[0]
	expected := sign(secret, payloadEnc)
	if !hmac.Equal([]byte(expected), []byte(parts[1])) {
		return Claims{}, errors.New("invalid token signature")
	}

	payload, err := base64.RawURLEncoding.DecodeString(payloadEnc)
	if err != nil {
		return Claims{}, fmt.Errorf("invalid token payload: %w", err)
	}

	var claims Claims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return Claims{}, fmt.Errorf("invalid token claims: %w", err)
	}

	if claims.Exp > 0 && time.Now().UTC().Unix() > claims.Exp {
		return Claims{}, errors.New("token expired")
	}
	return claims, nil
}

func sign(secret, payload string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
