/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — P2P Game Client (Overhauled)
   Fixed logic, SVG icons, countdown, enhanced rope animation, screen shake
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Game State ────────────────────────────────────────────────────────────
const GameState = {
  playerId: null,
  playerName: `Player_${Math.floor(Math.random() * 9999)}`,
  roomId: null,
  slot: null,
  isPlaying: false,
  isHost: false,
  currentQuestion: null,
  ropePosition: 0,
  scores: { p1: 0, p2: 0 },
  streaks: { p1: 0, p2: 0 },
  maxStreaks: { p1: 0, p2: 0 },
  correctCounts: { p1: 0, p2: 0 },
  totalAnswers: { p1: 0, p2: 0 },
  totalResponseTime: { p1: 0, p2: 0 },
  ready: { p1: false, p2: false },
  matchStartTime: null,
  inputMode: 'multiple_choice',
  isStunned: false,
  numpadValue: '',
  difficulty: 'medium',
  winThreshold: 100,
  opponentName: 'Lawan',
};

// ─── DOM Elements ──────────────────────────────────────────────────────────
const DOM = {
  mainMenu: document.getElementById('main-menu'),
  waitingRoom: document.getElementById('waiting-room'),
  gameScreen: document.getElementById('game-screen'),
  matchOver: document.getElementById('match-over'),
  createRoomModal: document.getElementById('create-room-modal'),
  joinRoomModal: document.getElementById('join-room-modal'),
  countdownOverlay: document.getElementById('countdown-overlay'),
  countdownNumber: document.getElementById('countdown-number'),
  matchmakingOverlay: document.getElementById('matchmaking-overlay'),
  matchmakingStatus: document.getElementById('matchmaking-status'),
  matchmakingTimer: document.getElementById('matchmaking-timer'),
  matchmakingDiff: document.getElementById('matchmaking-diff'),
  btnCancelMatchmaking: document.getElementById('btn-cancel-matchmaking'),
  
  btnQuickMatch: document.getElementById('btn-quick-match'),
  btnCreateRoom: document.getElementById('btn-create-room'),
  btnJoinRoom: document.getElementById('btn-join-room'),
  diffBtns: document.querySelectorAll('.diff-btn'),
  
  playerName: document.getElementById('player-name'),
  inputModeGroup: document.getElementById('inputModeGroup'),
  inputMode: document.getElementById('inputMode'),
  thresholdGroup: document.getElementById('thresholdGroup'),
  winThreshold: document.getElementById('winThreshold'),
  btnConfirmCreate: document.getElementById('btn-confirm-create'),
  btnCancelCreate: document.getElementById('btn-cancel-create'),
  
  joinPlayerName: document.getElementById('join-player-name'),
  roomCode: document.getElementById('room-code'),
  btnConfirmJoin: document.getElementById('btn-confirm-join'),
  btnCancelJoin: document.getElementById('btn-cancel-join'),
  
  roomCodeDisplay: document.getElementById('room-code-display'),
  slotP1: document.getElementById('slot-p1'),
  slotP2: document.getElementById('slot-p2'),
  p1NameWaiting: document.getElementById('p1-name'),
  p2NameWaiting: document.getElementById('p2-name'),
  btnReady: document.getElementById('btn-ready'),
  btnLeaveRoom: document.getElementById('btn-leave-room'),
  btnLeaveGame: document.getElementById('btn-leave-game'),
  btnCopyCode: document.getElementById('btn-copy-code'),
  
  gameRoomCode: document.getElementById('game-room-code'),
  matchTime: document.getElementById('match-time'),
  pingDisplay: document.getElementById('ping-display'),
  p1Score: document.getElementById('p1-score'),
  p2Score: document.getElementById('p2-score'),
  p1NameGame: document.getElementById('p1-name-game'),
  p2NameGame: document.getElementById('p2-name-game'),
  p1Streak: document.getElementById('p1-streak'),
  p2Streak: document.getElementById('p2-streak'),
  gameArena: document.getElementById('game-arena'),
  ropeTrack: document.getElementById('rope-track'),
  ropeLine: document.getElementById('rope-line'),
  ropeFlag: document.getElementById('rope-flag'),
  ropeIndicator: document.getElementById('rope-indicator'),
  ropeDangerLeft: document.getElementById('rope-danger-left'),
  ropeDangerRight: document.getElementById('rope-danger-right'),
  zoneLabelLeft: document.getElementById('zone-left-label'),
  zoneLabelRight: document.getElementById('zone-right-label'),
  questionPrompt: document.getElementById('question-prompt'),
  questionCategory: document.getElementById('question-category'),
  timerBar: document.getElementById('timer-bar'),
  forceDisplay: document.getElementById('force-display'),
  forceValue: document.querySelector('.force-value'),
  responseTime: document.getElementById('response-time'),
  answerOptions: document.getElementById('answer-options'),
  numpadContainer: document.getElementById('numpad-container'),
  numpadDisplay: document.getElementById('numpad-display'),
  
  feedbackOverlay: document.getElementById('feedback-overlay'),
  stunOverlay: document.getElementById('stun-overlay'),
  stunIcon: document.getElementById('stun-icon'),
  
  resultTitle: document.getElementById('result-title'),
  resultSubtitle: document.getElementById('result-subtitle'),
  finalRopePos: document.getElementById('final-rope-pos'),
  finalDuration: document.getElementById('final-duration'),
  confettiContainer: document.getElementById('confetti-container'),
  trophyIcon: document.getElementById('trophy-icon'),
  btnRematch: document.getElementById('btn-rematch'),
  btnBackMenu: document.getElementById('btn-back-menu'),
  
  connectionStatus: document.getElementById('connection-status'),
  soundToggle: document.getElementById('sound-toggle'),
  soundIcon: document.getElementById('sound-icon'),
};

// ─── SVG Icon Injection ────────────────────────────────────────────────────
function injectIcons() {
  if (!window.GameIcons) return;
  
  const iconMap = {
    'lightning': GameIcons.lightning,
    'house': GameIcons.house,
    'door': GameIcons.door,
    'pencil': GameIcons.pencil,
    'numpad': GameIcons.numpad,
    'seedling': GameIcons.seedling,
    'flame': GameIcons.flame,
    'skull': GameIcons.skull,
    'key': GameIcons.key,
    'stopwatch': GameIcons.stopwatch,
    'power': GameIcons.power,
    'flag': GameIcons.flag,
    'fireStreak': GameIcons.fireStreak,
    'clipboard': GameIcons.clipboard,
    'hourglass': GameIcons.hourglass,
    'lightbulb': GameIcons.lightbulb,
    'check': GameIcons.check,
    'backspace': GameIcons.backspace,
    'refresh': GameIcons.refresh,
    'trophy': GameIcons.trophy,
  };
  
  // Inject all data-icon elements
  document.querySelectorAll('[data-icon]').forEach(el => {
    const iconName = el.dataset.icon;
    if (iconMap[iconName]) {
      el.innerHTML = iconMap[iconName]();
    }
  });
  
  // Inject specific named elements
  const logoEl = document.getElementById('logo-icon');
  if (logoEl) logoEl.innerHTML = GameIcons.abacus();
  
  const charP1Wait = document.getElementById('char-p1-waiting');
  if (charP1Wait) charP1Wait.innerHTML = GameIcons.characterP1(false);
  
  const charP2Wait = document.getElementById('char-p2-waiting');
  if (charP2Wait) charP2Wait.innerHTML = GameIcons.characterP2(false);
  
  const charP1Game = document.getElementById('char-p1-game');
  if (charP1Game) charP1Game.innerHTML = GameIcons.characterP1(true);
  
  const charP2Game = document.getElementById('char-p2-game');
  if (charP2Game) charP2Game.innerHTML = GameIcons.characterP2(true);
  
  if (DOM.stunIcon) DOM.stunIcon.innerHTML = GameIcons.crossMark();
  if (DOM.trophyIcon) DOM.trophyIcon.innerHTML = GameIcons.trophy();
  if (DOM.soundIcon) DOM.soundIcon.innerHTML = GameIcons.speakerOn();
  
  // Stats avatars
  const statsP1Avatar = document.getElementById('stats-p1-avatar');
  if (statsP1Avatar) statsP1Avatar.innerHTML = GameIcons.characterP1(false);
  const statsP2Avatar = document.getElementById('stats-p2-avatar');
  if (statsP2Avatar) statsP2Avatar.innerHTML = GameIcons.characterP2(false);
}

