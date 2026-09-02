/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — Sound Effects (Web Audio API)
   No external files needed — all sounds generated procedurally
   ═══════════════════════════════════════════════════════════════════════════ */

const SoundEngine = (() => {
  let ctx = null;
  let enabled = true;
  let volume = 0.3;
  
  function getContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }
  
  // ─── Sound Generators ───────────────────────────────────────────────────
  
  function playTone(freq, type, duration, vol = 1, ramp = true) {
    if (!enabled) return;
    const ac = getContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    
    osc.connect(gain);
    gain.connect(ac.destination);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume * vol, ac.currentTime);
    
    if (ramp) {
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    }
    
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  }
  
  function playNoise(duration, vol = 1) {
    if (!enabled) return;
    const ac = getContext();
    const buffer = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    
    const source = ac.createBufferSource();
    source.buffer = buffer;
    
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume * vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    
    source.connect(gain);
    gain.connect(ac.destination);
    source.start();
  }
  
  // ─── Sound Effects ──────────────────────────────────────────────────────
  
  const sounds = {
    // Click / Button hover
    click: () => {
      playTone(800, 'sine', 0.05, 0.3);
    },
    
    hover: () => {
      playTone(1200, 'sine', 0.03, 0.15);
    },
    
    // Correct answer — happy ascending
    correct: () => {
      const ac = getContext();
      const now = ac.currentTime;
      
      const osc1 = ac.createOscillator();
      const osc2 = ac.createOscillator();
      const gain = ac.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ac.destination);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523, now);
      osc1.frequency.setValueAtTime(659, now + 0.1);
      osc1.frequency.setValueAtTime(784, now + 0.2);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(523, now);
      osc2.frequency.setValueAtTime(659, now + 0.1);
      
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    },
    
    // Wrong answer — buzz
    wrong: () => {
      playTone(200, 'sawtooth', 0.15, 0.5);
      setTimeout(() => playTone(150, 'sawtooth', 0.2, 0.4), 100);
    },
    
    // Stun / lockout
    stun: () => {
      playNoise(0.2, 0.3);
      playTone(100, 'square', 0.3, 0.3);
    },
    
    // Combo streak
    combo: (level = 1) => {
      const baseFreq = 400 + (level * 100);
      playTone(baseFreq, 'sine', 0.1, 0.6);
      setTimeout(() => playTone(baseFreq * 1.25, 'sine', 0.1, 0.5), 50);
      setTimeout(() => playTone(baseFreq * 1.5, 'sine', 0.15, 0.4), 100);
    },
    
    // Win / Victory
    win: () => {
      const ac = getContext();
      const now = ac.currentTime;
      const notes = [523, 659, 784, 1047];
      
      notes.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(volume, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.3);
      });
    },
    
    // Lose / Defeat
    lose: () => {
      const ac = getContext();
      const now = ac.currentTime;
      const notes = [400, 350, 300, 250];
      
      notes.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.2);
        gain.gain.setValueAtTime(volume * 0.7, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.3);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.3);
      });
    },
    
    // Countdown
    countdown: () => {
      playTone(600, 'sine', 0.1, 0.4);
    },
    
    countdownGo: () => {
      playTone(1000, 'sine', 0.2, 0.6);
    },
    
    // Notification / Info
    notify: () => {
      playTone(880, 'sine', 0.1, 0.3);
      setTimeout(() => playTone(880, 'sine', 0.1, 0.3), 150);
    },
    
    // Pull / Force applied
    pull: () => {
      playTone(300, 'sine', 0.1, 0.2);
      playNoise(0.05, 0.2);
    },
    
    // Score tick
    tick: () => {
      playTone(200, 'square', 0.02, 0.1);
    },
    
    // New question appear
    newQuestion: () => {
      playTone(600, 'sine', 0.05, 0.2);
      setTimeout(() => playTone(900, 'sine', 0.05, 0.2), 50);
    }
  };
  
  // ─── Public API ─────────────────────────────────────────────────────────
  
  return {
    play: (name, ...args) => {
      try {
        if (sounds[name]) sounds[name](...args);
      } catch (e) {
        // Silently fail if audio not available
      }
    },
    
    setEnabled: (val) => { enabled = val; },
    isEnabled: () => enabled,
    
    setVolume: (val) => { volume = Math.max(0, Math.min(1, val)); },
    getVolume: () => volume,
    
    // Toggle with UI feedback
    toggle: () => {
      enabled = !enabled;
      if (enabled) sounds.click();
      return enabled;
    },
    
    // Initialize audio context on first user interaction
    init: () => {
      getContext();
    }
  };
})();

// Auto-initialize on first interaction
document.addEventListener('click', () => SoundEngine.init(), { once: true });
document.addEventListener('touchstart', () => SoundEngine.init(), { once: true });
