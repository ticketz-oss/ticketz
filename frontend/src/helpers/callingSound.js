export class CallingSound {
  constructor(region = 'na') {
    this.audioCtx = null;
    this.intervalId = null;

    // Set parameters based on region
    if (region === 'na') {
      this.toneDuration = 2.0;    // 2 seconds tone
      this.silenceDuration = 4.0; // 4 seconds silence
    } else if (region === 'kr') {
      this.toneDuration = 1.0;    // 1 second tone
      this.silenceDuration = 2.0; // 2 seconds silence
    } else {
      this.toneDuration = 2.0;
      this.silenceDuration = 4.0;
    }
    this.period = this.toneDuration + this.silenceDuration;
  }

  _playTone() {
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);

    // Create two oscillators for 440 Hz and 480 Hz
    const osc1 = this.audioCtx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 440;

    const osc2 = this.audioCtx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 480;

    // Connect oscillators to gain node and to destination
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);

    // Start both oscillators and stop after the tone duration
    osc1.start();
    osc2.start();
    osc1.stop(this.audioCtx.currentTime + this.toneDuration);
    osc2.stop(this.audioCtx.currentTime + this.toneDuration);
  }

  start() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Play tone immediately and then at each period (tone + silence)
    this._playTone();
    this.intervalId = setInterval(() => {
      this._playTone();
    }, this.period * 1000);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.intervalId = null;
  }
}