// ─── Math Engine ───────────────────────────────────────────────────────────
const MathEngine = {
  generateQuestion(difficulty, seed) {
    const rng = new SeededRNG(seed);
    const ops = MathEngine._getOperators(difficulty);
    const op = ops[rng.nextInt(0, ops.length - 1)];

    let a, b, c, answer, prompt;

    switch (op) {
      case '+':
        a = rng.nextInt(1, difficulty === 'easy' ? 50 : 100);
        b = rng.nextInt(1, difficulty === 'easy' ? 50 : 100);
        answer = a + b;
        prompt = `${a} + ${b}`;
        break;
      case '-':
        a = rng.nextInt(10, difficulty === 'easy' ? 50 : 100);
        b = rng.nextInt(1, a);
        answer = a - b;
        prompt = `${a} − ${b}`;
        break;
      case '*':
        if (difficulty === 'hard') {
          a = rng.nextInt(2, 12);
          b = rng.nextInt(2, 12);
          if (rng.next() > 0.5) {
            c = rng.nextInt(1, 20);
            answer = a * b + c;
            prompt = `${a} × ${b} + ${c}`;
          } else {
            const product = a * b;
            c = rng.nextInt(1, Math.min(20, product));
            answer = product - c;
            prompt = `${a} × ${b} − ${c}`;
          }
        } else {
          a = rng.nextInt(2, 12);
          b = rng.nextInt(2, 12);
          answer = a * b;
          prompt = `${a} × ${b}`;
        }
        break;
      case '/':
        b = rng.nextInt(2, 12);
        answer = rng.nextInt(2, 12);
        a = b * answer;
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
      answer,
      difficulty,
      seed,
    };
  },

  _getOperators(difficulty) {
    switch (difficulty) {
      case 'easy': return ['+', '-'];
      case 'medium': return ['+', '-', '*'];
      case 'hard': return ['+', '-', '*', '/'];
      default: return ['+', '-'];
    }
  },

  _generateDistractors(answer, rng) {
    const distractors = new Set();
    if (answer + 1 >= 0) distractors.add(answer + 1);
    if (answer - 1 >= 0) distractors.add(answer - 1);
    if (answer + 10 >= 0) distractors.add(answer + 10);
    if (answer - 10 >= 0) distractors.add(answer - 10);
    distractors.delete(answer);
    let safety = 0;
    while (distractors.size < 3 && safety < 50) {
      safety++;
      const d = answer + rng.nextInt(-20, 20);
      if (d !== answer && d >= 0) distractors.add(d);
    }
    const allOptions = [...distractors].slice(0, 3);
    allOptions.push(answer);
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i);
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    return allOptions;
  },

  calculateForce(responseTimeSec, difficulty, streak) {
    const F_BASE = difficulty === 'easy' ? 12 : difficulty === 'hard' ? 20 : 15;
    const LAMBDA = 0.35;
    const MIN_MULT = 0.20;
    const decay = Math.exp(-LAMBDA * responseTimeSec);
    const multiplier = Math.max(decay, MIN_MULT);
    const combo = Math.min(1.0 + 0.1 * streak, 1.5);
    return Math.round(F_BASE * multiplier * combo * 10) / 10;
  }
};

class SeededRNG {
  constructor(seed) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// ─── Per-Player Question State ─────────────────────────────────────────────
const playerQuestions = {
  p1: { current: null, seed: null },
  p2: { current: null, seed: null },
};

let questionCounter = 0;

function generateNewQuestion(playerSlot) {
  questionCounter++;
  const seed = Date.now() + Math.floor(Math.random() * 1000000) + questionCounter * 1000 + (playerSlot === 'p1' ? 1 : 2);
  playerQuestions[playerSlot].seed = seed;
  const question = MathEngine.generateQuestion(GameState.difficulty, seed);
  playerQuestions[playerSlot].current = question;
  return question;
}

// ─── Screen Management ─────────────────────────────────────────────────────
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    screen.style.animation = 'none';
    screen.offsetHeight;
    screen.style.animation = '';
  }
}

function showModal(modal) {
  if (modal) modal.classList.add('active');
}

function hideModal(modal) {
  if (modal) modal.classList.remove('active');
}

// ─── Connection Handling ───────────────────────────────────────────────────
function updateConnectionStatus(status, text) {
  if (!DOM.connectionStatus) return;
  DOM.connectionStatus.className = `connection-status ${status}`;
  DOM.connectionStatus.querySelector('.status-text').textContent = text;
}

// ─── Countdown System ──────────────────────────────────────────────────────
function showCountdown(callback) {
  const overlay = DOM.countdownOverlay;
  const numEl = DOM.countdownNumber;
  if (!overlay || !numEl) { callback(); return; }
  
  overlay.classList.add('active');
  let count = 3;
  
  numEl.textContent = count;
  numEl.className = 'countdown-number countdown-pulse';
  if (window.SoundEngine) SoundEngine.play('countdown');
  
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      numEl.textContent = count;
      numEl.className = 'countdown-number countdown-pulse';
      // Force reflow for animation restart
      numEl.offsetHeight;
      numEl.className = 'countdown-number countdown-pulse active';
      if (window.SoundEngine) SoundEngine.play('countdown');
    } else if (count === 0) {
      numEl.textContent = 'GO!';
      numEl.className = 'countdown-number countdown-go';
      if (window.SoundEngine) SoundEngine.play('countdownGo');
    } else {
      clearInterval(interval);
      overlay.classList.remove('active');
      callback();
    }
  }, 800);
}

// ─── Peer Event Handlers ───────────────────────────────────────────────────
PeerManager.onConnected(() => {
  console.log('PEER: Connected!');
  updateConnectionStatus('connected', 'Terhubung');
  
  if (GameState.isHost) {
    showScreen('waiting-room');
    if (DOM.roomCodeDisplay) DOM.roomCodeDisplay.textContent = GameState.roomId;
    if (DOM.p1NameWaiting) DOM.p1NameWaiting.textContent = GameState.playerName;
  } else {
    PeerManager.send({
      type: 'JOIN',
      playerName: GameState.playerName,
    });
    showScreen('waiting-room');
    if (DOM.roomCodeDisplay) DOM.roomCodeDisplay.textContent = GameState.roomId;
    if (DOM.p2NameWaiting) DOM.p2NameWaiting.textContent = GameState.playerName;
  }
});

