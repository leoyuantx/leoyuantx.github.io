// Audio System (music + simple SFX bus)
let musicPlaying = false;
let bgmTracks = [];
let currentTrackIndex = 0;
let audioCtx = null;
let sfxGain = null;
let musicVolume = 0.35;
let sfxVolume = 0.7;
let musicUnlockListenersBound = false;

function clampVolume(value) {
  return Math.max(0, Math.min(1, value));
}

export function getAudioCtx() { return audioCtx; }
export function getSfxGain() { return sfxGain; }
export function getMusicVolume() { return musicVolume; }
export function getSfxVolume() { return sfxVolume; }

export function setMusicVolume(value) {
  musicVolume = clampVolume(value);
  bgmTracks.forEach(track => {
    track.volume = musicVolume;
  });
}

export function setSfxVolume(value) {
  sfxVolume = clampVolume(value);
  if (sfxGain) sfxGain.gain.value = sfxVolume;
}

function clearMusicUnlockListeners() {
  if (!musicUnlockListenersBound) return;
  musicUnlockListenersBound = false;
  window.removeEventListener('pointerdown', handleMusicUnlock, true);
  window.removeEventListener('keydown', handleMusicUnlock, true);
  window.removeEventListener('touchstart', handleMusicUnlock, true);
}

async function handleMusicUnlock() {
  const ctx = ensureAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_) {}
  }

  if (!musicPlaying || bgmTracks.length === 0) {
    clearMusicUnlockListeners();
    return;
  }

  playCurrentTrack();
}

function bindMusicUnlockListeners() {
  if (musicUnlockListenersBound) return;
  musicUnlockListenersBound = true;
  window.addEventListener('pointerdown', handleMusicUnlock, true);
  window.addEventListener('keydown', handleMusicUnlock, true);
  window.addEventListener('touchstart', handleMusicUnlock, true);
}

function ensureAudioContext() {
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = sfxVolume;
  sfxGain.connect(audioCtx.destination);
  return audioCtx;
}

function playTone({ type = 'sine', frequency = 440, duration = 0.18, gain = 0.12, sweep = 0, delay = 0 }) {
  const ctx = ensureAudioContext();
  if (!ctx || !sfxGain) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (sweep !== 0) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequency * sweep), now + duration);
  }
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(amp);
  amp.connect(sfxGain);
  osc.start(now);
  osc.stop(now + duration + 0.03);
}

function playCurrentTrack() {
  if (!musicPlaying || bgmTracks.length === 0) return;

  const track = bgmTracks[currentTrackIndex];
  bgmTracks.forEach((candidate, index) => {
    if (index === currentTrackIndex) return;
    candidate.pause();
    candidate.currentTime = 0;
  });
  track.currentTime = 0;
  track.volume = musicVolume;
  const playPromise = track.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise
      .then(() => {
        clearMusicUnlockListeners();
      })
      .catch(() => {
        bindMusicUnlockListeners();
      });
  } else {
    clearMusicUnlockListeners();
  }
}

export function initAudio() {
  const ctx = ensureAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  if (bgmTracks.length > 0) {
    bgmTracks.forEach(track => {
      track.volume = musicVolume;
    });
    if (sfxGain) sfxGain.gain.value = sfxVolume;
    return;
  }

  const trackPaths = [
    'sounds/bgm.mp3',
    'sounds/Greenside Breeze.mp3',
    'sounds/Fairway Drift.mp3',
  ];

  bgmTracks = trackPaths.map((path, index) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.volume = musicVolume;
    audio.addEventListener('ended', () => {
      if (!musicPlaying || index !== currentTrackIndex) return;
      currentTrackIndex = (currentTrackIndex + 1) % bgmTracks.length;
      playCurrentTrack();
    });
    return audio;
  });
}

export function startMusic() {
  initAudio();
  if (musicPlaying && bgmTracks.some(track => !track.paused)) return;
  musicPlaying = true;

  if (bgmTracks.length === 0) return;
  currentTrackIndex = 0;
  playCurrentTrack();
}

export function stopMusic() {
  musicPlaying = false;
  clearMusicUnlockListeners();
  bgmTracks.forEach(track => {
    track.pause();
    track.currentTime = 0;
  });
  currentTrackIndex = 0;
}
export function startNatureSounds() {}

export function stopNatureSounds() {}

export function playSwingSound() {
  playTone({ type: 'triangle', frequency: 180, duration: 0.16, gain: 0.11, sweep: 0.7 });
}

export function playHitSound() {
  playTone({ type: 'sine', frequency: 260, duration: 0.12, gain: 0.14, sweep: 1.6 });
}

export function playBounceSound(intensity = 1) {
  playTone({ type: 'square', frequency: 170 + intensity * 90, duration: 0.1, gain: 0.08 + Math.min(intensity, 2) * 0.03, sweep: 0.8 });
}

export function playWallBounceSound(intensity = 1) {
  playTone({ type: 'square', frequency: 220 + intensity * 110, duration: 0.09, gain: 0.08 + Math.min(intensity, 2) * 0.025, sweep: 0.75 });
}

export function playTapSound() {
  playTone({ type: 'sine', frequency: 520, duration: 0.05, gain: 0.05, sweep: 1.05 });
}

export function playHoleSound() {
  playTone({ type: 'sine', frequency: 330, duration: 0.14, gain: 0.12, sweep: 0.5 });
  playTone({ type: 'sine', frequency: 660, duration: 0.18, gain: 0.08, sweep: 0.75, delay: 0.05 });
}

export function playWinSound() {
  playTone({ type: 'triangle', frequency: 523.25, duration: 0.12, gain: 0.1, sweep: 1.12 });
  playTone({ type: 'triangle', frequency: 659.25, duration: 0.12, gain: 0.1, sweep: 1.12, delay: 0.1 });
  playTone({ type: 'triangle', frequency: 783.99, duration: 0.14, gain: 0.09, sweep: 1.08, delay: 0.2 });
}

export function playLoseSound() {
  playTone({ type: 'sawtooth', frequency: 392, duration: 0.18, gain: 0.08, sweep: 0.72 });
  playTone({ type: 'sawtooth', frequency: 220, duration: 0.22, gain: 0.07, sweep: 0.65, delay: 0.06 });
}

export function playRollSound(intensity = 1) {
  if (Math.random() > 0.96) {
    playTone({ type: 'sine', frequency: 120 + intensity * 30, duration: 0.03, gain: 0.015 + Math.min(intensity, 2) * 0.005 });
  }
}
