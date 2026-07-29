package main

import (
	"encoding/json"
	"errors"
	"io"
	"math"
	"net/http"
)

const maxRequestBodyBytes = 64 << 10

type calculationService interface {
	Calculate(operation Operation, left, right float64) (float64, error)
}

type api struct {
	calculator calculationService
}

type calculateRequest struct {
	Left     json.RawMessage `json:"left"`
	Operator json.RawMessage `json:"operator"`
	Right    json.RawMessage `json:"right"`
}

type calculateResponse struct {
	Result float64 `json:"result"`
}

type errorResponse struct {
	Error errorDetail `json:"error"`
}

type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type requestError struct {
	status  int
	code    string
	message string
}

func newHTTPHandler(calculator calculationService, allowedOrigin string) http.Handler {
	api := api{calculator: calculator}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", api.health)
	mux.HandleFunc("/api/v1/calculate", api.calculate)
	return withCORS(allowedOrigin, mux)
}

func (a api) health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w, http.MethodGet)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (a api) calculate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w, http.MethodPost)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	request, requestErr := decodeCalculateRequest(r.Body)
	if requestErr != nil {
		writeError(w, requestErr.status, requestErr.code, requestErr.message)
		return
	}

	operation, requestErr := parseOperation(request.Operator)
	if requestErr != nil {
		writeError(w, requestErr.status, requestErr.code, requestErr.message)
		return
	}
	left, requestErr := parseOperand("left", request.Left)
	if requestErr != nil {
		writeError(w, requestErr.status, requestErr.code, requestErr.message)
		return
	}
	right, requestErr := parseOperand("right", request.Right)
	if requestErr != nil {
		writeError(w, requestErr.status, requestErr.code, requestErr.message)
		return
	}

	result, err := a.calculator.Calculate(operation, left, right)
	switch {
	case errors.Is(err, ErrUnsupportedOperation):
		writeError(w, http.StatusUnprocessableEntity, "unsupported_operation", "operator must be one of: add, subtract, multiply, divide")
	case errors.Is(err, ErrNonFiniteOperand):
		writeError(w, http.StatusUnprocessableEntity, "invalid_operand", "operands must be finite numbers")
	case errors.Is(err, ErrDivisionByZero):
		writeError(w, http.StatusUnprocessableEntity, "division_by_zero", "right operand must not be zero when dividing")
	case errors.Is(err, ErrNonFiniteResult):
		writeError(w, http.StatusUnprocessableEntity, "non_finite_result", "calculation result is not finite")
	case err != nil:
		writeError(w, http.StatusInternalServerError, "internal_error", "calculation failed")
	default:
		writeJSON(w, http.StatusOK, calculateResponse{Result: result})
	}
}

func decodeCalculateRequest(body io.Reader) (calculateRequest, *requestError) {
	var request *calculateRequest
	decoder := json.NewDecoder(body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&request); err != nil {
		code := "invalid_request"
		message := "request body must be a JSON object with left, operator, and right fields"
		if errors.Is(err, io.EOF) {
			code = "malformed_json"
			message = "request body must not be empty"
		} else if errors.Is(err, io.ErrUnexpectedEOF) {
			code = "malformed_json"
			message = "request body contains malformed JSON"
		} else {
			var syntaxError *json.SyntaxError
			if errors.As(err, &syntaxError) {
				code = "malformed_json"
				message = "request body contains malformed JSON"
			}
		}
		return calculateRequest{}, &requestError{status: http.StatusBadRequest, code: code, message: message}
	}
	if request == nil {
		return calculateRequest{}, &requestError{
			status:  http.StatusBadRequest,
			code:    "invalid_request",
			message: "request body must be a JSON object with left, operator, and right fields",
		}
	}

	var trailing json.RawMessage
	if err := decoder.Decode(&trailing); !errors.Is(err, io.EOF) {
		return calculateRequest{}, &requestError{
			status:  http.StatusBadRequest,
			code:    "trailing_input",
			message: "request body must contain exactly one JSON object",
		}
	}
	return *request, nil
}

func parseOperation(raw json.RawMessage) (Operation, *requestError) {
	if len(raw) == 0 {
		return "", &requestError{
			status:  http.StatusUnprocessableEntity,
			code:    "missing_operation",
			message: "operator is required",
		}
	}

	var operation string
	if err := json.Unmarshal(raw, &operation); err != nil || operation == "" {
		return "", &requestError{
			status:  http.StatusUnprocessableEntity,
			code:    "invalid_operation",
			message: "operator must be a non-empty string",
		}
	}
	return Operation(operation), nil
}

func parseOperand(name string, raw json.RawMessage) (float64, *requestError) {
	if len(raw) == 0 {
		return 0, &requestError{
			status:  http.StatusUnprocessableEntity,
			code:    "missing_operand",
			message: name + " operand is required",
		}
	}

	var value *float64
	if err := json.Unmarshal(raw, &value); err != nil || value == nil || math.IsNaN(*value) || math.IsInf(*value, 0) {
		return 0, &requestError{
			status:  http.StatusUnprocessableEntity,
			code:    "invalid_operand",
			message: name + " operand must be a finite number",
		}
	}
	return *value, nil
}

func writeMethodNotAllowed(w http.ResponseWriter, allowedMethod string) {
	w.Header().Set("Allow", allowedMethod)
	writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method must be "+allowedMethod)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorResponse{Error: errorDetail{Code: code, Message: message}})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func withCORS(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if allowedOrigin != "" && r.Header.Get("Origin") == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Add("Vary", "Origin")
			if r.Method == http.MethodOptions {
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
