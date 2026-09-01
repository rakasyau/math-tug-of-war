const { v4: uuidv4 } = require('uuid');

// ─── Configuration Constants ───────────────────────────────────────────────
const CONFIG = {
  ROPE_MIN: -100,
  ROPE_MAX: 100,
  ROPE_START: 0,
  F_BASE: { easy: 12, medium: 15, hard: 20 },
  DECAY_LAMBDA: 0.35,
  MIN_MULTIPLIER: 0.20,
  COMBO_PER_LEVEL: 0.1,
  COMBO_MAX: 1.5,
  STUN_DURATION_MS: 600,
  STUN_FREEZE_SECONDS: 0.6,
  GRACE_PERIOD_MS: 10000,
  DEFAULT_WIN_THRESHOLD: 100,
  RECONNECT_TIMEOUT_MS: 10000,
};

// ─── Deterministic Seeded RNG (for reproducible question generation) ────────
class SeededRNG {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    // Linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// ─── Math Question Generator ───────────────────────────────────────────────
class MathEngine {
  static generateQuestion(difficulty, seed) {
    const rng = new SeededRNG(seed);
    const ops = MathEngine._getOperators(difficulty);
    const op = ops[rng.nextInt(0, ops.length - 1)];

    let a, b, c, answer, prompt;

    switch (op) {
      case '+':
        if (difficulty === 'easy') {
          a = rng.nextInt(1, 50);
          b = rng.nextInt(1, 50);
        } else {
          a = rng.nextInt(1, 100);
          b = rng.nextInt(1, 100);
        }
        answer = a + b;
        prompt = `${a} + ${b}`;
        break;

      case '-':
        if (difficulty === 'easy') {
          a = rng.nextInt(1, 50);
          b = rng.nextInt(1, a); // Ensure non-negative
        } else {
          a = rng.nextInt(10, 100);
          b = rng.nextInt(1, a);
        }
        answer = a - b;
        prompt = `${a} - ${b}`;
        break;

      case '*':
        if (difficulty === 'easy') {
          a = rng.nextInt(2, 12);
          b = rng.nextInt(2, 12);
        } else if (difficulty === 'medium') {
          a = rng.nextInt(2, 12);
          b = rng.nextInt(2, 12);
        } else {
          // Hard: two-stage operations
          a = rng.nextInt(2, 12);
          b = rng.nextInt(2, 12);
          c = rng.nextInt(1, 20);
          if (rng.next() > 0.5) {
            answer = a * b + c;
            prompt = `${a} × ${b} + ${c}`;
          } else {
            answer = a * b - c;
            prompt = `${a} × ${b} − ${c}`;
          }
          break;
        }
        answer = a * b;
        prompt = `${a} × ${b}`;
        break;

      case '/':
        // Division with integer result
        b = rng.nextInt(2, 12);
        answer = rng.nextInt(2, 12);
        a = b * answer; // Ensure clean division
        prompt = `${a} ÷ ${b}`;
        break;

      default:
        a = rng.nextInt(1, 10);
        b = rng.nextInt(1, 10);
        answer = a + b;
        prompt = `${a} + ${b}`;
    }

    const options = MathEngine._generateDistractors(answer, rng);

    return {
      questionId: `q_${Date.now()}_${rng.nextInt(0, 99999)}`,
      prompt,
      options,
      answer, // Server never sends this to client
      difficulty,
    };
  }

  static _getOperators(difficulty) {
    switch (difficulty) {
      case 'easy':
        return ['+', '-'];
      case 'medium':
        return ['+', '-', '*'];
      case 'hard':
        return ['+', '-', '*', '/'];
      default:
        return ['+', '-'];
    }
  }

  static _generateDistractors(answer, rng) {
    const distractors = new Set();
    
    // Smart distractors: ±1, ±10, off-by-one digit
    distractors.add(answer + 1);
    distractors.add(answer - 1);
    distractors.add(answer + 10);
    distractors.add(answer - 10);
    
    // Random distractors
    while (distractors.size < 4) {
      const d = answer + rng.nextInt(-20, 20);
      if (d !== answer && d >= 0) distractors.add(d);
    }
    
    const allOptions = [...distractors].slice(0, 3);
    allOptions.push(answer);
    
    // Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i);
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    
    return allOptions;
  }

  // ─── Force Calculation ──────────────────────────────────────────────────
  static calculateForce(responseTimeSec, difficulty, streak) {
    const fBase = CONFIG.F_BASE[difficulty] || CONFIG.F_BASE.medium;
    const decay = Math.exp(-CONFIG.DECAY_LAMBDA * responseTimeSec);
    const multiplier = Math.max(decay, CONFIG.MIN_MULTIPLIER);
    const comboMultiplier = Math.min(
      1.0 + CONFIG.COMBO_PER_LEVEL * streak,
      CONFIG.COMBO_MAX
    );
    
    const force = fBase * multiplier * comboMultiplier;
    
    return Math.round(force * 10) / 10; // Round to 1 decimal
  }
}

module.exports = { MathEngine, CONFIG };
