package main

import (
	"crypto/sha256"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"
)

const recordingSampleRate = 16000

type pcmTrack struct {
	file    *os.File
	started bool
	buffer  []byte
}

type callRecorder struct {
	mu        sync.Mutex
	sessionID string
	callID    string
	startedAt time.Time
	agent     pcmTrack
	customer  pcmTrack
	closed    bool
}

func recordingPrefix(sessionID, callID string) string {
	sum := sha256.Sum256([]byte(sessionID + "\x00" + callID))
	return filepath.Join(recordingDir(), fmt.Sprintf("%x", sum[:16]))
}

func recordingDir() string {
	dir := os.Getenv("WACALLS_RECORDING_DIR")
	if dir == "" {
		dir = "/data/recordings"
	}
	return dir
}

func newCallRecorder(sessionID, callID string) (*callRecorder, error) {
	if err := os.MkdirAll(recordingDir(), 0700); err != nil {
		return nil, err
	}
	prefix := recordingPrefix(sessionID, callID)
	agent, err := os.OpenFile(prefix+".agent.pcm", os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0600)
	if err != nil {
		return nil, err
	}
	customer, err := os.OpenFile(prefix+".customer.pcm", os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0600)
	if err != nil {
		agent.Close()
		return nil, err
	}
	return &callRecorder{
		sessionID: sessionID,
		callID:    callID,
		startedAt: time.Now(),
		agent:     pcmTrack{file: agent},
		customer:  pcmTrack{file: customer},
	}, nil
}

func (r *callRecorder) write(track *pcmTrack, pcm []float32) {
	if len(pcm) == 0 {
		return
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.closed {
		return
	}
	if !track.started {
		paddingSamples := int(time.Since(r.startedAt).Seconds() * recordingSampleRate)
		if paddingSamples > 0 {
			_, _ = track.file.Write(make([]byte, paddingSamples*2))
		}
		track.started = true
	}
	needed := len(pcm) * 2
	if cap(track.buffer) < needed {
		track.buffer = make([]byte, needed)
	}
	buf := track.buffer[:needed]
	for i, sample := range pcm {
		if math.IsNaN(float64(sample)) {
			sample = 0
		}
		if sample > 1 {
			sample = 1
		} else if sample < -1 {
			sample = -1
		}
		binary.LittleEndian.PutUint16(buf[i*2:], uint16(int16(sample*32767)))
	}
	_, _ = track.file.Write(buf)
}

func (r *callRecorder) writeAgent(pcm []float32) {
	r.write(&r.agent, pcm)
}

func (r *callRecorder) writeCustomer(pcm []float32) {
	r.write(&r.customer, pcm)
}

func (r *callRecorder) close() {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.closed {
		return
	}
	r.closed = true
	_ = r.agent.file.Close()
	_ = r.customer.file.Close()
}

func removeCallRecording(sessionID, callID string) {
	prefix := recordingPrefix(sessionID, callID)
	_ = os.Remove(prefix + ".agent.pcm")
	_ = os.Remove(prefix + ".customer.pcm")
}

func writeWAVHeader(w io.Writer, dataBytes int64, channels uint16) error {
	byteRate := uint32(recordingSampleRate) * uint32(channels) * 2
	blockAlign := channels * 2
	header := make([]byte, 44)
	copy(header[0:4], "RIFF")
	binary.LittleEndian.PutUint32(header[4:8], uint32(36+dataBytes))
	copy(header[8:12], "WAVE")
	copy(header[12:16], "fmt ")
	binary.LittleEndian.PutUint32(header[16:20], 16)
	binary.LittleEndian.PutUint16(header[20:22], 1)
	binary.LittleEndian.PutUint16(header[22:24], channels)
	binary.LittleEndian.PutUint32(header[24:28], recordingSampleRate)
	binary.LittleEndian.PutUint32(header[28:32], byteRate)
	binary.LittleEndian.PutUint16(header[32:34], blockAlign)
	binary.LittleEndian.PutUint16(header[34:36], 16)
	copy(header[36:40], "data")
	binary.LittleEndian.PutUint32(header[40:44], uint32(dataBytes))
	_, err := w.Write(header)
	return err
}

func parseSegment(r *http.Request, size int64) (int64, int64) {
	offsetMS, _ := strconv.ParseInt(r.URL.Query().Get("offset_ms"), 10, 64)
	durationMS, _ := strconv.ParseInt(r.URL.Query().Get("duration_ms"), 10, 64)
	start := offsetMS * recordingSampleRate * 2 / 1000
	start -= start % 2
	if start < 0 || start > size {
		start = 0
	}
	length := size - start
	if durationMS > 0 {
		requested := durationMS * recordingSampleRate * 2 / 1000
		requested -= requested % 2
		if requested < length {
			length = requested
		}
	}
	return start, length
}

func serveMonoRecording(w http.ResponseWriter, r *http.Request, path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return err
	}
	start, length := parseSegment(r, info.Size())
	if _, err = f.Seek(start, io.SeekStart); err != nil {
		return err
	}
	w.Header().Set("Content-Type", "audio/wav")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Length", strconv.FormatInt(44+length, 10))
	if err = writeWAVHeader(w, length, 1); err != nil {
		return err
	}
	_, err = io.CopyN(w, f, length)
	return err
}

func serveMixedRecording(w http.ResponseWriter, agentPath, customerPath string) error {
	agent, err := os.Open(agentPath)
	if err != nil {
		return err
	}
	defer agent.Close()
	customer, err := os.Open(customerPath)
	if err != nil {
		return err
	}
	defer customer.Close()
	aInfo, _ := agent.Stat()
	cInfo, _ := customer.Stat()
	frames := max(aInfo.Size(), cInfo.Size()) / 2
	dataBytes := frames * 4
	w.Header().Set("Content-Type", "audio/wav")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Length", strconv.FormatInt(44+dataBytes, 10))
	if err = writeWAVHeader(w, dataBytes, 2); err != nil {
		return err
	}
	ab := make([]byte, 8192)
	cb := make([]byte, 8192)
	out := make([]byte, 16384)
	var written int64
	for written < frames {
		wantFrames := int64(len(ab) / 2)
		if frames-written < wantFrames {
			wantFrames = frames - written
		}
		clear(ab)
		clear(cb)
		_, _ = io.ReadFull(agent, ab[:wantFrames*2])
		_, _ = io.ReadFull(customer, cb[:wantFrames*2])
		for i := int64(0); i < wantFrames; i++ {
			copy(out[i*4:i*4+2], ab[i*2:i*2+2])
			copy(out[i*4+2:i*4+4], cb[i*2:i*2+2])
		}
		if _, err = w.Write(out[:wantFrames*4]); err != nil {
			return err
		}
		written += wantFrames
	}
	return nil
}

func serveCallRecording(w http.ResponseWriter, r *http.Request, sessionID, callID, track string) error {
	prefix := recordingPrefix(sessionID, callID)
	switch track {
	case "agent":
		return serveMonoRecording(w, r, prefix+".agent.pcm")
	case "customer":
		return serveMonoRecording(w, r, prefix+".customer.pcm")
	case "mixed":
		return serveMixedRecording(w, prefix+".agent.pcm", prefix+".customer.pcm")
	default:
		return errors.New("invalid recording track")
	}
}
