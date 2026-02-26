package config

import (
	"fmt"
	"os"
)

type Config struct {
	AppHost string
	AppPort string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
}

func Load() Config {
	return Config{
		AppHost: getenv("APP_HOST", "0.0.0.0"),
		AppPort: getenv("APP_PORT", "8080"),

		DBHost:     getenv("DB_HOST", "localhost"),
		DBPort:     getenv("DB_PORT", "5432"),
		DBUser:     getenv("DB_USER", "user"),
		DBPassword: getenv("DB_PASSWORD", "root"),

		DBName:    getenv("DB_NAME", "furniture"),
		DBSSLMode: getenv("DB_SSLMODE", "disable"),
	}
}

func (c Config) AppAddress() string {
	return fmt.Sprintf("%s:%s", c.AppHost, c.AppPort)
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
