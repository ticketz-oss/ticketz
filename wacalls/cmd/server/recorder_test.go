package main

import (
	"encoding/binary"
	"net/http/httptest"
	"testing"
)

func TestRecorderProducesSeparatedAndStereoWAV(t *testing.T) {
	t.Setenv("WACALLS_RECORDING_DIR", t.TempDir())
	recorder, err := newCallRecorder("session-1", "call-1")
	if err != nil {
		t.Fatal(err)
	}
	recorder.writeAgent([]float32{0.5, -0.5})
	recorder.writeCustomer([]float32{0.25, -0.25})
	recorder.close()

	mono := httptest.NewRecorder()
	if err = serveCallRecording(mono, httptest.NewRequest("GET", "/", nil), "session-1", "call-1", "agent"); err != nil {
		t.Fatal(err)
	}
	if mono.Body.Len() < 48 || string(mono.Body.Bytes()[:4]) != "RIFF" {
		t.Fatalf("invalid mono wav: %d bytes", mono.Body.Len())
	}
	if got := binary.LittleEndian.Uint16(mono.Body.Bytes()[22:24]); got != 1 {
		t.Fatalf("mono channels = %d", got)
	}

	mixed := httptest.NewRecorder()
	if err = serveCallRecording(mixed, httptest.NewRequest("GET", "/", nil), "session-1", "call-1", "mixed"); err != nil {
		t.Fatal(err)
	}
	if got := binary.LittleEndian.Uint16(mixed.Body.Bytes()[22:24]); got != 2 {
		t.Fatalf("mixed channels = %d", got)
	}
	if got := mixed.Body.Len(); got < 52 {
		t.Fatalf("stereo wav too short: %d", got)
	}
}

func TestRecorderSupportsBoundedTranscriptionSegments(t *testing.T) {
	t.Setenv("WACALLS_RECORDING_DIR", t.TempDir())
	recorder, err := newCallRecorder("session-2", "call-2")
	if err != nil {
		t.Fatal(err)
	}
	recorder.writeAgent(make([]float32, recordingSampleRate*2))
	recorder.close()

	request := httptest.NewRequest("GET", "/?offset_ms=500&duration_ms=1000", nil)
	response := httptest.NewRecorder()
	if err = serveCallRecording(response, request, "session-2", "call-2", "agent"); err != nil {
		t.Fatal(err)
	}
	if got, want := response.Body.Len(), 44+recordingSampleRate*2; got != want {
		t.Fatalf("segment bytes = %d, want %d", got, want)
	}
}
