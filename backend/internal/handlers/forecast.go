package handlers

import (
	"strconv"

	"backend/internal/ai"

	"github.com/gofiber/fiber/v2"
)

type ForecastHandler struct {
	service *ai.Service
}

func NewForecastHandler(service *ai.Service) *ForecastHandler {
	return &ForecastHandler{service: service}
}

// Forecast returns demand forecast for products and categories.
// @Summary Forecast demand
// @Tags ai
// @Produce json
// @Security ApiKeyAuth
// @Param days query int false "Forecast horizon in days" default(30)
// @Success 200 {object} ai.ForecastResponse
// @Failure 400 {object} errorResponse
// @Failure 401 {object} errorResponse
// @Failure 403 {object} errorResponse
// @Failure 500 {object} errorResponse
// @Router /forecast [get]
func (h *ForecastHandler) Forecast(c *fiber.Ctx) error {
	days := 30
	if raw := c.Query("days"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			return fiber.NewError(fiber.StatusBadRequest, "days must be a positive integer")
		}
		days = parsed
	}

	forecast, err := h.service.Forecast(days)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate forecast")
	}

	return c.JSON(forecast)
}
