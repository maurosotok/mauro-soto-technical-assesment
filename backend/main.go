package main

import (
	"errors"
	"log"
	"net/http"
)

func main() {
	config := loadServerConfig()
	handler := newHTTPHandler(Calculator{}, config.AllowedOrigin)
	server := newServer(config, handler)

	log.Printf("backend listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
