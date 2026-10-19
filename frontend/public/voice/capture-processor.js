class VoiceCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frame = new Float32Array(960);
    this.offset = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length) {
      let sourceOffset = 0;
      while (sourceOffset < channel.length) {
        const count = Math.min(
          channel.length - sourceOffset,
          this.frame.length - this.offset
        );
        this.frame.set(
          channel.subarray(sourceOffset, sourceOffset + count),
          this.offset
        );
        this.offset += count;
        sourceOffset += count;
        if (this.offset === this.frame.length) {
          const completed = this.frame;
          this.port.postMessage(completed, [completed.buffer]);
          this.frame = new Float32Array(960);
          this.offset = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("voice-capture-processor", VoiceCaptureProcessor);
