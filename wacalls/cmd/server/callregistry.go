package main

import (
	"sync"

	"wacalls/internal/voip/call"
)

type activeCall struct {
	cm     *call.CallManager
	bridge *Bridge

	mu       sync.RWMutex
	recorder *callRecorder
}

func (a *activeCall) startRecorder(sessionID, callID string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.recorder != nil {
		return nil
	}
	recorder, err := newCallRecorder(sessionID, callID)
	if err != nil {
		return err
	}
	a.recorder = recorder
	return nil
}

func (a *activeCall) stopRecorder(remove bool) {
	a.mu.Lock()
	recorder := a.recorder
	a.recorder = nil
	a.mu.Unlock()
	if recorder != nil {
		recorder.close()
		if remove {
			removeCallRecording(recorder.sessionID, recorder.callID)
		}
	}
}

func (a *activeCall) writeAgentPCM(pcm []float32) {
	a.mu.RLock()
	recorder := a.recorder
	a.mu.RUnlock()
	if recorder != nil {
		recorder.writeAgent(pcm)
	}
}

func (a *activeCall) writeCustomerPCM(pcm []float32) {
	a.mu.RLock()
	recorder := a.recorder
	a.mu.RUnlock()
	if recorder != nil {
		recorder.writeCustomer(pcm)
	}
}

type callRegistry struct {
	mu    sync.Mutex
	calls map[string]*activeCall
}

func newCallRegistry() *callRegistry {
	return &callRegistry{calls: map[string]*activeCall{}}
}

func (r *callRegistry) add(callID string, ac *activeCall) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.calls[callID] = ac
}

func (r *callRegistry) get(callID string) (*activeCall, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	ac, ok := r.calls[callID]
	return ac, ok
}

func (r *callRegistry) remove(callID string) (*activeCall, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	ac, ok := r.calls[callID]
	if !ok {
		return nil, false
	}
	delete(r.calls, callID)
	return ac, true
}

func (r *callRegistry) count() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.calls)
}

func (r *callRegistry) setBridge(callID string, b *Bridge) (*Bridge, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	ac, ok := r.calls[callID]
	if !ok {
		return nil, false
	}
	oldB := ac.bridge
	ac.bridge = b
	return oldB, true
}

func (r *callRegistry) drain() []*activeCall {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]*activeCall, 0, len(r.calls))
	for _, ac := range r.calls {
		out = append(out, ac)
	}
	r.calls = map[string]*activeCall{}
	return out
}
