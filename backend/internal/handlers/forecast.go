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

func NewForecastHandler(db *gorm.DB) *ForecastHandler {
	return &ForecastHandler{service: services.NewForecastService(repositories.NewForecastRepository(db), services.DefaultModelPath())}
}

func (h *ForecastHandler) Train(c *fiber.Ctx) error {
	artifact, err := h.service.TrainAndSave()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"trained_at": artifact.TrainedAt, "mae": artifact.MAE, "rmse": artifact.RMSE, "models": len(artifact.Models)})
}

func (h *ForecastHandler) Forecast(c *fiber.Ctx) error {
	period := 3
	if raw := c.Query("period"); raw != "" {
		if p, err := strconv.Atoi(raw); err == nil {
			period = p
		}
	}
	response, err := h.service.Forecast(period)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(response)
}
