/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — Particle System
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  let particles = [];
  const maxParticles = 60;
  
  const colors = [
    'rgba(108, 92, 231, 0.3)',
    'rgba(255, 107, 107, 0.3)',
    'rgba(72, 219, 251, 0.3)',
    'rgba(0, 210, 160, 0.3)',
    'rgba(255, 192, 72, 0.3)'
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
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = Math.random() * 0.5 + 0.2;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
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
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity * pulse;
      ctx.fill();
      ctx.globalAlpha = 1;
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
   CONFETTI SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */

function createConfetti(containerId, count = 50) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const colors = ['#6c5ce7', '#ff6b6b', '#48dbfb', '#00d2a0', '#ffc048', '#ff8e8e'];
  const emojis = ['🎉', '🎊', '⭐', '✨', '🏆', '🎯'];
  
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const isEmoji = Math.random() > 0.5;
    
    if (isEmoji) {
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.fontSize = (Math.random() * 20 + 12) + 'px';
    } else {
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.width = (Math.random() * 10 + 5) + 'px';
      el.style.height = (Math.random() * 10 + 5) + 'px';
    }
    
    el.style.cssText += `
      position: absolute;
      left: ${Math.random() * 100}%;
      top: -20px;
      border-radius: ${isEmoji ? '0' : '50%'};
      animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    
    container.appendChild(el);
    
    setTimeout(() => el.remove(), 4000);
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
    font-size: 2rem;
    font-weight: 700;
    color: ${color};
    text-shadow: 0 0 10px ${color};
    pointer-events: none;
    z-index: 100;
    animation: floatUp 1s ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/* Add keyframes dynamically */
const style = document.createElement('style');
style.textContent = `
  @keyframes confettiFall {
    to {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
  
  @keyframes floatUp {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-80px) scale(1.5); opacity: 0; }
  }
  
  @keyframes pullBounceLeft {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-10px); }
  }
  
  @keyframes pullBounceRight {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(10px); }
  }
`;
document.head.appendChild(style);
