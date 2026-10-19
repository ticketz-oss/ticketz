package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestInternalSecurityRequiresTokenForAPI(t *testing.T) {
	token := "01234567890123456789012345678901"
	handler := withInternalSecurity(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}), token, "")

	unauthorized := httptest.NewRecorder()
	handler.ServeHTTP(unauthorized, httptest.NewRequest(http.MethodGet, "/api/sessions", nil))
	if unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without internal token, got %d", unauthorized.Code)
	}

	authorizedRequest := httptest.NewRequest(http.MethodGet, "/api/sessions", nil)
	authorizedRequest.Header.Set("X-Internal-Token", token)
	authorized := httptest.NewRecorder()
	handler.ServeHTTP(authorized, authorizedRequest)
	if authorized.Code != http.StatusNoContent {
		t.Fatalf("expected authorized request to reach handler, got %d", authorized.Code)
	}
}

func TestInternalSecurityRejectsBrowserOrigins(t *testing.T) {
	handler := withInternalSecurity(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}), "01234567890123456789012345678901", "")
	request := httptest.NewRequest(http.MethodGet, "/api/sessions", nil)
	request.Header.Set("Origin", "https://espacowhats.com.br")
	request.Header.Set("X-Internal-Token", "01234567890123456789012345678901")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("expected browser origin to be rejected, got %d", response.Code)
	}
}

func TestHealthCheckDoesNotExposeAPIOrRequireToken(t *testing.T) {
	handler := withInternalSecurity(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), "01234567890123456789012345678901", "")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/healthz", nil))

	if response.Code != http.StatusOK {
		t.Fatalf("expected health check to remain available, got %d", response.Code)
	}
}
