package routes

import (
	"backend/internal/handlers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/swagger"
	"gorm.io/gorm"
)

func Register(app *fiber.App, db *gorm.DB) {
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	app.Get("/swagger/*", swagger.HandlerDefault)

	api := app.Group("/api")
	api.Get("/health", handlers.Health)

	authHandler := handlers.NewAuthHandler(db)
	api.Post("/auth/login", authHandler.Login)

	productHandler := handlers.NewProductHandler(db)
	api.Get("/products", productHandler.List)
	api.Post("/products", productHandler.Create)
	api.Get("/products/:id", productHandler.Get)
	api.Put("/products/:id", productHandler.Update)
	api.Delete("/products/:id", productHandler.Delete)

	orderHandler := handlers.NewOrderHandler(db)
	api.Get("/orders", orderHandler.List)
	api.Post("/orders", orderHandler.Create)
	api.Patch("/orders/:id/status", orderHandler.UpdateStatus)

	auditLogHandler := handlers.NewAuditLogHandler(db)
	api.Get("/audit-logs", auditLogHandler.List)
	api.Post("/audit-logs", auditLogHandler.Create)
}