PeerManager.onDisconnected(() => {
  console.log('PEER: Disconnected');
  updateConnectionStatus('disconnected', 'Terputus!');
  if (window.SoundEngine) SoundEngine.play('wrong');
  
  if (GameState.isPlaying) {
    GameState.isPlaying = false;
    alert(`${GameState.opponentName || 'Lawan'} terputus!`);
    showScreen('main-menu');
    return;
  }
  
  // Reset ready states if in waiting room
  if (GameState.ready) {
    GameState.ready.p1 = false;
    GameState.ready.p2 = false;
    
    // Update UI safely if functions are available
    if (typeof updateReadyUI === 'function') {
      updateReadyUI('p1', false);
      updateReadyUI('p2', false);
    }
    
    if (DOM.btnReady) {
      DOM.btnReady.disabled = false;
      DOM.btnReady.innerHTML = '<span class="btn-icon" data-icon="check"></span><span>READY</span>';
      if (typeof injectIcons === 'function') injectIcons();
    }
    
    // Reset guest UI if we are host
    if (GameState.isHost) {
      const card = document.getElementById('slot-p2');
      if (card) card.classList.remove('connected', 'ready');
      const nameEl = document.getElementById('p2-name');
      if (nameEl) nameEl.textContent = 'Menunggu...';
    }
  }
});

PeerManager.onData((data) => {
  console.log('PEER: Data received:', data.type);
  handlePeerData(data);
});

function handlePeerData(data) {
  switch (data.type) {
    case 'JOIN':
      handleGuestJoin(data);
      break;
    case 'HOST_INFO':
      GameState.opponentName = data.playerName || 'Host';
      const nameEl = document.getElementById('p1-name');
      if (nameEl) nameEl.textContent = data.playerName;
      break;
    case 'GAME_START':
      handleGameStart(data);
      break;
    case 'ANSWER':
      handleOpponentAnswer(data);
      break;
    case 'PLAYER_READY':
      handlePlayerReady(data);
      break;
    case 'GAME_STATE':
      handleGameState(data);
      break;
    case 'MATCH_OVER':
      handleMatchOver(data);
      break;
    case 'REMATCH':
      handleRematch(data);
      break;
  }
}

// ─── Host: Guest Joins ────────────────────────────────────────────────────
function handleGuestJoin(data) {
  if (!GameState.isHost) return;
  
  GameState.roomId = PeerManager.roomCode;
  GameState.opponentName = data.playerName || 'Lawan';
  
  const card = document.getElementById('slot-p2');
  if (card) {
    card.classList.add('connected');
    const nameEl = document.getElementById('p2-name');
    if (nameEl) nameEl.textContent = data.playerName;
  }
  
  if (window.SoundEngine) SoundEngine.play('notify');
  
  // Send host info back to guest
  PeerManager.send({
    type: 'HOST_INFO',
    playerName: GameState.playerName,
  });
}

function handlePlayerReady(data) {
  if (GameState.isHost) {
    GameState.ready.p2 = true;
    updateReadyUI('p2', true);
    checkAllReady();
  } else {
    GameState.ready.p1 = true;
    updateReadyUI('p1', true);
  }
  if (window.SoundEngine) SoundEngine.play('notify');
}

function updateReadyUI(slot, isReady) {
  const card = document.getElementById(`slot-${slot}`);
  if (card) {
    const badgeText = card.querySelector('.badge-text');
    const badgeIcon = card.querySelector('.badge-icon');
    if (badgeText) badgeText.textContent = isReady ? 'SIAP!' : 'Belum Ready';
    if (badgeIcon && window.GameIcons) {
      badgeIcon.innerHTML = isReady ? GameIcons.check() : GameIcons.hourglass();
    }
    if (isReady) {
      card.classList.add('ready');
    } else {
      card.classList.remove('ready');
    }
  }
}

function checkAllReady() {
  if (GameState.isHost && GameState.ready.p1 && GameState.ready.p2) {
    setTimeout(() => {
      startGame();
    }, 1000);
  }
}

// ─── Start Game ────────────────────────────────────────────────────────────
function startGame() {
  GameState.isPlaying = false; // Will be set true after countdown
  GameState.matchStartTime = Date.now();
  GameState.scores = { p1: 0, p2: 0 };
  GameState.streaks = { p1: 0, p2: 0 };
  GameState.maxStreaks = { p1: 0, p2: 0 };
  GameState.correctCounts = { p1: 0, p2: 0 };
  GameState.totalAnswers = { p1: 0, p2: 0 };
  GameState.totalResponseTime = { p1: 0, p2: 0 };
  GameState.ropePosition = 0;
  
  const q1 = generateNewQuestion('p1');
  const q2 = generateNewQuestion('p2');
  
  if (GameState.isHost) {
    PeerManager.send({
      type: 'GAME_START',
      settings: { 
        difficulty: GameState.difficulty, 
        winThreshold: GameState.winThreshold,
        inputMode: GameState.inputMode 
      },
      question: { questionId: q2.questionId, prompt: q2.prompt, options: q2.options },
    });
  }
  
  startGameLocal(q1);
}

function handleGameStart(data) {
  if (GameState.isHost) return;
  
  GameState.difficulty = data.settings.difficulty;
  GameState.winThreshold = data.settings.winThreshold;
  GameState.inputMode = data.settings.inputMode || 'multiple_choice';
  
  const question = data.question;
  playerQuestions.p2.current = {
    questionId: question.questionId,
    prompt: question.prompt,
    options: question.options,
    answer: null,
  };
  
  startGameLocal(question);
}

function startGameLocal(question) {
  showScreen('game-screen');
  GameState.matchStartTime = Date.now();
  
  if (DOM.gameRoomCode) DOM.gameRoomCode.textContent = GameState.roomId;
  
  // Set player names correctly based on slot
  if (GameState.slot === 'p1') {
    if (DOM.p1NameGame) DOM.p1NameGame.textContent = GameState.playerName;
    if (DOM.p2NameGame) DOM.p2NameGame.textContent = GameState.opponentName;
  } else {
    if (DOM.p1NameGame) DOM.p1NameGame.textContent = GameState.opponentName;
    if (DOM.p2NameGame) DOM.p2NameGame.textContent = GameState.playerName;
  }
  
  // Update zone labels to match threshold
  updateZoneLabels();
  
  updateScoreDisplay();
  updateRopePosition(0);
  
  // Show countdown, then start the actual game
  showCountdown(() => {
    GameState.isPlaying = true;
    GameState.matchStartTime = Date.now();
    showQuestion(question);
    startMatchTimer();
  });
}

// ─── Zone Labels ───────────────────────────────────────────────────────────
function updateZoneLabels() {
  if (DOM.zoneLabelLeft) DOM.zoneLabelLeft.textContent = `−${GameState.winThreshold}`;
  if (DOM.zoneLabelRight) DOM.zoneLabelRight.textContent = `+${GameState.winThreshold}`;
}

