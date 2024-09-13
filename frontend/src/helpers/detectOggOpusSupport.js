export function canPlayOggOpus() {
  if (canRecordOggOpus()) {
    // If it can record, it can play
    return true;
  }
  const audio = document.createElement('audio');

  // Check if the browser can play Ogg Vorbis audio
  const canPlay = audio.canPlayType('audio/ogg; codecs="opus"');

  console.debug("canPlay", canPlay, "for audio/ogg; codecs=opus");

  // Return true if the result is "probably", otherwise false
  return canPlay === 'probably'
}

export function canRecordOggOpus() {
  // Check if MediaRecorder is supported
  if (typeof MediaRecorder === 'undefined') {
    return false;
  }

  // Check if Ogg Opus is supported as a recording format
  const isTypeSupported = MediaRecorder.isTypeSupported('audio/ogg; codecs=opus');

  console.debug("isTypeSupported", isTypeSupported, "for recording audio/ogg; codecs");

  return isTypeSupported;
}