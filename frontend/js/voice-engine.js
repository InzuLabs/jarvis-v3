function recognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function createVoiceController({ onState, onTranscript, onError }) {
  const Recognition = recognitionConstructor();
  let recognition = null;
  let speaking = false;

  const setState = state => onState?.(state);

  function startListening() {
    if (!Recognition) {
      onError?.('Speech recognition is not supported in this browser.');
      setState('IDLE');
      return false;
    }
    if (recognition) return false;
    recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setState('LISTENING');
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript || '')
        .join(' ')
        .trim();
      const finalResult = Array.from(event.results).some(result => result.isFinal);
      if (finalResult && transcript) onTranscript?.(transcript);
    };
    recognition.onerror = event => {
      const message = event.error === 'not-allowed'
        ? 'Microphone permission was denied. You can still use text input.'
        : `Speech recognition error: ${event.error}.`;
      onError?.(message);
      setState('IDLE');
    };
    recognition.onend = () => {
      recognition = null;
      if (!speaking) setState('IDLE');
    };
    try {
      recognition.start();
      return true;
    } catch (error) {
      recognition = null;
      onError?.('Microphone could not be started. Text input remains available.');
      setState('IDLE');
      return false;
    }
  }

  function stopListening() {
    recognition?.stop();
    recognition = null;
    if (!speaking) setState('IDLE');
  }

  function speak(text) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      onError?.('Read aloud is not supported in this browser.');
      return false;
    }
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.volume = 1;
    utterance.onstart = () => { speaking = true; setState('SPEAKING'); };
    utterance.onend = () => { speaking = false; setState('IDLE'); };
    utterance.onerror = () => { speaking = false; setState('IDLE'); onError?.('Speech playback could not be completed.'); };
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speaking = false;
    if (!recognition) setState('IDLE');
  }

  return {
    canListen: Boolean(Recognition),
    canSpeak: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
