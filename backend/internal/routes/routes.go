package routes

import (
	"backend/internal/handlers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
	"gorm.io/gorm"
)

func Register(app *fiber.App, db *gorm.DB) {
	app.Get("/swagger/*", swagger.HandlerDefault)

	api := app.Group("/api")
	api.Get("/health", handlers.Health)

	productHandler := handlers.NewProductHandler(db)
	api.Get("/products", productHandler.List)
	api.Post("/products", productHandler.Create)
	api.Get("/products/:id", productHandler.Get)
	api.Put("/products/:id", productHandler.Update)
	api.Delete("/products/:id", productHandler.Delete)
}