// ─── Question Display ──────────────────────────────────────────────────────
function showQuestion(question) {
  if (!question || GameState.isStunned) return;
  
  GameState.currentQuestion = question;
  GameState.numpadValue = '';
  
  if (DOM.questionPrompt) {
    DOM.questionPrompt.textContent = question.prompt;
    DOM.questionPrompt.style.animation = 'none';
    DOM.questionPrompt.offsetHeight;
    DOM.questionPrompt.style.animation = 'questionPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }
  
  if (DOM.questionCategory) DOM.questionCategory.textContent = 'SOAL';
  if (DOM.responseTime) DOM.responseTime.textContent = '-- ms';
  
  if (GameState.inputMode === 'numpad') {
    if (DOM.answerOptions) DOM.answerOptions.style.display = 'none';
    if (DOM.numpadContainer) DOM.numpadContainer.style.display = 'block';
    if (DOM.numpadDisplay) DOM.numpadDisplay.textContent = '0';
  } else {
    if (DOM.answerOptions) DOM.answerOptions.style.display = 'grid';
    if (DOM.numpadContainer) DOM.numpadContainer.style.display = 'none';
    renderAnswerOptions(question.options);
  }
  
  if (window.SoundEngine) SoundEngine.play('newQuestion');
  startTimerBar();
}

function renderAnswerOptions(options) {
  if (!DOM.answerOptions) return;
  DOM.answerOptions.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.style.animation = `fadeInUp 0.3s ease-out ${idx * 0.05}s both`;
    btn.addEventListener('click', () => submitAnswer(opt));
    DOM.answerOptions.appendChild(btn);
  });
}

// ─── Timer Bar ─────────────────────────────────────────────────────────────
let timerBarInterval = null;
let timerStartTime = null;

function startTimerBar() {
  if (timerBarInterval) clearInterval(timerBarInterval);
  timerStartTime = Date.now();
  const totalDuration = 10000;
  
  timerBarInterval = setInterval(() => {
    const elapsed = Date.now() - timerStartTime;
    const remaining = Math.max(0, 1 - (elapsed / totalDuration));
    
    if (DOM.timerBar) DOM.timerBar.style.transform = `scaleX(${remaining})`;
    
    const responseTimeSec = elapsed / 1000;
    const force = calculateForcePreview(responseTimeSec);
    if (DOM.forceValue) DOM.forceValue.textContent = force;
    
    if (remaining <= 0) clearInterval(timerBarInterval);
  }, 50);
}

function calculateForcePreview(responseTimeSec) {
  const F_BASE = GameState.difficulty === 'easy' ? 12 : GameState.difficulty === 'hard' ? 20 : 15;
  const decay = Math.exp(-0.35 * responseTimeSec);
  const multiplier = Math.max(decay, 0.20);
  return Math.round(F_BASE * multiplier * 10) / 10;
}

// ─── Answer Submission ─────────────────────────────────────────────────────
function submitAnswer(answer) {
  if (!GameState.currentQuestion || GameState.isStunned || !GameState.isPlaying) return;
  
  if (timerBarInterval) clearInterval(timerBarInterval);
  
  const responseTime = Date.now() - timerStartTime;
  if (DOM.responseTime) DOM.responseTime.textContent = `${responseTime} ms`;
  
  if (GameState.inputMode === 'multiple_choice') {
    document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
  }
  
  if (GameState.isHost) {
    // Host validates locally
    const question = playerQuestions.p1.current;
    const isCorrect = (answer === question.answer);
    const responseTimeSec = Math.max(0.1, responseTime / 1000);
    
    GameState.totalAnswers.p1++;
    GameState.totalResponseTime.p1 += responseTime;
    
    let forceApplied = 0;
    let nextQuestion = null;
    
    if (isCorrect) {
      GameState.correctCounts.p1++;
      GameState.streaks.p1++;
      if (GameState.streaks.p1 > GameState.maxStreaks.p1) GameState.maxStreaks.p1 = GameState.streaks.p1;
      
      const force = MathEngine.calculateForce(responseTimeSec, GameState.difficulty, GameState.streaks.p1);
      forceApplied = force;
      GameState.ropePosition -= force;
      GameState.scores.p1 += force;
      
      // Clamp to slightly beyond threshold for visual effect
      const clampMax = GameState.winThreshold + 20;
      GameState.ropePosition = Math.max(-clampMax, Math.min(clampMax, GameState.ropePosition));
      nextQuestion = generateNewQuestion('p1');
    } else {
      GameState.streaks.p1 = 0;
    }
    
    // Show feedback
    if (isCorrect) {
      showFeedback('correct', 'BENAR!', `+${forceApplied} pts`);
      triggerPullAnimation('p1', forceApplied);
      if (window.SoundEngine) {
        SoundEngine.play(GameState.streaks.p1 >= 3 ? 'combo' : 'correct', GameState.streaks.p1);
        SoundEngine.play('pull');
        if (GameState.streaks.p1 >= 5) SoundEngine.play('bigCombo');
      }
      // Sparks on big streaks
      if (GameState.streaks.p1 >= 3) {
        const rect = DOM.questionPrompt?.getBoundingClientRect();
        if (rect) createSparks(rect.left + rect.width / 2, rect.top, 8, '#00d2a0');
      }
      if (GameState.streaks.p1 >= 5) createConfetti('game-confetti', 15);
    } else {
      showFeedback('wrong', 'SALAH!', `Jawaban: ${question.answer}`);
      triggerStun();
      if (window.SoundEngine) {
        SoundEngine.play('wrong');
        SoundEngine.play('screenShake');
      }
      triggerScreenShake('medium');
    }
    
    // Update UI
    updateRopePosition(GameState.ropePosition);
    updateScoreDisplay();
    updateStreakDisplay();
    
    // Show next question if correct
    if (nextQuestion) {
      showQuestion(nextQuestion);
    }
    
    // Send state to guest
    PeerManager.send({
      type: 'GAME_STATE',
      answeredBy: 'p1',
      isCorrect,
      forceApplied,
      responseTimeMs: responseTime,
      correctAnswer: question.answer,
      ropePosition: GameState.ropePosition,
      scores: GameState.scores,
      streaks: GameState.streaks,
      nextQuestion: null,
      winnerId: checkWinner(),
    });
    
    const winnerId = checkWinner();
    if (winnerId) endMatch(winnerId);
  } else {
    // Guest sends to host for validation
    PeerManager.send({
      type: 'ANSWER',
      questionId: GameState.currentQuestion.questionId,
      submittedAnswer: answer,
      clientTimestamp: Date.now(),
      responseTimeMs: responseTime,
    });
  }
}

