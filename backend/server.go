package main

import (
	"net/http"
	"os"
	"time"
)

const (
	defaultPort          = "8080"
	defaultAllowedOrigin = "http://localhost:5173"
)

type serverConfig struct {
	Port          string
	AllowedOrigin string
}

func loadServerConfig() serverConfig {
	return serverConfig{
		Port:          envOrDefault("PORT", defaultPort),
		AllowedOrigin: envOrDefault("ALLOWED_ORIGIN", defaultAllowedOrigin),
	}
}

func newServer(config serverConfig, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:              ":" + config.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
