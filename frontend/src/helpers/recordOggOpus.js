import Recorder from "opus-recorder";

export class RecordOggOpus {
  constructor() {
    this.recorder = null;
    this.chunks = [];
    this.callback = null;
  }

  async start() {
    this.callback = null;
    this.chunks = [];
    this.recorder = new Recorder({
      encoderPath: '/opus-recorder/dist/encoderWorker.min.js',
      encoderSampleRate: 16000,
      originalSampleRateOverride: 16000,
    });

    this.recorder.ondataavailable = (typedArray) => {
      if (this.callback) {
        this.callback(new Blob([typedArray], { type: 'audio/ogg; codecs=opus' }));
      }
    };
    this.recorder.start().catch(function(e) {
      console.debug('Error encountered:', e.message);
    });
  }

  async stop() {
    this.recorder.stop();
  }

  async export(callback) {
    this.callback = callback;
    await this.stop();
  }
}