// ─── Handle Answer (Host receives from Guest) ─────────────────────────────
function handleOpponentAnswer(data) {
  if (!GameState.isHost) return;
  
  const question = playerQuestions.p2.current;
  const isCorrect = (data.submittedAnswer === question.answer);
  const responseTimeMs = data.responseTimeMs || 0;
  const responseTimeSec = Math.max(0.1, responseTimeMs / 1000);
  
  GameState.totalAnswers.p2++;
  GameState.totalResponseTime.p2 += responseTimeMs;
  
  let forceApplied = 0;
  let nextQuestion = null;
  
  if (isCorrect) {
    GameState.correctCounts.p2++;
    GameState.streaks.p2++;
    if (GameState.streaks.p2 > GameState.maxStreaks.p2) GameState.maxStreaks.p2 = GameState.streaks.p2;
    
    const force = MathEngine.calculateForce(responseTimeSec, GameState.difficulty, GameState.streaks.p2);
    forceApplied = force;
    GameState.ropePosition += force;
    GameState.scores.p2 += force;
    
    const clampMax = GameState.winThreshold + 20;
    GameState.ropePosition = Math.max(-clampMax, Math.min(clampMax, GameState.ropePosition));
    nextQuestion = generateNewQuestion('p2');
  } else {
    GameState.streaks.p2 = 0;
  }
  
  // Update host's rope visual (opponent pulling)
  updateRopePosition(GameState.ropePosition);
  updateScoreDisplay();
  updateStreakDisplay();
  
  // Play opponent pull sound on host side
  if (isCorrect) {
    triggerPullAnimation('p2', forceApplied);
    if (window.SoundEngine) SoundEngine.play('ropeCreak');
  }
  
  // Send result back to guest
  PeerManager.send({
    type: 'GAME_STATE',
    answeredBy: 'p2',
    isCorrect,
    forceApplied,
    responseTimeMs,
    correctAnswer: question.answer,
    ropePosition: GameState.ropePosition,
    scores: GameState.scores,
    streaks: GameState.streaks,
    nextQuestion: nextQuestion ? {
      questionId: nextQuestion.questionId,
      prompt: nextQuestion.prompt,
      options: nextQuestion.options,
    } : null,
    winnerId: checkWinner(),
  });
  
  const winnerId = checkWinner();
  if (winnerId) endMatch(winnerId);
}

function handleGameState(data) {
  updateGameStateLocal(data);
  
  // If this was OUR answer result (guest side)
  if (data.answeredBy === GameState.slot) {
    if (data.isCorrect && data.nextQuestion) {
      // Correct: show next question
      showQuestion(data.nextQuestion);
    }
    // Wrong answer: stun is already triggered in updateGameStateLocal,
    // and after stun ends the buttons are re-enabled so player can retry
    // the same question that's still displayed.
  }
  
  if (data.winnerId) {
    endMatch(data.winnerId);
  }
}

function updateGameStateLocal(data) {
  if (data.ropePosition !== undefined) {
    updateRopePosition(data.ropePosition);
  }
  
  if (data.scores) {
    GameState.scores = data.scores;
    updateScoreDisplay();
  }
  
  if (data.streaks) {
    GameState.streaks = data.streaks;
    updateStreakDisplay();
  }
  
  if (data.isCorrect !== undefined && data.answeredBy) {
    if (data.answeredBy === GameState.slot) {
      if (data.isCorrect) {
        showFeedback('correct', 'BENAR!', `+${data.forceApplied} pts`);
        triggerPullAnimation(GameState.slot, data.forceApplied);
        if (window.SoundEngine) {
          const streak = GameState.streaks[GameState.slot] || 0;
          SoundEngine.play(streak >= 3 ? 'combo' : 'correct', streak);
          SoundEngine.play('pull');
          if (streak >= 5) SoundEngine.play('bigCombo');
        }
        
        const currentStreak = GameState.streaks[GameState.slot] || 0;
        if (currentStreak >= 3) {
          const rect = DOM.questionPrompt?.getBoundingClientRect();
          if (rect) createSparks(rect.left + rect.width / 2, rect.top, 8, '#00d2a0');
        }
        if (currentStreak >= 5) createConfetti('game-confetti', 15);
      } else {
        showFeedback('wrong', 'SALAH!', `Jawaban: ${data.correctAnswer}`);
        triggerStun();
        if (window.SoundEngine) {
          SoundEngine.play('wrong');
          SoundEngine.play('screenShake');
        }
        triggerScreenShake('medium');
      }
    } else {
      // It was the opponent's answer
      if (data.isCorrect) {
        triggerPullAnimation(data.answeredBy, data.forceApplied);
        if (window.SoundEngine) SoundEngine.play('ropeCreak');
      }
    }
  }
}

function updateScoreDisplay() {
  if (DOM.p1Score) DOM.p1Score.textContent = Math.round(GameState.scores.p1 || 0);
  if (DOM.p2Score) DOM.p2Score.textContent = Math.round(GameState.scores.p2 || 0);
}

function updateStreakDisplay() {
  if (DOM.p1Streak) {
    const count = GameState.streaks.p1 || 0;
    DOM.p1Streak.querySelector('.streak-count').textContent = count;
    DOM.p1Streak.classList.toggle('hot', count >= 3);
  }
  if (DOM.p2Streak) {
    const count = GameState.streaks.p2 || 0;
    DOM.p2Streak.querySelector('.streak-count').textContent = count;
    DOM.p2Streak.classList.toggle('hot', count >= 3);
  }
}

// ─── Rope Position & Animation ─────────────────────────────────────────────
let ropeAnimFrame = null;
let ropeTargetPos = 0;
let ropeCurrent = 0;

function updateRopePosition(position) {
  GameState.ropePosition = position;
  ropeTargetPos = position;
  
  if (!ropeAnimFrame) {
    animateRope();
  }
  
  // Update danger zone indicators
  updateDangerZones(position);
  
  // Arena tint based on winning side
  updateArenaTint(position);
  
  // Near-win sound
  const absPos = Math.abs(position);
  if (absPos > GameState.winThreshold * 0.7 && absPos < GameState.winThreshold) {
    if (window.SoundEngine) SoundEngine.play('nearWin');
  }
}

function animateRope() {
  const ease = 0.12;
  ropeCurrent += (ropeTargetPos - ropeCurrent) * ease;
  
  if (Math.abs(ropeTargetPos - ropeCurrent) < 0.1) {
    ropeCurrent = ropeTargetPos;
    ropeAnimFrame = null;
  } else {
    ropeAnimFrame = requestAnimationFrame(animateRope);
  }
  
  const threshold = GameState.winThreshold;
  const maxRange = threshold + 20;
  
  // Flag position
  if (DOM.ropeFlag) {
    const percent = ((ropeCurrent + maxRange) / (maxRange * 2)) * 100;
    DOM.ropeFlag.style.left = `${Math.max(3, Math.min(97, percent))}%`;
  }
  
  // Indicator
  if (DOM.ropeIndicator) {
    const percent = ((ropeCurrent + maxRange) / (maxRange * 2)) * 100;
    DOM.ropeIndicator.style.left = `${Math.max(0, Math.min(100, percent))}%`;
  }
}

function updateDangerZones(position) {
  const threshold = GameState.winThreshold;
  const dangerStart = threshold * 0.7;
  
  if (DOM.ropeDangerLeft) {
    const inDanger = position <= -dangerStart;
    DOM.ropeDangerLeft.classList.toggle('active', inDanger);
  }
  if (DOM.ropeDangerRight) {
    const inDanger = position >= dangerStart;
    DOM.ropeDangerRight.classList.toggle('active', inDanger);
  }
}

function updateArenaTint(position) {
  if (!DOM.gameArena) return;
  const threshold = GameState.winThreshold;
  const ratio = position / threshold;
  
  if (Math.abs(ratio) > 0.3) {
    const intensity = Math.min(0.15, (Math.abs(ratio) - 0.3) * 0.3);
    const color = ratio < 0 ? `rgba(255, 107, 107, ${intensity})` : `rgba(72, 219, 251, ${intensity})`;
    DOM.gameArena.style.boxShadow = `inset 0 0 60px ${color}`;
  } else {
    DOM.gameArena.style.boxShadow = '';
  }
}

