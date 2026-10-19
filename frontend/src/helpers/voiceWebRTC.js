import api from "../services/api";

const float32ToInt16LE = values => {
  const buffer = new ArrayBuffer(values.length * 2);
  const view = new DataView(buffer);
  for (let index = 0; index < values.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, values[index]));
    view.setInt16(
      index * 2,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    );
  }
  return buffer;
};

const int16LEToFloat32 = buffer => {
  const view = new DataView(buffer);
  const values = new Float32Array(buffer.byteLength / 2);
  for (let index = 0; index < values.length; index += 1) {
    values[index] = view.getInt16(index * 2, true) / 0x8000;
  }
  return values;
};

const waitForIceGathering = pc =>
  new Promise(resolve => {
    if (pc.iceGatheringState === "complete") {
      resolve();
      return;
    }
    const timeout = setTimeout(resolve, 10000);
    const listener = () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timeout);
        pc.removeEventListener("icegatheringstatechange", listener);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", listener);
  });

export const openVoiceWebRTC = async (callId, mediaToken) => {
  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const pc = new RTCPeerConnection({ iceServers: [] });
  const dataChannel = pc.createDataChannel("pcm", { ordered: true });
  dataChannel.binaryType = "arraybuffer";
  const audioContext = new AudioContext({ sampleRate: 16000 });

  try {
    await audioContext.audioWorklet.addModule("/voice/capture-processor.js");
    await audioContext.audioWorklet.addModule("/voice/playback-processor.js");
    await audioContext.resume();

    const micSource = audioContext.createMediaStreamSource(micStream);
    const captureNode = new AudioWorkletNode(
      audioContext,
      "voice-capture-processor"
    );
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    captureNode.port.onmessage = event => {
      if (dataChannel.readyState === "open") {
        dataChannel.send(float32ToInt16LE(event.data));
      }
    };
    micSource.connect(captureNode);
    captureNode.connect(silentGain).connect(audioContext.destination);

    const playbackNode = new AudioWorkletNode(
      audioContext,
      "voice-playback-processor"
    );
    playbackNode.connect(audioContext.destination);
    dataChannel.onmessage = event => {
      playbackNode.port.postMessage(int16LEToFloat32(event.data));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGathering(pc);
    const { data } = await api.post(
      `/voice/calls/${callId}/webrtc`,
      { sdp_offer: pc.localDescription.sdp },
      { headers: { "X-Voice-Token": mediaToken } }
    );
    await pc.setRemoteDescription({ type: "answer", sdp: data.sdp_answer });

    return {
      setMuted: muted => {
        micStream.getAudioTracks().forEach(track => {
          track.enabled = !muted;
        });
      },
      close: () => {
        micStream.getTracks().forEach(track => track.stop());
        dataChannel.close();
        pc.close();
        audioContext.close().catch(() => {});
      }
    };
  } catch (error) {
    micStream.getTracks().forEach(track => track.stop());
    pc.close();
    audioContext.close().catch(() => {});
    throw error;
  }
};
