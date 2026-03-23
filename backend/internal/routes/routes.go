package routes

import (
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/swagger"
	"gorm.io/gorm"
)

func Register(app *fiber.App, db *gorm.DB, appSecret string) {
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	app.Get("/swagger/*", swagger.HandlerDefault)

	api := app.Group("/api")
	api.Get("/health", handlers.Health)

	authHandler := handlers.NewAuthHandler(db, appSecret)
	api.Post("/auth/login", authHandler.Login)

	authenticated := api.Group("", middleware.RequireAuth(appSecret))
	authenticated.Get("/auth/me", authHandler.Me)
	authenticated.Post("/auth/register", middleware.RequireRoles(models.RoleAdmin), authHandler.Register)

	productHandler := handlers.NewProductHandler(db)
	api.Get("/products", productHandler.List)
	api.Get("/products/:id", productHandler.Get)
	authenticated.Post("/products", middleware.RequireRoles(models.RoleAdmin, models.RoleManager), productHandler.Create)
	authenticated.Put("/products/:id", middleware.RequireRoles(models.RoleAdmin, models.RoleManager), productHandler.Update)
	authenticated.Delete("/products/:id", middleware.RequireRoles(models.RoleAdmin), productHandler.Delete)

	orderHandler := handlers.NewOrderHandler(db)
	api.Post("/orders", orderHandler.Create)
	authenticated.Get("/orders", middleware.RequireRoles(models.RoleAdmin, models.RoleManager, models.RoleWarehouse, models.RoleExecutive), orderHandler.List)
	authenticated.Patch("/orders/:id/status", middleware.RequireRoles(models.RoleAdmin, models.RoleManager, models.RoleWarehouse), orderHandler.UpdateStatus)

	auditLogHandler := handlers.NewAuditLogHandler(db)
	authenticated.Get("/audit-logs", middleware.RequireRoles(models.RoleAdmin, models.RoleManager, models.RoleWarehouse, models.RoleExecutive), auditLogHandler.List)
	authenticated.Post("/audit-logs", middleware.RequireRoles(models.RoleAdmin, models.RoleManager), auditLogHandler.Create)

	userHandler := handlers.NewUserHandler(db, appSecret)
	authenticated.Get("/users", middleware.RequireRoles(models.RoleAdmin), userHandler.List)
	authenticated.Post("/users", middleware.RequireRoles(models.RoleAdmin), userHandler.Create)
	authenticated.Patch("/users/:id/block", middleware.RequireRoles(models.RoleAdmin), userHandler.SetBlocked)

	refHandler := handlers.NewReferenceHandler(db)
	api.Get("/categories", refHandler.ListCategories)
	authenticated.Post("/categories", middleware.RequireRoles(models.RoleAdmin, models.RoleManager), refHandler.CreateCategory)
	authenticated.Get("/customers", middleware.RequireRoles(models.RoleAdmin, models.RoleManager), refHandler.ListCustomers)
	authenticated.Post("/customers", middleware.RequireRoles(models.RoleAdmin, models.RoleManager), refHandler.CreateCustomer)

	forecastHandler := handlers.NewForecastHandler(db)
	authenticated.Post("/forecast/train", middleware.RequireRoles(models.RoleAdmin, models.RoleExecutive), forecastHandler.Train)
	authenticated.Get("/forecast", middleware.RequireRoles(models.RoleAdmin, models.RoleManager, models.RoleExecutive), forecastHandler.Forecast)
}
