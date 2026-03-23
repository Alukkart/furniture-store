package middleware

import (
	"strings"

	"backend/internal/models"
	"backend/internal/security"

	"github.com/gofiber/fiber/v2"
)

const LocalsClaimsKey = "claims"

func RequireAuth(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := strings.TrimSpace(c.Get("Authorization"))
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			return fiber.NewError(fiber.StatusUnauthorized, "missing bearer token")
		}
		token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		claims, err := security.ParseToken(secret, token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid token")
		}
		c.Locals(LocalsClaimsKey, claims)
		return c.Next()
	}
}

func RequireRoles(roles ...models.RoleName) fiber.Handler {
	allowed := map[models.RoleName]struct{}{}
	for _, role := range roles {
		allowed[role] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		claims, ok := c.Locals(LocalsClaimsKey).(security.Claims)
		if !ok {
			return fiber.NewError(fiber.StatusUnauthorized, "missing auth context")
		}
		if _, exists := allowed[claims.Role]; !exists {
			return fiber.NewError(fiber.StatusForbidden, "insufficient permissions")
		}
		return c.Next()
	}
}

func ClaimsFromCtx(c *fiber.Ctx) (security.Claims, bool) {
	claims, ok := c.Locals(LocalsClaimsKey).(security.Claims)
	return claims, ok
}
