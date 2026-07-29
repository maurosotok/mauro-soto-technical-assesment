package main

import (
	"net/http"
	"testing"
	"time"
)

func TestLoadServerConfig(t *testing.T) {
	tests := []struct {
		name              string
		port              string
		origin            string
		wantPort          string
		wantAllowedOrigin string
	}{
		{name: "safe local defaults", wantPort: defaultPort, wantAllowedOrigin: defaultAllowedOrigin},
		{name: "environment overrides", port: "9090", origin: "https://calculator.example", wantPort: "9090", wantAllowedOrigin: "https://calculator.example"},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Setenv("PORT", test.port)
			t.Setenv("ALLOWED_ORIGIN", test.origin)

			got := loadServerConfig()
			if got.Port != test.wantPort {
				t.Errorf("Port = %q, want %q", got.Port, test.wantPort)
			}
			if got.AllowedOrigin != test.wantAllowedOrigin {
				t.Errorf("AllowedOrigin = %q, want %q", got.AllowedOrigin, test.wantAllowedOrigin)
			}
		})
	}
}

func TestNewServer(t *testing.T) {
	t.Parallel()

	handler := http.NewServeMux()
	server := newServer(serverConfig{Port: "9090"}, handler)

	if server.Addr != ":9090" {
		t.Errorf("Addr = %q, want :9090", server.Addr)
	}
	if server.Handler != handler {
		t.Error("Handler was not preserved")
	}
	if server.ReadHeaderTimeout != 5*time.Second {
		t.Errorf("ReadHeaderTimeout = %v, want 5s", server.ReadHeaderTimeout)
	}
}
