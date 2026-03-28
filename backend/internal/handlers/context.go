package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

func currentAdminEmail(c *fiber.Ctx, fallback string) string {
	if value, ok := c.Locals("adminEmail").(string); ok {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}

	return fallback
}
