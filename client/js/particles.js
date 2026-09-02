/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — Particle & Effects System
   SVG-based confetti, energy sparks, and background particles
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Background Particle System ─────────────────────────────────────────────

(function() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  let particles = [];
  const maxParticles = 50;
  
  const colors = [
    { r: 108, g: 92, b: 231 },  // purple
    { r: 255, g: 107, b: 107 }, // red
    { r: 72, g: 219, b: 251 },  // blue
    { r: 0, g: 210, b: 160 },   // green
    { r: 255, g: 192, b: 72 },  // gold
  ];
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resize);
  resize();
  
  class Particle {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = Math.random() * 0.4 + 0.1;
      this.pulseSpeed = Math.random() * 0.015 + 0.005;
      this.pulsePhase = Math.random() * Math.PI * 2;
      // Shape: 0=circle, 1=diamond, 2=cross
      this.shape = Math.floor(Math.random() * 3);
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulsePhase += this.pulseSpeed;
      
      if (this.x < -50 || this.x > canvas.width + 50 || 
          this.y < -50 || this.y > canvas.height + 50) {
        this.reset();
      }
    }
    
    draw() {
      const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
      const s = this.size * pulse;
      const { r, g, b } = this.color;
      
      ctx.save();
      ctx.globalAlpha = this.opacity * pulse;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.translate(this.x, this.y);
      
      switch (this.shape) {
        case 0: // circle
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 1: // diamond
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s, 0);
          ctx.closePath();
          ctx.fill();
          break;
        case 2: // cross/plus
          ctx.fillRect(-s * 0.3, -s, s * 0.6, s * 2);
          ctx.fillRect(-s, -s * 0.3, s * 2, s * 0.6);
          break;
      }
      
      ctx.restore();
    }
  }
  
  function init() {
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  
  init();
  animate();
})();

/* ═══════════════════════════════════════════════════════════════════════════
   CONFETTI SYSTEM — SVG shapes only, no emoji
   ═══════════════════════════════════════════════════════════════════════════ */

function createConfetti(containerId, count = 50) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const colors = ['#6c5ce7', '#ff6b6b', '#48dbfb', '#00d2a0', '#ffc048', '#a29bfe'];
  
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shapeType = Math.floor(Math.random() * 4);
    const size = Math.random() * 12 + 6;
    
    // Create SVG shape
    let svgContent = '';
    switch (shapeType) {
      case 0: // circle
        svgContent = `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>`;
        break;
      case 1: // star
        const points = [];
        for (let j = 0; j < 5; j++) {
          const angle = (j * 72 - 90) * Math.PI / 180;
          const innerAngle = ((j * 72) + 36 - 90) * Math.PI / 180;
          points.push(`${size/2 + Math.cos(angle) * size/2},${size/2 + Math.sin(angle) * size/2}`);
          points.push(`${size/2 + Math.cos(innerAngle) * size/4},${size/2 + Math.sin(innerAngle) * size/4}`);
        }
        svgContent = `<polygon points="${points.join(' ')}" fill="${color}"/>`;
        break;
      case 2: // square (rotated)
        svgContent = `<rect x="${size*0.15}" y="${size*0.15}" width="${size*0.7}" height="${size*0.7}" fill="${color}" transform="rotate(45 ${size/2} ${size/2})"/>`;
        break;
      case 3: // triangle
        svgContent = `<polygon points="${size/2},0 ${size},${size} 0,${size}" fill="${color}"/>`;
        break;
    }
    
    el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const duration = Math.random() * 2 + 2;
    const rotEnd = Math.random() * 1080 - 540;
    const drift = (Math.random() - 0.5) * 60;
    
    el.style.cssText = `
      position: absolute;
      left: ${left}%;
      top: -${size + 10}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
      animation: confettiFall ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      animation-delay: ${delay}s;
      --confetti-rotate: ${rotEnd}deg;
      --confetti-drift: ${drift}px;
      opacity: 0;
    `;
    
    container.appendChild(el);
    setTimeout(() => el.remove(), (duration + delay + 0.5) * 1000);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPARK / ENERGY BURST — for correct answers
   ═══════════════════════════════════════════════════════════════════════════ */

