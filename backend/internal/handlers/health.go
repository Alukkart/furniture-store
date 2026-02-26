package handlers

import "github.com/gofiber/fiber/v2"

// Health responds with service status.
// @Summary Health check
// @Tags health
// @Success 200 {object} map[string]string
// @Router /health [get]
func Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
	})
}
