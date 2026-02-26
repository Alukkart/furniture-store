package main

import (
	"log"

	_ "backend/docs"
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/routes"

	"github.com/gofiber/fiber/v2"
)

// @title Furniture Store API
// @version 1.0
// @description API for a furniture store backend.
// @host localhost:8080
// @BasePath /api
func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName: "furniture-store",
	})

	routes.Register(app, db)

	log.Printf("listening on %s", cfg.AppAddress())
	if err := app.Listen(cfg.AppAddress()); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
