/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — SVG Icon System
   All game icons as inline SVG — zero emoji dependency
   ═══════════════════════════════════════════════════════════════════════════ */

const GameIcons = (() => {
  // Helper to wrap SVG with consistent viewBox & class
  const svg = (inner, vb = '0 0 24 24', cls = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" class="icon ${cls}" aria-hidden="true">${inner}</svg>`;

  return {
    // ─── Logo & Branding ──────────────────────────────────────────
    abacus: () => svg(`
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/>
      <line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="7" cy="9" r="1.5" fill="#ff6b6b"/>
      <circle cx="11" cy="9" r="1.5" fill="#ffc048"/>
      <circle cx="15" cy="9" r="1.5" fill="#48dbfb"/>
      <circle cx="9" cy="14" r="1.5" fill="#6c5ce7"/>
      <circle cx="14" cy="14" r="1.5" fill="#00d2a0"/>
    `),

    // ─── Menu / Navigation ────────────────────────────────────────
    lightning: () => svg(`
      <path d="M13 2L4.5 12.5H11.5L10.5 22L19.5 11.5H12.5L13 2Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
    `),

    house: () => svg(`
      <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M9 21V14H15V21" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    `),

    door: () => svg(`
      <path d="M5 4C5 3.45 5.45 3 6 3H18C18.55 3 19 3.45 19 4V21H5V4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="15.5" cy="12" r="1" fill="currentColor"/>
      <path d="M10 3L10 21" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity="0.4"/>
    `),

    pencil: () => svg(`
      <path d="M16.5 3.5L20.5 7.5L7 21H3V17L16.5 3.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <line x1="14" y1="6" x2="18" y2="10" stroke="currentColor" stroke-width="2"/>
    `),

    numpad: () => svg(`
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="10" y="3" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="3" y="10" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="10" y="10" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="17" y="3" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="17" y="10" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="3" y="17" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="10" y="17" width="12" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
    `),

    clipboard: () => svg(`
      <rect x="6" y="4" width="12" height="17" rx="2" stroke="currentColor" stroke-width="2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" stroke-width="1.5" fill="var(--bg-card, #252550)"/>
      <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="1.5"/>
      <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" stroke-width="1.5"/>
      <line x1="9" y1="16" x2="13" y2="16" stroke="currentColor" stroke-width="1.5"/>
    `),

    clipboardCheck: () => svg(`
      <rect x="6" y="4" width="12" height="17" rx="2" stroke="currentColor" stroke-width="2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" stroke-width="1.5" fill="var(--bg-card, #252550)"/>
      <path d="M9 13L11 15L15 11" stroke="#00d2a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `),

    // ─── Difficulty ───────────────────────────────────────────────
    seedling: () => svg(`
      <path d="M12 22V13" stroke="#00d2a0" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 13C12 13 8 10 8 7C8 4 12 3 12 3C12 3 16 4 16 7C16 10 12 13 12 13Z" fill="#00d2a0" opacity="0.3" stroke="#00d2a0" stroke-width="2"/>
      <path d="M12 16C12 16 6 15 5 11" stroke="#00d2a0" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    `),

    flame: () => svg(`
      <path d="M12 2C12 2 7 8 7 13C7 16.87 9.24 19 12 19C14.76 19 17 16.87 17 13C17 8 12 2 12 2Z" fill="#ff6b6b" opacity="0.3" stroke="#ff6b6b" stroke-width="2"/>
      <path d="M12 19C12 19 10 17 10 15C10 13 12 11 12 11C12 11 14 13 14 15C14 17 12 19 12 19Z" fill="#ffc048" stroke="#ffc048" stroke-width="1"/>
    `),

    skull: () => svg(`
      <circle cx="12" cy="10" r="7" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="9.5" cy="9.5" r="1.5" fill="currentColor"/>
      <circle cx="14.5" cy="9.5" r="1.5" fill="currentColor"/>
      <path d="M9 15L10.5 13L12 15L13.5 13L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="10" y1="17" x2="10" y2="21" stroke="currentColor" stroke-width="1.5"/>
      <line x1="14" y1="17" x2="14" y2="21" stroke="currentColor" stroke-width="1.5"/>
    `),

    // ─── Game HUD ─────────────────────────────────────────────────
    key: () => svg(`
      <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.3"/>
      <path d="M12 12L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M17 17L19 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `),

    stopwatch: () => svg(`
      <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="13" x2="15" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="10" y1="2" x2="14" y2="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="18.5" y1="6.5" x2="20" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `),

    power: () => svg(`
      <path d="M12 22C12 22 5 18 5 12C5 8 8 5 12 5C16 5 19 8 19 12C19 18 12 22 12 22Z" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M9 12L11.5 14.5L15 10" stroke="#00d2a0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    `, '0 0 24 24', 'icon-power'),

    // ─── Rope & Flag ──────────────────────────────────────────────
    flag: () => svg(`
      <line x1="5" y1="3" x2="5" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M5 3H17L14 8.5L17 14H5" fill="#ff6b6b" opacity="0.85" stroke="#ff6b6b" stroke-width="1.5" stroke-linejoin="round"/>
    `),

    fireStreak: () => svg(`
      <path d="M12 2C12 2 6 7 6 12C6 16.42 8.69 19 12 19C15.31 19 18 16.42 18 12C18 7 12 2 12 2Z" fill="currentColor" opacity="0.25"/>
      <path d="M12 19C12 19 9 16.5 9 14C9 11.5 12 9 12 9C12 9 15 11.5 15 14C15 16.5 12 19 12 19Z" fill="currentColor" opacity="0.5"/>
      <path d="M12 19C12 19 10.5 17.5 10.5 16C10.5 14.5 12 13 12 13C12 13 13.5 14.5 13.5 16C13.5 17.5 12 19 12 19Z" fill="currentColor"/>
    `),

    // ─── Feedback ─────────────────────────────────────────────────
    checkBurst: () => svg(`
      <circle cx="12" cy="12" r="9" fill="#00d2a0" opacity="0.15"/>
      <circle cx="12" cy="12" r="6" fill="#00d2a0" opacity="0.25"/>
      <path d="M8 12L11 15L16 9" stroke="#00d2a0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="1" x2="12" y2="3" stroke="#00d2a0" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke="#00d2a0" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="1" y1="12" x2="3" y2="12" stroke="#00d2a0" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke="#00d2a0" stroke-width="1.5" stroke-linecap="round"/>
    `),

    crossMark: () => svg(`
      <circle cx="12" cy="12" r="9" fill="#ff6b6b" opacity="0.15"/>
      <line x1="8" y1="8" x2="16" y2="16" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="8" x2="8" y2="16" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round"/>
    `),

    trophy: () => svg(`
      <path d="M6 4H18V7C18 10.31 15.31 13 12 13C8.69 13 6 10.31 6 7V4Z" stroke="#ffc048" stroke-width="2" fill="#ffc048" fill-opacity="0.2"/>
      <path d="M6 7H4C3.45 7 3 6.55 3 6V4H6" stroke="#ffc048" stroke-width="2" stroke-linejoin="round" fill="none"/>
      <path d="M18 7H20C20.55 7 21 6.55 21 6V4H18" stroke="#ffc048" stroke-width="2" stroke-linejoin="round" fill="none"/>
      <line x1="12" y1="13" x2="12" y2="17" stroke="#ffc048" stroke-width="2"/>
      <rect x="8" y="17" width="8" height="3" rx="1" stroke="#ffc048" stroke-width="2" fill="#ffc048" fill-opacity="0.3"/>
    `),

    refresh: () => svg(`
      <path d="M4 12C4 7.58 7.58 4 12 4C15.15 4 17.85 5.95 19.15 8.72" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M20 12C20 16.42 16.42 20 12 20C8.85 20 6.15 18.05 4.85 15.28" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M16 9H20V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M8 15H4V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `),

    // ─── Sound ────────────────────────────────────────────────────
    speakerOn: () => svg(`
      <path d="M3 9H7L12 4V20L7 15H3V9Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M16 8.5C17.33 9.83 18 11.42 18 13C18 14.58 17.33 16.17 16 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M19 5.5C21.33 7.83 22.5 10.42 22.5 13C22.5 15.58 21.33 18.17 19 20.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
    `),

    speakerOff: () => svg(`
      <path d="M3 9H7L12 4V20L7 15H3V9Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `),

    // ─── Status / Misc ────────────────────────────────────────────
    hourglass: () => svg(`
      <path d="M6 2H18V6L12 12L6 6V2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.15"/>
      <path d="M6 22H18V18L12 12L6 18V22Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.15"/>
      <line x1="5" y1="2" x2="19" y2="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="19" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `),

    lightbulb: () => svg(`
      <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/>
      <line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke="#ffc048" stroke-width="2" stroke-linecap="round"/>
      <line x1="10" y1="11" x2="14" y2="11" stroke="#ffc048" stroke-width="2" stroke-linecap="round"/>
    `),

    check: () => svg(`
      <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),

    backspace: () => svg(`
      <path d="M9 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H9L3 12L9 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1"/>
      <line x1="11" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="17" y1="9" x2="11" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `),

    // ─── Characters (P1 & P2) — pulling pose silhouettes ─────────
    characterP1: (pulling = false) => {
      const armAngle = pulling ? 'rotate(-30 14 10)' : '';
      return svg(`
        <circle cx="12" cy="5" r="3.5" fill="#ff6b6b" opacity="0.9"/>
        <path d="M12 8.5C8.5 8.5 7 11 7 14V18C7 18.55 7.45 19 8 19H16C16.55 19 17 18.55 17 18V14C17 11 15.5 8.5 12 8.5Z" fill="#ff6b6b" opacity="0.7"/>
        <rect x="7" y="19" width="4" height="3" rx="1" fill="#ff6b6b" opacity="0.6"/>
        <rect x="13" y="19" width="4" height="3" rx="1" fill="#ff6b6b" opacity="0.6"/>
        <line x1="7" y1="12" x2="2" y2="${pulling ? '9' : '14'}" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round" transform="${armAngle}"/>
        <line x1="17" y1="12" x2="22" y2="${pulling ? '9' : '14'}" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round"/>
      `, '0 0 24 24', 'char-p1');
    },

    characterP2: (pulling = false) => {
      const armAngle = pulling ? 'rotate(30 10 10)' : '';
      return svg(`
        <circle cx="12" cy="5" r="3.5" fill="#48dbfb" opacity="0.9"/>
        <path d="M12 8.5C8.5 8.5 7 11 7 14V18C7 18.55 7.45 19 8 19H16C16.55 19 17 18.55 17 18V14C17 11 15.5 8.5 12 8.5Z" fill="#48dbfb" opacity="0.7"/>
        <rect x="7" y="19" width="4" height="3" rx="1" fill="#48dbfb" opacity="0.6"/>
        <rect x="13" y="19" width="4" height="3" rx="1" fill="#48dbfb" opacity="0.6"/>
        <rect x="8.5" y="3.5" width="7" height="2.5" rx="1" fill="#48dbfb" opacity="0.5"/>
        <line x1="7" y1="12" x2="2" y2="${pulling ? '9' : '14'}" stroke="#48dbfb" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="17" y1="12" x2="22" y2="${pulling ? '9' : '14'}" stroke="#48dbfb" stroke-width="2.5" stroke-linecap="round" transform="${armAngle}"/>
      `, '0 0 24 24', 'char-p2');
    },

    // ─── Rope SVG (for inline rope rendering) ─────────────────────
    ropeSVG: (position = 0, maxThreshold = 100) => {
      // Position: -threshold to +threshold, 0 = center
      const pct = ((position + maxThreshold) / (maxThreshold * 2)) * 100;
      const flagX = Math.max(5, Math.min(95, pct));
      const tension = Math.min(1, Math.abs(position) / maxThreshold);
      const waveAmp = 3 * (1 - tension);
      // Build rope wave
      let ropePath = `M 0 20`;
      for (let x = 0; x <= 100; x += 2) {
        const y = 20 + Math.sin((x / 100) * Math.PI * 6 + Date.now() / 500) * waveAmp;
        ropePath += ` L ${x} ${y}`;
      }
      return `<svg viewBox="0 0 100 40" preserveAspectRatio="none" class="rope-svg" aria-hidden="true">
        <defs>
          <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#c8956c"/>
            <stop offset="50%" stop-color="#daa873"/>
            <stop offset="100%" stop-color="#c8956c"/>
          </linearGradient>
        </defs>
        <path d="${ropePath}" stroke="url(#ropeGrad)" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="${ropePath}" stroke="rgba(255,255,255,0.15)" stroke-width="1" fill="none" stroke-linecap="round" transform="translate(0,-1)"/>
      </svg>`;
    },
  };
})();

// Make globally available
window.GameIcons = GameIcons;
