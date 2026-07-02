/**
 * Self-contained HTML/JS tuner for a hidden WebView.
 *
 * Exposes three global functions (called via injectJavaScript):
 *   window.startTuner(config)   — begin mic capture + pitch detection
 *   window.stopTuner()          — stop detection (mic stream kept alive)
 *   window.updateConfig(config) — update strings/lockMode/lockedString/a4
 *
 * config shape:
 *   { strings: [{idx,label,midi}], lockMode:"auto"|"locked", lockedString:number, a4:number,
 *     profile?: { preGain:number, hpFreq:number, lpFreq:number, rmsGate:number, clarityMin:number } }
 *
 * Posts back via window.ReactNativeWebView.postMessage(JSON.stringify(msg)):
 *   {type:"ready"}
 *   {type:"pitch", cents, detectedFreq, targetFreq, activeString, rms, vibration}
 *   {type:"settling", visualIdx, rms}
 *   {type:"silence", rms}
 *   {type:"error", message}
 */

const JS = `
(function() {
  var gConfig = { strings: [], lockMode: 'auto', lockedString: 0, a4: 440 };
  var gActive = false;
  var gAudioCtx = null;
  var gAnalyser = null;
  var gPreGain = null;
  var gHpFilter = null;
  var gLpFilter = null;
  var gBuffer = null;
  var gAnimFrame = null;
  var history = [];
  var lastIdx = null;
  var smoothedCents = 0;
  var ANALYSIS_WINDOW_MS = 360;
  var DISPLAY_SMOOTHING = 0.35;
  var CENTER_LOCK_CENTS = 2;

  function midiToFreq(midi, a4) { return a4 * Math.pow(2, (midi - 69) / 12); }

  function removeDC(input) {
    var mean = 0, i;
    for (i = 0; i < input.length; i++) mean += input[i];
    mean /= input.length;
    var out = new Float32Array(input.length);
    for (i = 0; i < input.length; i++) out[i] = input[i] - mean;
    return out;
  }

  function getRms(buf) {
    var sum = 0;
    for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  }

  function nsdfAt(buf, tau) {
    var acf = 0, div = 0, limit = buf.length - tau;
    for (var i = 0; i < limit; i++) {
      var x = buf[i], y = buf[i + tau];
      acf += x * y; div += x * x + y * y;
    }
    return div > 0 ? (2 * acf) / div : 0;
  }

  function mpmAround(buf, sampleRate, targetFreq) {
    var targetLag = sampleRate / targetFreq;
    var minLag = Math.max(2, Math.floor(targetLag * 0.945));
    var maxLag = Math.min(buf.length - 2, Math.ceil(targetLag * 1.055));
    var bestTau = -1, bestVal = -Infinity;
    for (var tau = minLag; tau <= maxLag; tau++) {
      var v = nsdfAt(buf, tau);
      if (v > bestVal) { bestVal = v; bestTau = tau; }
    }
    if (bestTau < 0 || bestVal < (gConfig.profile ? gConfig.profile.clarityMin : 0.34)) return null;
    var y0 = nsdfAt(buf, Math.max(2, bestTau - 1));
    var y1 = bestVal;
    var y2 = nsdfAt(buf, Math.min(buf.length - 2, bestTau + 1));
    var denom = y0 - 2 * y1 + y2;
    var refined = Math.abs(denom) < 1e-12 ? bestTau : bestTau + 0.5 * ((y0 - y2) / denom);
    return { frequency: sampleRate / refined, clarity: bestVal, tau: refined };
  }

  function shorterPeriodPenalty(buf, tau, clarity) {
    var penalty = 0;
    var divs = [2, 3, 4];
    for (var d = 0; d < divs.length; d++) {
      var sub = Math.round(tau / divs[d]);
      if (sub < 2) continue;
      var sc = nsdfAt(buf, sub);
      // Raised thresholds: guitar mid-strings (D, G) have naturally strong harmonics
      // that triggered the old 0.86/0.45 cutoff and suppressed correct detections.
      if (sc > clarity * 0.93 && sc > 0.52) {
        penalty = Math.max(penalty, 0.20 + (sc - clarity * 0.93));
      }
    }
    return penalty;
  }

  function goertzelPower(buf, sampleRate, freq) {
    var omega = 2 * Math.PI * freq / sampleRate;
    var coeff = 2 * Math.cos(omega);
    var s0 = 0, s1 = 0, s2 = 0;
    for (var i = 0; i < buf.length; i++) {
      s0 = buf[i] + coeff * s1 - s2; s2 = s1; s1 = s0;
    }
    return s1 * s1 + s2 * s2 - coeff * s1 * s2;
  }

  function getStable(latestIdx) {
    var same = [];
    for (var i = 0; i < history.length; i++) {
      if (history[i].targetIdx === latestIdx) same.push(history[i]);
    }
    if (same.length < 4) return null;
    var centsArr = same.map(function(r) { return r.cents; }).sort(function(a,b) { return a-b; });
    var low = centsArr[Math.floor(centsArr.length * 0.2)];
    var high = centsArr[Math.floor(centsArr.length * 0.8)];
    if (high - low > 6) return null;
    var median = centsArr[Math.floor(centsArr.length / 2)];
    var last = same[same.length - 1];
    return { targetIdx: last.targetIdx, targetFreq: last.targetFreq, cents: median, frequency: last.frequency };
  }

  function post(data) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); } catch(e) {}
  }

  function tick() {
    if (!gActive || !gAnalyser || !gBuffer) return;
    gAnalyser.getFloatTimeDomainData(gBuffer);
    var buf = removeDC(gBuffer);
    var rms = getRms(buf);

    if (rms < (gConfig.profile ? gConfig.profile.rmsGate : 0.005)) {
      history = []; lastIdx = null; smoothedCents *= 0.85;
      post({ type: 'silence', rms: rms });
      gAnimFrame = requestAnimationFrame(tick);
      return;
    }

    var targets = gConfig.strings.map(function(s) {
      return { idx: s.idx, label: s.label, frequency: midiToFreq(s.midi, gConfig.a4) };
    });

    // Spectral energy for visual string indicator
    var energyIdx = null, energyBest = -Infinity;
    for (var ei = 0; ei < targets.length; ei++) {
      var t = targets[ei];
      var power = goertzelPower(buf, gAudioCtx.sampleRate, t.frequency)
                + goertzelPower(buf, gAudioCtx.sampleRate, t.frequency * 2) * 0.3;
      if (power > energyBest) { energyBest = power; energyIdx = t.idx; }
    }

    // Per-string MPM candidates
    var candidates = [];
    for (var ci = 0; ci < targets.length; ci++) {
      var tgt = targets[ci];
      var mpm = mpmAround(buf, gAudioCtx.sampleRate, tgt.frequency);
      if (!mpm) continue;
      var cents = 1200 * Math.log2(mpm.frequency / tgt.frequency);
      if (Math.abs(cents) > 70) continue;
      var closeness = Math.max(0, 1 - Math.abs(cents) / 70);
      var continuityBoost = lastIdx === tgt.idx ? 0.08 : 0;
      var energyBoost = energyIdx === tgt.idx ? 0.06 : 0;
      var octavePenalty = shorterPeriodPenalty(buf, mpm.tau, mpm.clarity);
      var confidence = Math.max(0,
        mpm.clarity * 0.68 + closeness * 0.26 + continuityBoost + energyBoost - octavePenalty
      );
      candidates.push({ targetIdx: tgt.idx, targetFreq: tgt.frequency, frequency: mpm.frequency, cents: cents, confidence: confidence });
    }
    candidates.sort(function(a,b) { return b.confidence - a.confidence; });

    var best = candidates[0];
    if (!best || best.confidence < 0.42) {
      post({ type: 'settling', visualIdx: energyIdx !== null ? energyIdx : lastIdx, rms: rms });
      gAnimFrame = requestAnimationFrame(tick);
      return;
    }

    // Locked string override
    var finalIdx = gConfig.lockMode === 'locked'
      ? Math.min(gConfig.lockedString, targets.length - 1)
      : best.targetIdx;
    var picked = best;
    for (var pi = 0; pi < candidates.length; pi++) {
      if (candidates[pi].targetIdx === finalIdx) { picked = candidates[pi]; break; }
    }

    var now = Date.now();
    history.push({ targetIdx: picked.targetIdx, targetFreq: picked.targetFreq, frequency: picked.frequency, cents: picked.cents, time: now });
    while (history.length > 0 && now - history[0].time > ANALYSIS_WINDOW_MS) history.shift();

    var stable = getStable(picked.targetIdx);
    if (!stable) {
      post({ type: 'settling', visualIdx: picked.targetIdx, rms: rms });
      gAnimFrame = requestAnimationFrame(tick);
      return;
    }

    var displayTarget = Math.abs(stable.cents) <= CENTER_LOCK_CENTS ? 0 : stable.cents;
    smoothedCents += (displayTarget - smoothedCents) * DISPLAY_SMOOTHING;
    lastIdx = stable.targetIdx;

    var shownCents = Math.max(-50, Math.min(50, smoothedCents));
    post({
      type: 'pitch',
      cents: shownCents,
      detectedFreq: stable.frequency,
      targetFreq: stable.targetFreq,
      activeString: stable.targetIdx,
      rms: rms,
      vibration: Math.min(1, rms * 10)
    });

    gAnimFrame = requestAnimationFrame(tick);
  }

  window.startTuner = function(config) {
    gConfig = config;
    history = []; lastIdx = null; smoothedCents = 0;
    gActive = true;
    if (gAudioCtx) {
      // Audio chain already built — update node params for the new instrument profile.
      var upd = config.profile;
      if (upd && gPreGain)  gPreGain.gain.value        = upd.preGain;
      if (upd && gHpFilter) gHpFilter.frequency.value  = upd.hpFreq;
      if (upd && gLpFilter) gLpFilter.frequency.value  = upd.lpFreq;
      tick();
      return;
    }
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 }
    }).then(function(stream) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      gAudioCtx = new Ctx();
      var source = gAudioCtx.createMediaStreamSource(stream);
      // Pre-amp: boost quiet sources before gating/detection.
      // NSDF is normalised so extra gain doesn't shift pitch readings.
      var prof = config.profile;
      gPreGain = gAudioCtx.createGain();
      gPreGain.gain.value = prof ? prof.preGain : 2.0;
      gHpFilter = gAudioCtx.createBiquadFilter();
      gHpFilter.type = 'highpass'; gHpFilter.frequency.value = prof ? prof.hpFreq : 65; gHpFilter.Q.value = 0.707;
      gLpFilter = gAudioCtx.createBiquadFilter();
      gLpFilter.type = 'lowpass'; gLpFilter.frequency.value = prof ? prof.lpFreq : 1800; gLpFilter.Q.value = 0.707;
      gAnalyser = gAudioCtx.createAnalyser();
      gAnalyser.fftSize = 8192;
      gAnalyser.smoothingTimeConstant = 0;
      source.connect(gPreGain); gPreGain.connect(gHpFilter); gHpFilter.connect(gLpFilter); gLpFilter.connect(gAnalyser);
      gBuffer = new Float32Array(gAnalyser.fftSize);
      post({ type: 'ready' });
      tick();
    }).catch(function(e) {
      gActive = false;
      post({ type: 'error', message: e.message || 'Microphone unavailable' });
    });
  };

  window.stopTuner = function() {
    gActive = false;
    if (gAnimFrame) { cancelAnimationFrame(gAnimFrame); gAnimFrame = null; }
  };

  window.updateConfig = function(config) {
    gConfig = config;
    history = []; lastIdx = null;
    var p = config.profile;
    if (p && gPreGain)  gPreGain.gain.value        = p.preGain;
    if (p && gHpFilter) gHpFilter.frequency.value  = p.hpFreq;
    if (p && gLpFilter) gLpFilter.frequency.value  = p.lpFreq;
  };
})();
`;

export const TUNER_WEBVIEW_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;width:1px;height:1px}</style>
</head>
<body>
<script>${JS}</script>
</body>
</html>`;
