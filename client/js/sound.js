/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — Sound Effects (Web Audio API)
   No external files needed — all sounds generated procedurally
   Enhanced with rope, tension, countdown, and dramatic effects
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
  
  function playNoise(duration, vol = 1, filterFreq = 0) {
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
    
    if (filterFreq > 0) {
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }
    
    gain.connect(ac.destination);
    source.start();
  }
  
  function playChord(notes, type, duration, vol = 1) {
    if (!enabled) return;
    const ac = getContext();
    const now = ac.currentTime;
    const masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(volume * vol / notes.length, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ac.destination);
    
    notes.forEach(freq => {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }
  
  // ─── Sound Effects ──────────────────────────────────────────────────────
  
  const sounds = {
    // Click / Button press
    click: () => {
      playTone(800, 'sine', 0.06, 0.3);
      playTone(1000, 'sine', 0.03, 0.15);
    },
    
    // Hover feedback
    hover: () => {
      playTone(1200, 'sine', 0.03, 0.12);
    },
    
    // Correct answer — triumphant ascending arpeggio
    correct: () => {
      const ac = getContext();
      const now = ac.currentTime;
      const notes = [523, 659, 784]; // C5, E5, G5
      
      notes.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const osc2 = ac.createOscillator();
        const gain = ac.createGain();
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ac.destination);
        
        osc.type = 'sine';
        osc2.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        osc2.frequency.setValueAtTime(freq * 2, now + i * 0.08);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * 0.5, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        
        osc.start(now + i * 0.08);
        osc2.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
        osc2.stop(now + i * 0.08 + 0.3);
      });
    },
    
    // Wrong answer — dissonant buzz
    wrong: () => {
      const ac = getContext();
      const now = ac.currentTime;
      
      // Harsh buzz chord
      [150, 180].forEach(freq => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      });
      
      // Impact noise
      playNoise(0.1, 0.3, 800);
    },
    
    // Stun lockout
    stun: () => {
      playNoise(0.15, 0.25, 600);
      playTone(90, 'square', 0.25, 0.25);
    },
    
    // Combo streak — escalating energy
    combo: (level = 1) => {
      const baseFreq = 440 + (Math.min(level, 8) * 80);
      const ac = getContext();
      const now = ac.currentTime;
      
      // Rapid ascending sparkle
      [0, 0.04, 0.08].forEach((t, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * (1 + i * 0.25), now + t);
        gain.gain.setValueAtTime(volume * (0.5 - i * 0.1), now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
        osc.start(now + t);
        osc.stop(now + t + 0.12);
      });
      
      // Shimmer overtone
      playTone(baseFreq * 3, 'sine', 0.2, 0.15);
    },
    
    // Big combo (5+ streak) — dramatic flourish
    bigCombo: () => {
      const ac = getContext();
      const now = ac.currentTime;
      const notes = [523, 659, 784, 1047, 1319]; // C5 to E6
      
      notes.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(volume * 0.4, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.3);
      });
      
      // Shimmer chord
      setTimeout(() => playChord([1047, 1319, 1568], 'sine', 0.5, 0.2), 250);
    },
    
    // Win / Victory — epic fanfare
    win: () => {
      const ac = getContext();
      const now = ac.currentTime;
      
      // Fanfare: C-E-G-C (octave)
      const fanfare = [
        { freq: 523, time: 0, dur: 0.3 },
        { freq: 659, time: 0.15, dur: 0.3 },
        { freq: 784, time: 0.3, dur: 0.35 },
        { freq: 1047, time: 0.5, dur: 0.5 },
      ];
      
      fanfare.forEach(({ freq, time, dur }) => {
        const osc = ac.createOscillator();
        const osc2 = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ac.destination);
        
        osc.type = 'sine';
        osc2.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);
        osc2.frequency.setValueAtTime(freq * 0.5, now + time);
        
        gain.gain.setValueAtTime(volume * 0.6, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
        
        osc.start(now + time);
        osc2.start(now + time);
        osc.stop(now + time + dur);
        osc2.stop(now + time + dur);
      });
      
      // Final sustain chord
      setTimeout(() => playChord([523, 659, 784, 1047], 'sine', 1.0, 0.3), 700);
    },
    
    // Lose / Defeat — descending somber
    lose: () => {
      const ac = getContext();
      const now = ac.currentTime;
      const notes = [
        { freq: 440, time: 0, dur: 0.35 },
        { freq: 370, time: 0.2, dur: 0.35 },
        { freq: 330, time: 0.4, dur: 0.35 },
        { freq: 262, time: 0.6, dur: 0.6 },
      ];
      
      notes.forEach(({ freq, time, dur }) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);
        gain.gain.setValueAtTime(volume * 0.5, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    },
    
    // Countdown tick (3, 2, 1)
    countdown: () => {
      const ac = getContext();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    },
    
    // Countdown "GO!" 
    countdownGo: () => {
      const ac = getContext();
      const now = ac.currentTime;
      
      // Rising sweep
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      
      // Impact chord
      setTimeout(() => playChord([523, 784, 1047], 'sine', 0.4, 0.5), 100);
    },
    
    // Notification
    notify: () => {
      playTone(880, 'sine', 0.08, 0.3);
      setTimeout(() => playTone(1100, 'sine', 0.08, 0.25), 120);
    },
    
    // Pull / Force applied — rope tension snap
    pull: () => {
      const ac = getContext();
      const now = ac.currentTime;
      
      // Rope creak
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.15);
      gain.gain.setValueAtTime(volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      
      // Fabric/rope noise
      playNoise(0.08, 0.15, 2000);
    },
    
    // Rope creak — sustained tension sound
    ropeCreak: () => {
      const ac = getContext();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      // Warbling creak
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.1);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);
      osc.frequency.linearRampToValueAtTime(260, now + 0.3);
      gain.gain.setValueAtTime(volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    },
    
    // Near-win tension — ominous pulsing
    nearWin: () => {
      const ac = getContext();
      const now = ac.currentTime;
      
      // Low pulse
      const osc = ac.createOscillator();
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      const gain = ac.createGain();
      
      lfo.frequency.value = 4;
      lfoGain.gain.value = volume * 0.1;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      gain.gain.setValueAtTime(volume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.start(now);
      lfo.start(now);
      osc.stop(now + 0.8);
      lfo.stop(now + 0.8);
    },
    
    // Score tick
    tick: () => {
      playTone(220, 'square', 0.02, 0.08);
    },
    
    // New question appear — subtle chime
    newQuestion: () => {
      const ac = getContext();
      const now = ac.currentTime;
      
      [700, 1050].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(volume * 0.2, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.12);
      });
    },
    
    // Screen shake rumble
    screenShake: () => {
      playNoise(0.12, 0.2, 400);
      playTone(60, 'sine', 0.15, 0.2);
    },
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

// Make globally available
window.SoundEngine = SoundEngine;
