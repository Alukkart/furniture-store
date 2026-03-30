package handlers

import (
	"strconv"

	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ForecastHandler struct {
	service *services.ForecastService
}

func NewForecastHandler(db *gorm.DB, modelPath string) *ForecastHandler {
	return &ForecastHandler{
		service: services.NewForecastService(repositories.NewForecastRepository(db), modelPath),
	}
}

// Forecast returns replenishment forecast by category.
// @Summary Get forecast
// @Tags ai
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Param months query int false "Planning horizon in months" default(3)
// @Success 200 {object} services.ForecastResponse
// @Failure 400 {object} handlers.errorResponse
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 500 {object} handlers.errorResponse
// @Router /forecast [get]
func (h *ForecastHandler) Forecast(c *fiber.Ctx) error {
	months := 3
	if raw := c.Query("months"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			return fiber.NewError(fiber.StatusBadRequest, "months must be a positive integer")
		}
		months = parsed
	}

	forecast, err := h.service.Forecast(months)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate forecast")
	}

	return c.JSON(forecast)
}

// Train retrains and saves the forecast model.
// @Summary Train forecast model
// @Tags ai
// @Produce json
// @Security BearerAuth
// @Security OAuth2Password
// @Success 200 {object} ai.ModelArtifact
// @Failure 401 {object} handlers.errorResponse
// @Failure 403 {object} handlers.errorResponse
// @Failure 500 {object} handlers.errorResponse
// @Router /forecast/train [post]
func (h *ForecastHandler) Train(c *fiber.Ctx) error {
	artifact, err := h.service.TrainAndSave()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to train forecast model")
	}
	return c.JSON(artifact)
}