function createSparks(x, y, count = 12, color = '#00d2a0') {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const angle = (i / count) * 360;
    const distance = 30 + Math.random() * 50;
    const size = 2 + Math.random() * 3;
    
    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 200;
      box-shadow: 0 0 ${size * 2}px ${color};
      animation: sparkBurst 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      --spark-x: ${Math.cos(angle * Math.PI / 180) * distance}px;
      --spark-y: ${Math.sin(angle * Math.PI / 180) * distance}px;
    `;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FLOATING SCORE ANIMATION
   ═══════════════════════════════════════════════════════════════════════════ */

function showFloatingScore(text, x, y, color = '#00d2a0') {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    font-family: 'Fredoka', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: ${color};
    text-shadow: 0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.5);
    pointer-events: none;
    z-index: 200;
    animation: floatUp 1s ease-out forwards;
    white-space: nowrap;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCREEN SHAKE
   ═══════════════════════════════════════════════════════════════════════════ */

function triggerScreenShake(intensity = 'medium') {
  const app = document.getElementById('app');
  if (!app) return;
  
  const cls = `shake-${intensity}`;
  app.classList.add(cls);
  
  const duration = intensity === 'heavy' ? 500 : intensity === 'medium' ? 300 : 150;
  setTimeout(() => app.classList.remove(cls), duration);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DYNAMIC KEYFRAMES — injected once
   ═══════════════════════════════════════════════════════════════════════════ */

const effectStyles = document.createElement('style');
effectStyles.textContent = `
  @keyframes confettiFall {
    0% { 
      transform: translateY(0) translateX(0) rotate(0deg) scale(1); 
      opacity: 1; 
    }
    100% { 
      transform: translateY(100vh) translateX(var(--confetti-drift, 0px)) rotate(var(--confetti-rotate, 720deg)) scale(0.5); 
      opacity: 0; 
    }
  }
  
  @keyframes floatUp {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    30% { transform: translateY(-20px) scale(1.3); opacity: 1; }
    100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
  }
  
  @keyframes sparkBurst {
    0% { 
      transform: translate(0, 0) scale(1); 
      opacity: 1; 
    }
    100% { 
      transform: translate(var(--spark-x), var(--spark-y)) scale(0); 
      opacity: 0; 
    }
  }
  
  @keyframes pullBounceLeft {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-10px); }
  }
  
  @keyframes pullBounceRight {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(10px); }
  }
  
  /* Screen shake */
  @keyframes shakeLight {
    0%, 100% { transform: translate(0); }
    20% { transform: translate(-2px, 1px); }
    40% { transform: translate(2px, -1px); }
    60% { transform: translate(-1px, -1px); }
    80% { transform: translate(1px, 1px); }
  }
  
  @keyframes shakeMedium {
    0%, 100% { transform: translate(0); }
    10% { transform: translate(-4px, 2px); }
    30% { transform: translate(4px, -3px); }
    50% { transform: translate(-3px, -2px); }
    70% { transform: translate(3px, 2px); }
    90% { transform: translate(-2px, -1px); }
  }
  
  @keyframes shakeHeavy {
    0%, 100% { transform: translate(0); }
    10% { transform: translate(-6px, 3px) rotate(-0.5deg); }
    20% { transform: translate(5px, -4px) rotate(0.5deg); }
    30% { transform: translate(-5px, -2px) rotate(-0.3deg); }
    40% { transform: translate(4px, 3px) rotate(0.3deg); }
    50% { transform: translate(-3px, -3px); }
    60% { transform: translate(3px, 2px); }
    70% { transform: translate(-2px, -1px); }
    80% { transform: translate(2px, 1px); }
  }
  
  .shake-light { animation: shakeLight 0.15s ease-out; }
  .shake-medium { animation: shakeMedium 0.3s ease-out; }
  .shake-heavy { animation: shakeHeavy 0.5s ease-out; }
`;
document.head.appendChild(effectStyles);
