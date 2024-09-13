export class RecordOggOpus {
  constructor() {
    this.recorder = null;
    this.stream = null;
    this.chunks = [];
    this.mediaRecorder = null;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (event) => {
      this.chunks.push(event.data);
    };
    this.mediaRecorder.start();
  }

  async stop() {
    return new Promise((resolve) => {
      this.mediaRecorder.addEventListener('stop', () => {
        this.stream.getTracks().forEach(track => track.stop());
        resolve();
      });
      this.mediaRecorder.stop();
    });
  }

  async export() {
    await this.stop();
    return new Blob(this.chunks, { type: 'audio/webm; codecs=opus' });
  }
  
}
