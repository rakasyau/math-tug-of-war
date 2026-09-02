/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — P2P Game Client
   Menggunakan PeerJS (WebRTC) untuk koneksi langsung antar browser
   Host (p1) menjadi authoritative server untuk game state
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Game State ────────────────────────────────────────────────────────────
const GameState = {
  playerId: null,
  playerName: `Player_${Math.floor(Math.random() * 9999)}`,
  roomId: null,
  slot: null, // 'p1' (host) or 'p2' (guest)
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
  matchStartTime: null,
  inputMode: 'multiple_choice',
  isStunned: false,
  numpadValue: '',
  difficulty: 'medium',
  winThreshold: 100,
};

// ─── DOM Elements ──────────────────────────────────────────────────────────
const DOM = {
  // Screens
  mainMenu: document.getElementById('main-menu'),
  waitingRoom: document.getElementById('waiting-room'),
  gameScreen: document.getElementById('game-screen'),
  matchOver: document.getElementById('match-over'),
  createRoomModal: document.getElementById('create-room-modal'),
  joinRoomModal: document.getElementById('join-room-modal'),
  
  // Menu
  btnQuickMatch: document.getElementById('btn-quick-match'),
  btnCreateRoom: document.getElementById('btn-create-room'),
  btnJoinRoom: document.getElementById('btn-join-room'),
  diffBtns: document.querySelectorAll('.diff-btn'),
  onlineCount: document.getElementById('online-count'),
  
  // Create Room Modal
  playerName: document.getElementById('player-name'),
  inputModeBtns: document.querySelectorAll('[data-mode]'),
  thresholdBtns: document.querySelectorAll('[data-threshold]'),
  btnConfirmCreate: document.getElementById('btn-confirm-create'),
  btnCancelCreate: document.getElementById('btn-cancel-create'),
  
  // Join Room Modal
  joinPlayerName: document.getElementById('join-player-name'),
  roomCode: document.getElementById('room-code'),
  btnConfirmJoin: document.getElementById('btn-confirm-join'),
  btnCancelJoin: document.getElementById('btn-cancel-join'),
  
  // Waiting Room
  roomCodeDisplay: document.getElementById('room-code-display'),
  slotP1: document.getElementById('slot-p1'),
  slotP2: document.getElementById('slot-p2'),
  p1NameWaiting: document.getElementById('p1-name'),
  p2NameWaiting: document.getElementById('p2-name'),
  btnReady: document.getElementById('btn-ready'),
  btnLeaveRoom: document.getElementById('btn-leave-room'),
  btnCopyCode: document.getElementById('btn-copy-code'),
  
  // Game
  gameRoomCode: document.getElementById('game-room-code'),
  matchTime: document.getElementById('match-time'),
  pingDisplay: document.getElementById('ping-display'),
  p1Score: document.getElementById('p1-score'),
  p2Score: document.getElementById('p2-score'),
  p1NameGame: document.getElementById('p1-name-game'),
  p2NameGame: document.getElementById('p2-name-game'),
  p1Streak: document.getElementById('p1-streak'),
  p2Streak: document.getElementById('p2-streak'),
  ropeLine: document.getElementById('rope-line'),
  ropeFlag: document.getElementById('rope-flag'),
  ropeIndicator: document.getElementById('rope-indicator'),
  questionPrompt: document.getElementById('question-prompt'),
  questionCategory: document.getElementById('question-category'),
  timerBar: document.getElementById('timer-bar'),
  forceDisplay: document.getElementById('force-display'),
  forceValue: document.querySelector('.force-value'),
  responseTime: document.getElementById('response-time'),
  answerOptions: document.getElementById('answer-options'),
  numpadContainer: document.getElementById('numpad-container'),
  numpadDisplay: document.getElementById('numpad-display'),
  
  // Feedback
  feedbackOverlay: document.getElementById('feedback-overlay'),
  stunOverlay: document.getElementById('stun-overlay'),
  
  // Match Over
  resultTitle: document.getElementById('result-title'),
  resultSubtitle: document.getElementById('result-subtitle'),
  finalRopePos: document.getElementById('final-rope-pos'),
  finalDuration: document.getElementById('final-duration'),
  confettiContainer: document.getElementById('confetti-container'),
  statsP1: document.getElementById('stats-p1'),
  statsP2: document.getElementById('stats-p2'),
  btnRematch: document.getElementById('btn-rematch'),
  btnBackMenu: document.getElementById('btn-back-menu'),
  
  // Connection
  connectionStatus: document.getElementById('connection-status'),
};