// ─── Pull Animation ────────────────────────────────────────────────────────
function triggerPullAnimation(playerSlot, force) {
  const charEl = playerSlot === 'p1' ? 
    document.getElementById('char-p1-game') : 
    document.getElementById('char-p2-game');
  
  if (!charEl) return;
  
  // Add pull class with intensity
  const intensity = force > 15 ? 'pull-hard' : force > 8 ? 'pull-medium' : 'pull-light';
  charEl.classList.add('pulling', intensity);
  
  setTimeout(() => {
    charEl.classList.remove('pulling', 'pull-hard', 'pull-medium', 'pull-light');
  }, 400);
  
  // Floating score near the character
  const rect = charEl.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top;
  const color = playerSlot === 'p1' ? '#ff6b6b' : '#48dbfb';
  showFloatingScore(`+${force}`, x, y, color);
}

function checkWinner() {
  if (GameState.ropePosition <= -GameState.winThreshold) return 'p1';
  if (GameState.ropePosition >= GameState.winThreshold) return 'p2';
  return null;
}

function endMatch(winnerId) {
  if (!GameState.isPlaying) return;
  GameState.isPlaying = false;
  
  // Clear all intervals
  if (timerBarInterval) { clearInterval(timerBarInterval); timerBarInterval = null; }
  if (matchTimerInterval) { clearInterval(matchTimerInterval); matchTimerInterval = null; }
  if (ropeAnimFrame) { cancelAnimationFrame(ropeAnimFrame); ropeAnimFrame = null; }
  
  const duration = Math.floor((Date.now() - GameState.matchStartTime) / 1000);
  const isWinner = winnerId === GameState.slot;
  
  if (DOM.resultTitle) {
    DOM.resultTitle.textContent = isWinner ? 'MENANG!' : 'KALAH!';
    DOM.resultTitle.className = `result-title ${isWinner ? 'result-win' : 'result-lose'}`;
  }
  
  if (DOM.resultSubtitle) {
    DOM.resultSubtitle.textContent = isWinner 
      ? 'Selamat! Kamu memenangkan pertandingan!' 
      : 'Lawan lebih kuat kali ini. Coba lagi!';
  }
  
  if (DOM.finalRopePos) DOM.finalRopePos.textContent = Math.round(GameState.ropePosition * 10) / 10;
  if (DOM.finalDuration) DOM.finalDuration.textContent = `${duration}s`;
  
  // Set player names in stats based on slot perspective
  const myName = GameState.playerName;
  const oppName = GameState.opponentName;
  
  updateMatchStats('p1', GameState.scores.p1, GameState.maxStreaks.p1, 
    GameState.correctCounts.p1 / Math.max(1, GameState.totalAnswers.p1),
    GameState.totalResponseTime.p1 / Math.max(1, GameState.totalAnswers.p1),
    GameState.slot === 'p1' ? myName : oppName);
  updateMatchStats('p2', GameState.scores.p2, GameState.maxStreaks.p2,
    GameState.correctCounts.p2 / Math.max(1, GameState.totalAnswers.p2),
    GameState.totalResponseTime.p2 / Math.max(1, GameState.totalAnswers.p2),
    GameState.slot === 'p2' ? myName : oppName);
  
  showScreen('match-over');
  
  if (isWinner && DOM.confettiContainer) {
    setTimeout(() => createConfetti('confetti-container', 60), 500);
  }
  
  if (window.SoundEngine) SoundEngine.play(isWinner ? 'win' : 'lose');
}

function updateMatchStats(slot, score, maxStreak, accuracy, avgTime, name) {
  const nameEl = document.getElementById(`stats-${slot}-name`);
  const accEl = document.getElementById(`stats-${slot}-accuracy`);
  const timeEl = document.getElementById(`stats-${slot}-avgtime`);
  const forceEl = document.getElementById(`stats-${slot}-force`);
  const streakEl = document.getElementById(`stats-${slot}-streak`);
  
  if (nameEl) nameEl.textContent = name;
  if (accEl) accEl.textContent = `${Math.round(accuracy * 100)}%`;
  if (timeEl) timeEl.textContent = `${Math.round(avgTime)}ms`;
  if (forceEl) forceEl.textContent = Math.round(score * 10) / 10;
  if (streakEl) streakEl.textContent = maxStreak;
}

function handleMatchOver(data) {
  endMatch(data.winnerId);
}

function handleRematch(data) {
  if (data.accept) {
    resetClientState();
    showScreen('waiting-room');
  }
}

function resetClientState() {
  GameState.isPlaying = false;
  GameState.currentQuestion = null;
  GameState.ropePosition = 0;
  GameState.scores = { p1: 0, p2: 0 };
  GameState.streaks = { p1: 0, p2: 0 };
  GameState.maxStreaks = { p1: 0, p2: 0 };
  GameState.correctCounts = { p1: 0, p2: 0 };
  GameState.totalAnswers = { p1: 0, p2: 0 };
  GameState.totalResponseTime = { p1: 0, p2: 0 };
  GameState.ready = { p1: false, p2: false };
  GameState.matchStartTime = null;
  GameState.isStunned = false;
  GameState.numpadValue = '';
  questionCounter = 0;
  playerQuestions.p1 = { current: null, seed: null };
  playerQuestions.p2 = { current: null, seed: null };
  
  // Reset ready button
  if (DOM.btnReady) {
    DOM.btnReady.disabled = false;
    DOM.btnReady.innerHTML = '<span class="btn-icon" data-icon="check"></span><span>READY</span>';
    injectIcons();
  }
  
  // Reset ready UI
  updateReadyUI('p1', false);
  updateReadyUI('p2', false);
}

// ─── Feedback & Effects ────────────────────────────────────────────────────
function showFeedback(type, text, points) {
  if (!DOM.feedbackOverlay) return;
  
  const iconEl = DOM.feedbackOverlay.querySelector('.feedback-icon');
  if (iconEl && window.GameIcons) {
    iconEl.innerHTML = type === 'correct' ? GameIcons.checkBurst() : GameIcons.crossMark();
  }
  
  const textEl = DOM.feedbackOverlay.querySelector('.feedback-text');
  if (textEl) textEl.textContent = text;
  
  const pointsEl = DOM.feedbackOverlay.querySelector('.feedback-points');
  if (pointsEl) pointsEl.textContent = points;
  
  // Update border color based on type
  const content = DOM.feedbackOverlay.querySelector('.feedback-content');
  if (content) {
    content.style.borderColor = type === 'correct' ? 'var(--accent-success)' : 'var(--accent-danger)';
  }
  
  DOM.feedbackOverlay.classList.add('show');
  setTimeout(() => DOM.feedbackOverlay.classList.remove('show'), 1200);
}

function triggerStun() {
  GameState.isStunned = true;
  if (DOM.stunOverlay) DOM.stunOverlay.classList.add('active');
  setTimeout(() => {
    if (DOM.stunOverlay) DOM.stunOverlay.classList.remove('active');
    GameState.isStunned = false;
    // Re-enable all answer buttons
    document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = false);
  }, 600);
}

// Input toggle
if (DOM.btnInputToggle) {
  DOM.btnInputToggle.addEventListener('click', () => {
    const isNumpad = GameState.inputMode === 'numpad';
    GameState.inputMode = isNumpad ? 'multiple_choice' : 'numpad';
    
    DOM.btnInputToggle.innerHTML = isNumpad 
      ? '<span class="btn-icon" data-icon="numpad"></span> OPSI GANDA'
      : '<span class="btn-icon" data-icon="numpad"></span> NUMPAD';
      
    injectIcons();
    if (window.SoundEngine) SoundEngine.play('click');
  });
}

