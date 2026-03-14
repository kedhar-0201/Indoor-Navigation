let audioUnlocked = false;

// Call this on first user tap to unlock audio context
export function unlockAudio() {
  if (audioUnlocked) return;
  const utterance = new SpeechSynthesisUtterance('');
  window.speechSynthesis.speak(utterance);
  audioUnlocked = true;
}

function getVoices() {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length) { resolve(voices); return; }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}
export function playSOSBuzzer() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  
  const beep = (startTime, duration) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  // Three urgent beeps
  beep(ctx.currentTime, 0.3);
  beep(ctx.currentTime + 0.4, 0.3);
  beep(ctx.currentTime + 0.8, 0.6);
}


export async function speak(text, onEnd = null) {
  if (!text) return;
  window.speechSynthesis.cancel();

  // Small delay to let cancel() settle
  await new Promise((r) => setTimeout(r, 100));

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = await getVoices();
  const preferred =
    voices.find((v) => v.lang === 'en-US' && v.name.includes('Samantha')) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices[0];

  if (preferred) utterance.voice = preferred;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis.cancel();
}

export function startListening(onResult, onError = null) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError('Use Chrome browser for voice support.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  recognition.continuous = false;

  recognition.onresult = (e) => {
    onResult(e.results[0][0].transcript.toLowerCase().trim());
  };
  recognition.onerror = (e) => {
    if (onError) onError(e.error);
  };

  recognition.start();
  return recognition;
}

export function vibrate(pattern = [200]) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

export const vibratePatterns = {
  arrival: [300, 100, 300],
  turnLeft: [100, 50, 100],
  turnRight: [200],
  warning: [500],
  success: [100, 50, 100, 50, 100],
};

export function startPedometer(onStep) {
  let stepCount = 0;
  let lastPeak = false;
  let magnitudeBuffer = [];
  const bufferSize = 5;
  const threshold = 11;
  const minStepInterval = 300;
  let lastStepTime = 0;

  const handleMotion = (event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null) return;

    const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    
    magnitudeBuffer.push(magnitude);
    if (magnitudeBuffer.length > bufferSize) magnitudeBuffer.shift();
    
    const avg = magnitudeBuffer.reduce((a, b) => a + b, 0) / magnitudeBuffer.length;
    const now = Date.now();
    
    // Peak detection — step happens when we cross threshold going up then down
    if (avg > threshold && !lastPeak && (now - lastStepTime) > minStepInterval) {
      lastPeak = true;
      stepCount++;
      lastStepTime = now;
      onStep(stepCount);
    } else if (avg < threshold - 2) {
      lastPeak = false;
    }
  };

  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then((response) => {
        if (response === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener('devicemotion', handleMotion);
  }

  return () => window.removeEventListener('devicemotion', handleMotion);
}