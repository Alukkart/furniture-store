package routes

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

const (
	HeaderAdminEmail = "X-Admin-Email"
	HeaderAdminRole  = "X-Admin-Role"
)

func RequireRoles(roles ...string) fiber.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[strings.ToLower(strings.TrimSpace(role))] = struct{}{}
	}

	return func(c *fiber.Ctx) error {
		email := strings.TrimSpace(c.Get(HeaderAdminEmail))
		role := strings.TrimSpace(c.Get(HeaderAdminRole))

		if email == "" || role == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "admin authentication required")
		}

		if _, ok := allowed[strings.ToLower(role)]; !ok {
			return fiber.NewError(fiber.StatusForbidden, "insufficient role")
		}

		c.Locals("adminEmail", email)
		c.Locals("adminRole", role)
		return c.Next()
	}
}