// Ready Button
if (DOM.btnReady) {
  DOM.btnReady.addEventListener('click', () => {
    if (GameState.isHost) {
      GameState.ready.p1 = true;
      updateReadyUI('p1', true);
      PeerManager.send({ type: 'PLAYER_READY' });
      checkAllReady();
    } else {
      GameState.ready.p2 = true;
      updateReadyUI('p2', true);
      PeerManager.send({ type: 'PLAYER_READY' });
    }
    DOM.btnReady.disabled = true;
    DOM.btnReady.innerHTML = '<span class="btn-icon" data-icon="hourglass"></span><span>MENUNGGU</span>';
    injectIcons();
    if (window.SoundEngine) SoundEngine.play('click');
  });
}

// ─── Match Timer ───────────────────────────────────────────────────────────
let matchTimerInterval = null;

function startMatchTimer() {
  if (matchTimerInterval) clearInterval(matchTimerInterval);
  matchTimerInterval = setInterval(() => {
    if (!GameState.isPlaying) { clearInterval(matchTimerInterval); matchTimerInterval = null; return; }
    const elapsed = Math.floor((Date.now() - GameState.matchStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    if (DOM.matchTime) DOM.matchTime.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

// ─── Toggle Buttons ────────────────────────────────────────────────────────
function setupToggleButtons() {
  if (DOM.inputModeGroup) {
    const btns = DOM.inputModeGroup.querySelectorAll('.toggle-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const value = btn.dataset.value;
        if (DOM.inputMode) DOM.inputMode.value = value;
        GameState.inputMode = value;
        if (window.SoundEngine) SoundEngine.play('click');
      });
    });
  }
  
  if (DOM.thresholdGroup) {
    const btns = DOM.thresholdGroup.querySelectorAll('.toggle-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const value = parseInt(btn.dataset.value);
        if (DOM.winThreshold) DOM.winThreshold.value = value;
        GameState.winThreshold = value;
        if (window.SoundEngine) SoundEngine.play('click');
      });
    });
  }
}

// ─── Difficulty Selection ─────────────────────────────────────────────────
if (DOM.diffBtns) {
  DOM.diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.difficulty = btn.dataset.diff;
      if (window.SoundEngine) SoundEngine.play('click');
    });
  });
}

// ─── Matchmaking Overlay Control ───────────────────────────────────────────
let matchmakingTimerInterval = null;

function showMatchmakingOverlay() {
  if (DOM.matchmakingOverlay) {
    DOM.matchmakingOverlay.classList.add('active');
    injectIcons();
  }
  // Start timer
  const startTime = Date.now();
  if (DOM.matchmakingTimer) DOM.matchmakingTimer.textContent = '00:00';
  matchmakingTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    if (DOM.matchmakingTimer) DOM.matchmakingTimer.textContent = `${mins}:${secs}`;
  }, 1000);
  // Set difficulty badge
  const diffNames = { easy: 'MUDAH', medium: 'SEDANG', hard: 'SULIT' };
  if (DOM.matchmakingDiff) {
    DOM.matchmakingDiff.innerHTML = `<span class="diff-badge">${diffNames[GameState.difficulty] || 'SEDANG'}</span>`;
  }
}

function hideMatchmakingOverlay() {
  if (DOM.matchmakingOverlay) DOM.matchmakingOverlay.classList.remove('active');
  if (matchmakingTimerInterval) {
    clearInterval(matchmakingTimerInterval);
    matchmakingTimerInterval = null;
  }
}

// Listen for matchmaking status updates from PeerManager
PeerManager.onMatchmakingStatus((status, detail) => {
  console.log('[GAME] Matchmaking status:', status, detail);
  if (DOM.matchmakingStatus) DOM.matchmakingStatus.textContent = detail;
  
  if (status === 'scanning') {
    if (DOM.matchmakingOverlay) {
      const title = DOM.matchmakingOverlay.querySelector('.matchmaking-title');
      if (title) title.textContent = 'Mencari Lawan...';
    }
  } else if (status === 'waiting') {
    if (DOM.matchmakingOverlay) {
      const title = DOM.matchmakingOverlay.querySelector('.matchmaking-title');
      if (title) title.textContent = 'Menunggu Lawan...';
    }
  }
});

// ─── Menu Event Listeners ──────────────────────────────────────────────────
if (DOM.btnQuickMatch) {
  DOM.btnQuickMatch.addEventListener('click', () => {
    if (window.SoundEngine) SoundEngine.play('click');
    
    // Generate a player name for matchmaking
    GameState.playerName = `Player_${Math.floor(Math.random() * 9999)}`;
    
    // Show matchmaking overlay
    showMatchmakingOverlay();
    updateConnectionStatus('connecting', 'Mencari lawan...');
    
    // Start real matchmaking
    PeerManager.findMatch(GameState.difficulty, GameState.playerName)
      .then(result => {
        hideMatchmakingOverlay();
        
        // Set up game state based on matchmaking result
        GameState.isHost = result.role === 'host';
        GameState.slot = result.role === 'host' ? 'p1' : 'p2';
        GameState.roomId = result.roomCode;
        GameState.opponentName = result.opponentName;
        
        // Update waiting room UI
        if (DOM.roomCodeDisplay) DOM.roomCodeDisplay.textContent = result.roomCode;
        
        if (GameState.isHost) {
          if (DOM.p1NameWaiting) DOM.p1NameWaiting.textContent = GameState.playerName;
          if (DOM.p2NameWaiting) DOM.p2NameWaiting.textContent = result.opponentName;
        } else {
          if (DOM.p1NameWaiting) DOM.p1NameWaiting.textContent = result.opponentName;
          if (DOM.p2NameWaiting) DOM.p2NameWaiting.textContent = GameState.playerName;
        }
        
        // Send player info to opponent
        PeerManager.send({
          type: GameState.isHost ? 'HOST_INFO' : 'JOIN',
          playerName: GameState.playerName,
          settings: {
            difficulty: GameState.difficulty,
            winThreshold: GameState.winThreshold,
            inputMode: GameState.inputMode,
          }
        });
        
        showScreen('waiting-room');
        updateConnectionStatus('connected', 'Terhubung!');
        if (window.SoundEngine) SoundEngine.play('connect');
      })
      .catch(err => {
        hideMatchmakingOverlay();
        console.error('[GAME] Matchmaking failed:', err);
        if (err.message !== 'Matchmaking cancelled') {
          alert(err.message || 'Gagal mencari lawan');
        }
        updateConnectionStatus('disconnected', 'Tidak terhubung');
      });
  });
}

// Cancel matchmaking
if (DOM.btnCancelMatchmaking) {
  DOM.btnCancelMatchmaking.addEventListener('click', () => {
    if (window.SoundEngine) SoundEngine.play('click');
    PeerManager.cancelMatchmaking();
    hideMatchmakingOverlay();
    updateConnectionStatus('disconnected', 'Dibatalkan');
  });
}

if (DOM.btnCreateRoom) {
  DOM.btnCreateRoom.addEventListener('click', () => {
    if (window.SoundEngine) SoundEngine.play('click');
    showModal(DOM.createRoomModal);
  });
}

if (DOM.btnJoinRoom) {
  DOM.btnJoinRoom.addEventListener('click', () => {
    if (window.SoundEngine) SoundEngine.play('click');
    showModal(DOM.joinRoomModal);
  });
}

