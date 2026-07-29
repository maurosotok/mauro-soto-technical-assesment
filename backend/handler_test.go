package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	t.Parallel()

	handler := newHTTPHandler(Calculator{}, defaultAllowedOrigin)
	tests := []struct {
		name       string
		method     string
		wantStatus int
		wantCode   string
	}{
		{name: "success", method: http.MethodGet, wantStatus: http.StatusOK},
		{name: "wrong method", method: http.MethodPost, wantStatus: http.StatusMethodNotAllowed, wantCode: "method_not_allowed"},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			request := httptest.NewRequest(test.method, "/api/health", nil)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)

			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, test.wantStatus)
			}
			if test.wantCode != "" {
				assertErrorCode(t, response, test.wantCode)
			}
		})
	}
}

func TestCalculateHandlerSuccess(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		body string
		want float64
	}{
		{name: "adds decimals", body: `{"left":1.25,"operator":"add","right":2.5}`, want: 3.75},
		{name: "subtracts negative", body: `{"left":4,"operator":"subtract","right":-3}`, want: 7},
		{name: "multiplies negative", body: `{"left":-2.5,"operator":"multiply","right":4}`, want: -10},
		{name: "divides decimals", body: `{"left":7.5,"operator":"divide","right":2.5}`, want: 3},
		{name: "raises to a power", body: `{"left":2,"operator":"power","right":3}`, want: 8},
		{name: "calculates square root", body: `{"left":81,"operator":"square_root"}`, want: 9},
	}

	handler := newHTTPHandler(Calculator{}, defaultAllowedOrigin)
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			response := performCalculation(handler, http.MethodPost, test.body)
			if response.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d; body = %s", response.Code, http.StatusOK, response.Body.String())
			}

			var body calculateResponse
			if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if body.Result != test.want {
				t.Errorf("result = %v, want %v", body.Result, test.want)
			}
		})
	}
}

func TestCalculateHandlerRequestErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		method     string
		body       string
		wantStatus int
		wantCode   string
	}{
		{name: "wrong method", method: http.MethodGet, wantStatus: http.StatusMethodNotAllowed, wantCode: "method_not_allowed"},
		{name: "empty body", method: http.MethodPost, body: "", wantStatus: http.StatusBadRequest, wantCode: "malformed_json"},
		{name: "truncated JSON", method: http.MethodPost, body: `{"left":1`, wantStatus: http.StatusBadRequest, wantCode: "malformed_json"},
		{name: "malformed JSON", method: http.MethodPost, body: `{"left":1,}`, wantStatus: http.StatusBadRequest, wantCode: "malformed_json"},
		{name: "null request", method: http.MethodPost, body: `null`, wantStatus: http.StatusBadRequest, wantCode: "invalid_request"},
		{name: "non-object JSON", method: http.MethodPost, body: `[]`, wantStatus: http.StatusBadRequest, wantCode: "invalid_request"},
		{name: "unknown field", method: http.MethodPost, body: `{"left":1,"operator":"add","right":2,"extra":true}`, wantStatus: http.StatusBadRequest, wantCode: "invalid_request"},
		{name: "second JSON value", method: http.MethodPost, body: `{"left":1,"operator":"add","right":2} {}`, wantStatus: http.StatusBadRequest, wantCode: "trailing_input"},
		{name: "trailing garbage", method: http.MethodPost, body: `{"left":1,"operator":"add","right":2} nope`, wantStatus: http.StatusBadRequest, wantCode: "trailing_input"},
		{name: "missing operator", method: http.MethodPost, body: `{"left":1,"right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "missing_operation"},
		{name: "invalid operator type", method: http.MethodPost, body: `{"left":1,"operator":2,"right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "invalid_operation"},
		{name: "unsupported operator", method: http.MethodPost, body: `{"left":1,"operator":"modulo","right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "unsupported_operation"},
		{name: "missing left operand", method: http.MethodPost, body: `{"operator":"add","right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "missing_operand"},
		{name: "missing right operand", method: http.MethodPost, body: `{"left":1,"operator":"add"}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "missing_operand"},
		{name: "missing power exponent", method: http.MethodPost, body: `{"left":2,"operator":"power"}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "missing_operand"},
		{name: "unexpected square root right operand", method: http.MethodPost, body: `{"left":9,"operator":"square_root","right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "unexpected_operand"},
		{name: "null operand", method: http.MethodPost, body: `{"left":null,"operator":"add","right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "invalid_operand"},
		{name: "string operand", method: http.MethodPost, body: `{"left":"1","operator":"add","right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "invalid_operand"},
		{name: "non-finite operand", method: http.MethodPost, body: `{"left":1e400,"operator":"add","right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "invalid_operand"},
		{name: "division by zero", method: http.MethodPost, body: `{"left":1,"operator":"divide","right":0}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "division_by_zero"},
		{name: "negative square root", method: http.MethodPost, body: `{"left":-1,"operator":"square_root"}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "negative_square_root"},
		{name: "non-finite result", method: http.MethodPost, body: `{"left":1.7976931348623157e308,"operator":"multiply","right":2}`, wantStatus: http.StatusUnprocessableEntity, wantCode: "non_finite_result"},
	}

	handler := newHTTPHandler(Calculator{}, defaultAllowedOrigin)
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			response := performCalculation(handler, test.method, test.body)
			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d; body = %s", response.Code, test.wantStatus, response.Body.String())
			}
			assertErrorCode(t, response, test.wantCode)
			if got := response.Header().Get("Content-Type"); got != "application/json" {
				t.Errorf("Content-Type = %q, want application/json", got)
			}
		})
	}
}

func TestCalculateHandlerUnexpectedServiceError(t *testing.T) {
	t.Parallel()

	handler := newHTTPHandler(stubCalculator{err: errors.New("unexpected")}, defaultAllowedOrigin)
	response := performCalculation(handler, http.MethodPost, `{"left":1,"operator":"add","right":2}`)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusInternalServerError)
	}
	assertErrorCode(t, response, "internal_error")
}

func TestCORSMiddleware(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name            string
		method          string
		origin          string
		wantStatus      int
		wantAllowOrigin string
	}{
		{name: "allowed origin", method: http.MethodGet, origin: defaultAllowedOrigin, wantStatus: http.StatusOK, wantAllowOrigin: defaultAllowedOrigin},
		{name: "other origin", method: http.MethodGet, origin: "https://example.com", wantStatus: http.StatusOK},
		{name: "allowed preflight", method: http.MethodOptions, origin: defaultAllowedOrigin, wantStatus: http.StatusNoContent, wantAllowOrigin: defaultAllowedOrigin},
		{name: "other preflight", method: http.MethodOptions, origin: "https://example.com", wantStatus: http.StatusMethodNotAllowed},
	}

	handler := newHTTPHandler(Calculator{}, defaultAllowedOrigin)
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			request := httptest.NewRequest(test.method, "/api/health", nil)
			request.Header.Set("Origin", test.origin)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)

			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, test.wantStatus)
			}
			if got := response.Header().Get("Access-Control-Allow-Origin"); got != test.wantAllowOrigin {
				t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, test.wantAllowOrigin)
			}
		})
	}
}

func performCalculation(handler http.Handler, method, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, "/api/v1/calculate", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	return response
}

func assertErrorCode(t *testing.T, response *httptest.ResponseRecorder, want string) {
	t.Helper()

	var body errorResponse
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error response: %v", err)
	}
	if body.Error.Code != want {
		t.Errorf("error code = %q, want %q", body.Error.Code, want)
	}
}

type stubCalculator struct {
	result float64
	err    error
}

func (s stubCalculator) Calculate(Operation, float64, float64) (float64, error) {
	return s.result, s.err
}