// ─── Math Engine (Client-side for question generation) ─────────────────────
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
        prompt = `${a} - ${b}`;
        break;
      case '*':
        if (difficulty === 'hard') {
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
    distractors.add(answer + 1);
    distractors.add(answer - 1);
    distractors.add(answer + 10);
    distractors.add(answer - 10);
    while (distractors.size < 4) {
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

function generateNewQuestion(playerSlot) {
  const seed = Date.now() + Math.floor(Math.random() * 100000) + (playerSlot === 'p1' ? 1 : 2);
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

// ─── Peer Event Handlers ───────────────────────────────────────────────────
PeerManager.onConnected(() => {
  console.log('PEER: Connected!');
  updateConnectionStatus('connected', 'Terhubung');
  
  if (GameState.isHost) {
    // Host waits for guest to join
    showScreen('waiting-room');
    if (DOM.roomCodeDisplay) DOM.roomCodeDisplay.textContent = GameState.roomId;
    if (DOM.p1NameWaiting) DOM.p1NameWaiting.textContent = GameState.playerName;
  } else {
    // Guest sends join message to host
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
    case 'GAME_START':
      handleGameStart(data);
      break;
    case 'ANSWER':
      handleOpponentAnswer(data);
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
  
  // Update waiting room
  const card = document.getElementById('slot-p2');
  if (card) {
    card.classList.add('connected');
    const nameEl = document.getElementById('p2-name');
    if (nameEl) nameEl.textContent = data.playerName;
  }
  
  // Notify guest that host is ready
  PeerManager.send({
    type: 'HOST_READY',
    hostName: GameState.playerName,
  });
  
  // Auto-start game after short delay
  setTimeout(() => {
    startGame();
  }, 1500);
}

// ─── Guest: Host Ready ────────────────────────────────────────────────────
function handleHostReady(data) {
  // Host is ready, game will start
}

// ─── Start Game ────────────────────────────────────────────────────────────
function startGame() {
  GameState.isPlaying = true;
  GameState.matchStartTime = Date.now();
  GameState.scores = { p1: 0, p2: 0 };
  GameState.streaks = { p1: 0, p2: 0 };
  GameState.maxStreaks = { p1: 0, p2: 0 };
  GameState.correctCounts = { p1: 0, p2: 0 };
  GameState.totalAnswers = { p1: 0, p2: 0 };
  GameState.totalResponseTime = { p1: 0, p2: 0 };
  GameState.ropePosition = 0;
  
  // Generate initial questions
  const q1 = generateNewQuestion('p1');
  const q2 = generateNewQuestion('p2');
  
  if (GameState.isHost) {
    // Send game start to guest
    PeerManager.send({
      type: 'GAME_START',
      settings: { difficulty: GameState.difficulty, winThreshold: GameState.winThreshold },
      question: { questionId: q2.questionId, prompt: q2.prompt, options: q2.options },
      hostQuestion: { questionId: q1.questionId, prompt: q1.prompt, options: q1.options },
    });
  }
  
  // Show game screen locally
  startGameLocal(q1);
}

function handleGameStart(data) {
  if (GameState.isHost) return; // Host already started
  
  GameState.difficulty = data.settings.difficulty;
  GameState.winThreshold = data.settings.winThreshold;
  
  // Get question from host
  const question = data.question;
  playerQuestions.p2.current = {
    questionId: question.questionId,
    prompt: question.prompt,
    options: question.options,
    answer: null, // Guest doesn't know answer yet
  };
  
  startGameLocal(question);
}

function startGameLocal(question) {
  showScreen('game-screen');
  GameState.matchStartTime = Date.now();
  
  if (DOM.gameRoomCode) DOM.gameRoomCode.textContent = GameState.roomId;
  if (DOM.p1NameGame) DOM.p1NameGame.textContent = GameState.playerName;
  if (DOM.p2NameGame) DOM.p2NameGame.textContent = 'Opponent';
  
  updateScoreDisplay();
  updateRopePosition(0);
  showQuestion(question);
  startMatchTimer();
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
    DOM.questionPrompt.style.animation = 'fadeInUp 0.3s ease-out';
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
  if (!GameState.currentQuestion || GameState.isStunned) return;
  
  if (timerBarInterval) clearInterval(timerBarInterval);
  
  const responseTime = Date.now() - timerStartTime;
  if (DOM.responseTime) DOM.responseTime.textContent = `${responseTime} ms`;
  
  if (GameState.inputMode === 'multiple_choice') {
    document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
  }
  
  // Send answer to peer (host will validate)
  PeerManager.send({
    type: 'ANSWER',
    questionId: GameState.currentQuestion.questionId,
    submittedAnswer: answer,
    clientTimestamp: Date.now(),
    responseTimeMs: responseTime,
  });
}

// ─── Handle Answer ────────────────────────────────────────────────────────
function handleOpponentAnswer(data) {
  if (!GameState.isHost) return; // Only host processes answers
  
  const slot = GameState.slot;
  const question = playerQuestions[slot].current;
  
  // Validate answer
  const isCorrect = (data.submittedAnswer === question.answer);
  const responseTimeMs = data.responseTimeMs || 0;
  const responseTimeSec = Math.max(0.1, responseTimeMs / 1000);
  
  // Update stats
  GameState.totalAnswers[slot]++;
  GameState.totalResponseTime[slot] += responseTimeMs;
  
  let forceApplied = 0;
  let nextQuestion = null;
  
  if (isCorrect) {
    GameState.correctCounts[slot]++;
    GameState.streaks[slot]++;
    if (GameState.streaks[slot] > GameState.maxStreaks[slot]) {
      GameState.maxStreaks[slot] = GameState.streaks[slot];
    }
    
    const force = MathEngine.calculateForce(responseTimeSec, GameState.difficulty, GameState.streaks[slot]);
    forceApplied = force;
    
    // Apply force
    if (slot === 'p1') GameState.ropePosition -= force;
    else GameState.ropePosition += force;
    GameState.scores[slot] += force;
    
    // Clamp
    GameState.ropePosition = Math.max(-120, Math.min(120, GameState.ropePosition));
    
    // Generate new question
    nextQuestion = generateNewQuestion(slot);
  } else {
    GameState.streaks[slot] = 0;
    // No new question on wrong answer
  }
  
  // Send result back to guest
  PeerManager.send({
    type: 'GAME_STATE',
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
  
  // Update host's own display
  updateGameStateLocal({
    isCorrect,
    forceApplied,
    responseTimeMs,
    correctAnswer: question.answer,
    ropePosition: GameState.ropePosition,
    scores: GameState.scores,
    streaks: GameState.streaks,
    nextQuestion: null, // Host doesn't need next question here
  });
  
  // Check for game over
  const winnerId = checkWinner();
  if (winnerId) {
    endMatch(winnerId);
  }
}

function handleGameState(data) {
  // Guest receives game state from host after answering
  updateGameStateLocal(data);
  
  if (data.isCorrect && data.nextQuestion) {
    showQuestion(data.nextQuestion);
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
  
  // Show feedback
  if (data.isCorrect !== undefined) {
    if (data.isCorrect) {
      showFeedback('🎉', 'BENAR!', `+${data.forceApplied} pts`);
      if (window.SoundEngine) {
        const streak = GameState.streaks[GameState.slot] || 0;
        SoundEngine.play(streak >= 3 ? 'combo' : 'correct');
        SoundEngine.play('pull');
      }
    } else {
      showFeedback('❌', 'SALAH!', `Jawaban: ${data.correctAnswer}`);
      triggerStun();
      if (window.SoundEngine) {
        SoundEngine.play('wrong');
        SoundEngine.play('stun');
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
    DOM.p1Streak.querySelector('.streak-count').textContent = GameState.streaks.p1 || 0;
  }
  if (DOM.p2Streak) {
    DOM.p2Streak.querySelector('.streak-count').textContent = GameState.streaks.p2 || 0;
  }
}

function updateRopePosition(position) {
  GameState.ropePosition = position;
  
  if (DOM.ropeFlag) {
    const percent = ((position + 120) / 240) * 100;
    DOM.ropeFlag.style.left = `${Math.max(5, Math.min(95, percent))}%`;
  }
  
  if (DOM.ropeIndicator) {
    const percent = ((position + 120) / 240) * 100;
    DOM.ropeIndicator.style.left = `${Math.max(0, Math.min(100, percent))}%`;
  }
}

function checkWinner() {
  if (GameState.ropePosition <= -GameState.winThreshold) return 'p1';
  if (GameState.ropePosition >= GameState.winThreshold) return 'p2';
  return null;
}

function endMatch(winnerId) {
  if (!GameState.isPlaying) return;
  GameState.isPlaying = false;
  
  const duration = Math.floor((Date.now() - GameState.matchStartTime) / 1000);
  const isWinner = winnerId === GameState.slot;
  
  // Show match over screen
  if (DOM.resultTitle) {
    DOM.resultTitle.textContent = isWinner ? 'MENANG!' : 'KALAH!';
    DOM.resultTitle.style.color = isWinner ? 'var(--accent-warning)' : 'var(--accent-danger)';
  }
  
  if (DOM.resultSubtitle) {
    DOM.resultSubtitle.textContent = isWinner 
      ? 'Selamat! Kamu memenangkan pertandingan!' 
      : 'Lawan lebih kuat kali ini. Coba lagi!';
  }
  
  if (DOM.finalRopePos) DOM.finalRopePos.textContent = Math.round(GameState.ropePosition * 10) / 10;
  if (DOM.finalDuration) DOM.finalDuration.textContent = `${duration}s`;
  
  // Update stats
  updateMatchStats('p1', GameState.scores.p1, GameState.maxStreaks.p1, 
    GameState.correctCounts.p1 / Math.max(1, GameState.totalAnswers.p1),
    GameState.totalResponseTime.p1 / Math.max(1, GameState.totalAnswers.p1));
  updateMatchStats('p2', GameState.scores.p2, GameState.maxStreaks.p2,
    GameState.correctCounts.p2 / Math.max(1, GameState.totalAnswers.p2),
    GameState.totalResponseTime.p2 / Math.max(1, GameState.totalAnswers.p2));
  
  showScreen('match-over');
  
  if (isWinner && DOM.confettiContainer) {
    setTimeout(() => createConfetti('confetti-container', 60), 500);
  }
  
  if (window.SoundEngine) SoundEngine.play(isWinner ? 'win' : 'lose');
}

function updateMatchStats(slot, score, maxStreak, accuracy, avgTime) {
  const nameEl = document.getElementById(`stats-${slot}-name`);
  const accEl = document.getElementById(`stats-${slot}-accuracy`);
  const timeEl = document.getElementById(`stats-${slot}-avgtime`);
  const forceEl = document.getElementById(`stats-${slot}-force`);
  const streakEl = document.getElementById(`stats-${slot}-streak`);
  
  if (nameEl) nameEl.textContent = slot === 'p1' ? GameState.playerName : 'Opponent';
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
    showScreen('waiting-room');
  }
}

// ─── Feedback & Effects ────────────────────────────────────────────────────
function showFeedback(icon, text, points) {
  if (!DOM.feedbackOverlay) return;
  DOM.feedbackOverlay.querySelector('.feedback-icon').textContent = icon;
  DOM.feedbackOverlay.querySelector('.feedback-text').textContent = text;
  DOM.feedbackOverlay.querySelector('.feedback-points').textContent = points;
  DOM.feedbackOverlay.classList.add('show');
  setTimeout(() => DOM.feedbackOverlay.classList.remove('show'), 1200);
}

function triggerStun() {
  GameState.isStunned = true;
  if (DOM.stunOverlay) DOM.stunOverlay.classList.add('active');
  setTimeout(() => {
    if (DOM.stunOverlay) DOM.stunOverlay.classList.remove('active');
    GameState.isStunned = false;
  }, 600);
}

// ─── Match Timer ───────────────────────────────────────────────────────────
let matchTimerInterval = null;

function startMatchTimer() {
  if (matchTimerInterval) clearInterval(matchTimerInterval);
  matchTimerInterval = setInterval(() => {
    if (!GameState.isPlaying) { clearInterval(matchTimerInterval); return; }
    const elapsed = Math.floor((Date.now() - GameState.matchStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    if (DOM.matchTime) DOM.matchTime.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

// ─── Difficulty Selection ─────────────────────────────────────────────────
if (DOM.diffBtns) {
  DOM.diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.difficulty = btn.dataset.diff;
    });
  });
}

// ─── Menu Event Listeners ──────────────────────────────────────────────────
if (DOM.btnQuickMatch) {
  DOM.btnQuickMatch.addEventListener('click', () => {
    if (window.SoundEngine) SoundEngine.play('click');
    // Quick match not available in P2P mode - use create/join
    showModal(DOM.createRoomModal);
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
    
    hideModal(DOM.createRoomModal);
    updateConnectionStatus('connecting', 'Membuat room...');
    
    try {
      const result = await PeerManager.createRoom();
      GameState.roomId = result.roomCode;
      if (DOM.roomCodeDisplay) DOM.roomCodeDisplay.textContent = result.roomCode;
      if (DOM.p1NameWaiting) DOM.p1NameWaiting.textContent = GameState.playerName;
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Gagal membuat room. Coba lagi.');
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
    
    try {
      await PeerManager.joinRoom(code);
      GameState.roomId = code;
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('Gagal bergabung ke room. Pastikan kode benar dan host sudah membuat room.');
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

if (DOM.btnCopyCode) {
  DOM.btnCopyCode.addEventListener('click', () => {
    const code = DOM.roomCodeDisplay?.textContent;
    if (code && code !== '------') {
      navigator.clipboard.writeText(code).then(() => {
        DOM.btnCopyCode.textContent = '✅ Copied!';
        setTimeout(() => { DOM.btnCopyCode.textContent = '📋 Copy'; }, 2000);
      });
    }
  });
}

// ─── Match Over ────────────────────────────────────────────────────────────
if (DOM.btnRematch) {
  DOM.btnRematch.addEventListener('click', () => {
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
    if (GameState.isStunned) return;
    const num = btn.dataset.num;
    if (num !== undefined) {
      GameState.numpadValue += num;
      if (DOM.numpadDisplay) DOM.numpadDisplay.textContent = GameState.numpadValue;
    } else if (btn.classList.contains('numpad-clear')) {
      GameState.numpadValue = '';
      if (DOM.numpadDisplay) DOM.numpadDisplay.textContent = '0';
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
      if (btns && btns[num - 1]) submitAnswer(parseInt(btns[num - 1].textContent));
    }
  }
});

// ─── Initialize ────────────────────────────────────────────────────────────
showScreen('main-menu');

// Sound toggle
const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    if (window.SoundEngine) {
      const enabled = SoundEngine.toggle();
      soundToggle.querySelector('.sound-icon').textContent = enabled ? '🔊' : '🔇';
      soundToggle.classList.toggle('muted', !enabled);
    }
  });
}

// Simulate online count
setInterval(() => {
  if (DOM.onlineCount) DOM.onlineCount.textContent = Math.floor(Math.random() * 50) + 10;
}, 5000);
