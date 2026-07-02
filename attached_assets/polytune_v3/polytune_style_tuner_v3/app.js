const startBtn = document.getElementById('startBtn');
const needle = document.getElementById('needle');
const noteName = document.getElementById('noteName');
const targetName = document.getElementById('targetName');
const cents = document.getElementById('cents');
const frequency = document.getElementById('frequency');
const statusText = document.getElementById('status');
const strings = [...document.querySelectorAll('.string')];

let audioContext;
let analyser;
let source;
let tuner;
let buffer;

startBtn.addEventListener('click', async () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      }
    });

    source = audioContext.createMediaStreamSource(stream);

    // Extra input conditioning. High-pass removes room rumble; low-pass cuts hiss.
    const highPass = audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 65;
    highPass.Q.value = 0.707;

    const lowPass = audioContext.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 1800;
    lowPass.Q.value = 0.707;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0;

    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(analyser);

    buffer = new Float32Array(analyser.fftSize);
    tuner = new StableGuitarTuner({
      attackRejectMs: 90,
      analysisWindowMs: 360,
      minRms: 0.0045,
      minConfidence: 0.48,
      centerLockCents: 2,
      displaySmoothing: 0.20,
      maxAcceptedCents: 70,
      calibrationA4: 440
    });

    startBtn.textContent = 'Tuner Running';
    startBtn.disabled = true;
    tick();
  } catch (err) {
    statusText.textContent = 'Microphone permission was blocked or unavailable.';
    console.error(err);
  }
});

function tick() {
  analyser.getFloatTimeDomainData(buffer);
  const result = tuner.process(buffer, audioContext.sampleRate);
  updateUi(result);
  requestAnimationFrame(tick);
}

function updateUi(result) {
  strings.forEach(s => s.classList.remove('active'));

  if (!result.active) {
    statusText.textContent = 'Play one open string…';
    needle.style.transform = `translateX(-50%) rotate(0deg)`;
    noteName.textContent = '--';
    cents.textContent = '0 cents';
    frequency.textContent = '-- Hz';
    targetName.textContent = 'Standard guitar';
    return;
  }

  if (result.visualStringId) activateString(result.visualStringId);

  if (result.settling) {
    statusText.textContent = 'Settling after pick attack…';
    return;
  }

  if (!result.stable) {
    statusText.textContent = `Locking to guitar string… confidence ${(result.confidence * 100).toFixed(0)}%`;
    return;
  }

  activateString(result.stringId);

  const shownCents = Math.max(-50, Math.min(50, result.displayCents));
  needle.style.transform = `translateX(-50%) rotate(${shownCents * 0.9}deg)`;

  noteName.textContent = result.noteName;
  targetName.textContent = `${result.stringLabel} target: ${result.targetFrequency.toFixed(2)} Hz`;
  cents.textContent = `${result.cents > 0 ? '+' : ''}${result.cents} cents`;
  frequency.textContent = `${result.frequency.toFixed(2)} Hz`;

  noteName.className = 'note';
  if (Math.abs(result.cents) <= 2) {
    statusText.textContent = 'IN TUNE';
    noteName.classList.add('in-tune');
    needle.style.background = '#59ffb4';
  } else if (result.cents < 0) {
    statusText.textContent = 'FLAT — tune up';
    noteName.classList.add('flat');
    needle.style.background = '#ffd86a';
  } else {
    statusText.textContent = 'SHARP — tune down';
    noteName.classList.add('sharp');
    needle.style.background = '#ffd86a';
  }
}

function activateString(stringId) {
  document.querySelector(`[data-note="${stringId}"]`)?.classList.add('active');
}