if (DOM.btnConfirmCreate) {
  DOM.btnConfirmCreate.addEventListener('click', async () => {
    if (window.SoundEngine) SoundEngine.play('click');
    GameState.playerName = DOM.playerName.value || GameState.playerName;
    GameState.isHost = true;
    GameState.slot = 'p1';
    
    if (DOM.inputMode) GameState.inputMode = DOM.inputMode.value;
    if (DOM.winThreshold) GameState.winThreshold = parseInt(DOM.winThreshold.value);
    
    hideModal(DOM.createRoomModal);
    updateConnectionStatus('connecting', 'Membuat room...');
    
    console.log('[GAME] Creating room...');
    
    try {
      const result = await PeerManager.createRoom();
      console.log('[GAME] Room code generated:', result.roomCode);
      GameState.roomId = result.roomCode;
      if (DOM.roomCodeDisplay) DOM.roomCodeDisplay.textContent = result.roomCode;
      if (DOM.p1NameWaiting) DOM.p1NameWaiting.textContent = GameState.playerName;
      showScreen('waiting-room');
      updateConnectionStatus('connected', 'Menunggu lawan...');
    } catch (err) {
      console.error('[GAME] Failed to create room:', err);
      alert('Gagal membuat room: ' + err.message + '\n\nPastikan koneksi internet stabil.');
      updateConnectionStatus('disconnected', 'Gagal membuat room');
    }
  });
}

if (DOM.btnCancelCreate) {
  DOM.btnCancelCreate.addEventListener('click', () => hideModal(DOM.createRoomModal));
}

if (DOM.btnConfirmJoin) {
  DOM.btnConfirmJoin.addEventListener('click', async () => {
    if (window.SoundEngine) SoundEngine.play('click');
    GameState.playerName = DOM.joinPlayerName.value || GameState.playerName;
    GameState.isHost = false;
    GameState.slot = 'p2';
    
    const code = DOM.roomCode.value;
    if (!code || code.length !== 6) {
      alert('Kode room harus 6 digit!');
      return;
    }
    
    hideModal(DOM.joinRoomModal);
    updateConnectionStatus('connecting', 'Menghubungkan...');
    
    console.log('[GAME] Joining room', code);
    
    try {
      await PeerManager.joinRoom(code);
      GameState.roomId = code;
      console.log('[GAME] Join request sent, waiting for host...');
      if (DOM.roomCodeDisplay) DOM.roomCodeDisplay.textContent = code;
      if (DOM.p2NameWaiting) DOM.p2NameWaiting.textContent = GameState.playerName;
      showScreen('waiting-room');
      updateConnectionStatus('connecting', 'Menunggu host...');
    } catch (err) {
      console.error('[GAME] Failed to join room:', err);
      alert('Gagal bergabung ke room: ' + err.message);
      updateConnectionStatus('disconnected', 'Gagal bergabung');
    }
  });
}

if (DOM.btnCancelJoin) {
  DOM.btnCancelJoin.addEventListener('click', () => hideModal(DOM.joinRoomModal));
}

// ─── Waiting Room ──────────────────────────────────────────────────────────
if (DOM.btnLeaveRoom) {
  DOM.btnLeaveRoom.addEventListener('click', () => {
    PeerManager.disconnect();
    GameState.roomId = null;
    GameState.slot = null;
    showScreen('main-menu');
  });
}

if (DOM.btnLeaveGame) {
  DOM.btnLeaveGame.addEventListener('click', () => {
    if (window.SoundEngine) SoundEngine.play('click');
    if (window.PeerManager) PeerManager.disconnect();
    GameState.isPlaying = false;
    showScreen('main-menu');
  });
}

if (DOM.btnCopyCode) {
  DOM.btnCopyCode.addEventListener('click', () => {
    const code = DOM.roomCodeDisplay?.textContent;
    if (code && code !== '------') {
      navigator.clipboard.writeText(code).then(() => {
        const copyIcon = DOM.btnCopyCode.querySelector('.copy-icon');
        if (copyIcon && window.GameIcons) {
          copyIcon.innerHTML = GameIcons.clipboardCheck();
        }
        setTimeout(() => {
          if (copyIcon && window.GameIcons) {
            copyIcon.innerHTML = GameIcons.clipboard();
          }
        }, 2000);
      });
    }
  });
}

// ─── Match Over ────────────────────────────────────────────────────────────
if (DOM.btnRematch) {
  DOM.btnRematch.addEventListener('click', () => {
    resetClientState();
    PeerManager.send({ type: 'REMATCH', accept: true });
    showScreen('waiting-room');
  });
}

if (DOM.btnBackMenu) {
  DOM.btnBackMenu.addEventListener('click', () => {
    PeerManager.disconnect();
    GameState.roomId = null;
    GameState.slot = null;
    GameState.isPlaying = false;
    showScreen('main-menu');
  });
}

// ─── Numpad Handling ───────────────────────────────────────────────────────
document.querySelectorAll('.numpad-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (GameState.isStunned || !GameState.isPlaying) return;
    const num = btn.dataset.num;
    if (num !== undefined) {
      GameState.numpadValue += num;
      if (DOM.numpadDisplay) DOM.numpadDisplay.textContent = GameState.numpadValue;
      if (window.SoundEngine) SoundEngine.play('tick');
    } else if (btn.classList.contains('numpad-clear')) {
      GameState.numpadValue = '';
      if (DOM.numpadDisplay) DOM.numpadDisplay.textContent = '0';
      if (window.SoundEngine) SoundEngine.play('click');
    } else if (btn.classList.contains('numpad-enter')) {
      if (GameState.numpadValue !== '') submitAnswer(parseInt(GameState.numpadValue));
    }
  });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (!GameState.isPlaying || GameState.isStunned) return;
  if (GameState.inputMode === 'numpad') {
    if (e.key >= '0' && e.key <= '9') {
      GameState.numpadValue += e.key;
      if (DOM.numpadDisplay) DOM.numpadDisplay.textContent = GameState.numpadValue;
    } else if (e.key === 'Enter') {
      if (GameState.numpadValue !== '') submitAnswer(parseInt(GameState.numpadValue));
    } else if (e.key === 'Backspace') {
      GameState.numpadValue = GameState.numpadValue.slice(0, -1);
      if (DOM.numpadDisplay) DOM.numpadDisplay.textContent = GameState.numpadValue || '0';
    }
  } else {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 4) {
      const btns = DOM.answerOptions?.querySelectorAll('.answer-btn');
      if (btns && btns[num - 1] && !btns[num - 1].disabled) {
        submitAnswer(parseInt(btns[num - 1].textContent));
      }
    }
  }
});

// ─── Initialize ────────────────────────────────────────────────────────────
injectIcons();
setupToggleButtons();
showScreen('main-menu');

// Sound toggle
if (DOM.soundToggle) {
  DOM.soundToggle.addEventListener('click', () => {
    if (window.SoundEngine) {
      const enabled = SoundEngine.toggle();
      if (DOM.soundIcon && window.GameIcons) {
        DOM.soundIcon.innerHTML = enabled ? GameIcons.speakerOn() : GameIcons.speakerOff();
      }
      DOM.soundToggle.classList.toggle('muted', !enabled);
    }
  });
}

// HOST_INFO is now handled directly in handlePeerData switch statement
