/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — Game Client
   ═══════════════════════════════════════════════════════════════════════════ */

const socket = io();

// ─── Game State ────────────────────────────────────────────────────────────
const GameState = {
  playerId: null,
  playerName: `Player_${Math.floor(Math.random() * 9999)}`,
  roomId: null,
  slot: null,
  isPlaying: false,
  currentQuestion: null,
  ropePosition: 0,
  scores: { p1: 0, p2: 0 },
  streaks: { p1: 0, p2: 0 },
  matchStartTime: null,
  inputMode: 'multiple_choice',
  isStunned: false,
  numpadValue: '',
  lastPingTime: 0,
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

// ─── Screen Management ─────────────────────────────────────────────────────
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    // Trigger entrance animation
    screen.style.animation = 'none';
    screen.offsetHeight; // Force reflow
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
socket.on('connect', () => {
  updateConnectionStatus('connected', 'Terhubung');
});

socket.on('disconnect', () => {
  updateConnectionStatus('disconnected', 'Terputus!');
});

socket.on('PLAYER_ID', (data) => {
  GameState.playerId = data.playerId;
});

function updateConnectionStatus(status, text) {
  if (!DOM.connectionStatus) return;
  DOM.connectionStatus.className = `connection-status ${status}`;
  DOM.connectionStatus.querySelector('.status-text').textContent = text;
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

// ─── Toggle Buttons in Create Room ────────────────────────────────────────
if (DOM.inputModeBtns) {
  DOM.inputModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.inputModeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.inputMode = btn.dataset.mode;
    });
  });
}

if (DOM.thresholdBtns) {
  DOM.thresholdBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.thresholdBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.winThreshold = parseInt(btn.dataset.threshold);
    });
  });
}

// ─── Menu Event Listeners ──────────────────────────────────────────────────
if (DOM.btnQuickMatch) {
  DOM.btnQuickMatch.addEventListener('click', () => {
    if (window.SoundEngine) SoundEngine.play('click');
    socket.emit('QUICK_MATCH', {
      playerName: GameState.playerName,
      difficulty: GameState.difficulty,
    });
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
    showModal(DOM.joinRoomModal);
  });
}

if (DOM.btnConfirmCreate) {
  DOM.btnConfirmCreate.addEventListener('click', () => {
    GameState.playerName = DOM.playerName.value || GameState.playerName;
    socket.emit('CREATE_ROOM', {
      playerName: GameState.playerName,
      difficulty: GameState.difficulty,
      inputMode: GameState.inputMode,
      winThreshold: GameState.winThreshold,
    });
    hideModal(DOM.createRoomModal);
  });
}

if (DOM.btnCancelCreate) {
  DOM.btnCancelCreate.addEventListener('click', () => hideModal(DOM.createRoomModal));
}

if (DOM.btnConfirmJoin) {
  DOM.btnConfirmJoin.addEventListener('click', () => {
    GameState.playerName = DOM.joinPlayerName.value || GameState.playerName;
    socket.emit('JOIN_ROOM', {
      playerName: GameState.playerName,
      roomId: DOM.roomCode.value,
    });
    hideModal(DOM.joinRoomModal);
  });
}

if (DOM.btnCancelJoin) {
  DOM.btnCancelJoin.addEventListener('click', () => hideModal(DOM.joinRoomModal));
}

// ─── Socket Event Handlers ─────────────────────────────────────────────────
socket.on('ROOM_CREATED', (data) => {
  GameState.roomId = data.roomId;
  GameState.slot = data.slot;
  GameState.inputMode = data.room.settings.inputMode || 'multiple_choice';
  enterWaitingRoom(data);
});

socket.on('ROOM_JOINED', (data) => {
  GameState.roomId = data.roomId;
  GameState.slot = data.slot;
  GameState.inputMode = data.room.settings.inputMode || 'multiple_choice';
  enterWaitingRoom(data);
});

socket.on('PLAYER_JOINED', (data) => {
  const slot = GameState.slot === 'p1' ? 'p2' : 'p1';
  updateWaitingSlot(slot, data.playerName, false);
  // Animation
  const card = document.getElementById(`slot-${slot}`);
  if (card) {
    card.classList.add('connected');
    card.style.animation = 'fadeInUp 0.5s ease-out';
  }
});

socket.on('ROOM_READY', (data) => {
  document.querySelectorAll('.player-badge').forEach(b => {
    b.querySelector('.badge-icon').textContent = '⏳';
  });
});

socket.on('OPPONENT_READY', (data) => {
  const slot = GameState.slot === 'p1' ? 'p2' : 'p1';
  const card = document.getElementById(`slot-${slot}`);
  if (card) {
    card.classList.add('ready');
    const badge = card.querySelector('.player-badge');
    badge.classList.add('ready');
    badge.querySelector('.badge-icon').textContent = '✅';
    badge.querySelector('.badge-text').textContent = 'Ready!';
  }
});

socket.on('GAME_STARTED', (data) => {
  startGame(data);
});

socket.on('GAME_STATE_UPDATE', (data) => {
  updateGameState(data);
});

socket.on('ANSWER_RESULT', (data) => {
  showAnswerResult(data);
  // Show next question immediately (already included in ANSWER_RESULT)
  if (data.nextQuestion) {
    showQuestion(data.nextQuestion);
    if (window.SoundEngine) SoundEngine.play('newQuestion');
  }
});

socket.on('MATCH_OVER', (data) => {
  showMatchOver(data);
  // Play win/lose sound
  if (window.SoundEngine) {
    const isWinner = data.winnerId === GameState.playerId;
    SoundEngine.play(isWinner ? 'win' : 'lose');
  }
});

socket.on('REMATCH_REQUESTED', (data) => {
  if (confirm('Lawan ingin main lagi! Terima?')) {
    socket.emit('REMATCH_ACCEPT', {});
  }
});

socket.on('REMATCH_ACCEPTED', (data) => {
  showScreen('waiting-room');
  if (window.SoundEngine) SoundEngine.play('notify');
});

socket.on('ERROR', (data) => {
  console.error('Server error:', data.message);
  showFeedback('❌', 'Error', data.message);
  if (window.SoundEngine) SoundEngine.play('wrong');
});

// ─── Waiting Room ──────────────────────────────────────────────────────────
function enterWaitingRoom(data) {
  showScreen('waiting-room');
  if (DOM.roomCodeDisplay) {
    DOM.roomCodeDisplay.textContent = data.roomId;
  }
  
  updateWaitingSlot(GameState.slot, GameState.playerName, false);
  
  const oppSlot = GameState.slot === 'p1' ? 'p2' : 'p1';
  const opp = data.room.players[oppSlot];
  if (opp) {
    updateWaitingSlot(oppSlot, opp.name, false);
  }
  
  // Reset ready state
  document.querySelectorAll('.player-card').forEach(card => {
    card.classList.remove('ready', 'connected');
  });
  document.querySelectorAll('.player-badge').forEach(badge => {
    badge.classList.remove('ready');
    badge.querySelector('.badge-icon').textContent = '⏳';
    badge.querySelector('.badge-text').textContent = 'Belum Ready';
  });
  
  if (DOM.btnReady) {
    DOM.btnReady.disabled = false;
    DOM.btnReady.innerHTML = '<span>✓ READY</span>';
  }
}

function updateWaitingSlot(slot, name, isReady) {
  const nameEl = document.getElementById(`${slot}-name`);
  if (nameEl) {
    nameEl.textContent = name;
  }
  const card = document.getElementById(`slot-${slot}`);
  if (card && name !== 'Menunggu...') {
    card.classList.add('connected');
  }
}

if (DOM.btnReady) {
  DOM.btnReady.addEventListener('click', () => {
    socket.emit('PLAYER_READY', {});
    const myCard = document.getElementById(`slot-${GameState.slot}`);
    if (myCard) {
      myCard.classList.add('ready');
      const badge = myCard.querySelector('.player-badge');
      badge.classList.add('ready');
      badge.querySelector('.badge-icon').textContent = '✅';
      badge.querySelector('.badge-text').textContent = 'Ready!';
    }
    DOM.btnReady.disabled = true;
    DOM.btnReady.innerHTML = '<span>Menunggu lawan...</span>';
  });
}

if (DOM.btnLeaveRoom) {
  DOM.btnLeaveRoom.addEventListener('click', () => {
    socket.emit('LEAVE_ROOM', {});
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
        setTimeout(() => {
          DOM.btnCopyCode.textContent = '📋 Copy';
        }, 2000);
      });
    }
  });
}

// ─── Game Start ────────────────────────────────────────────────────────────
function startGame(data) {
  showScreen('game-screen');
  GameState.isPlaying = true;
  GameState.matchStartTime = Date.now();
  GameState.scores = { p1: 0, p2: 0 };
  GameState.streaks = { p1: 0, p2: 0 };
  GameState.ropePosition = 0;
  GameState.isStunned = false;
  
  if (DOM.gameRoomCode) {
    DOM.gameRoomCode.textContent = GameState.roomCode;
  }
  
  if (DOM.p1NameGame) DOM.p1NameGame.textContent = data.room.players.p1?.name || 'P1';
  if (DOM.p2NameGame) DOM.p2NameGame.textContent = data.room.players.p2?.name || 'P2';
  
  // Reset score displays
  updateScoreDisplay();
  updateRopePosition(0);
  
  // Show initial question
  if (GameState.slot === 'p1' && data.questions?.p1) {
    showQuestion(data.questions.p1);
  } else if (GameState.slot === 'p2' && data.questions?.p2) {
    showQuestion(data.questions.p2);
  }
  
  startMatchTimer();
  startPingMonitor();
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
  
  if (DOM.questionCategory) {
    DOM.questionCategory.textContent = 'SOAL';
  }
  
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
    
    if (DOM.timerBar) {
      DOM.timerBar.style.transform = `scaleX(${remaining})`;
    }
    
    const responseTimeSec = elapsed / 1000;
    const force = calculateForcePreview(responseTimeSec);
    if (DOM.forceValue) DOM.forceValue.textContent = force;
    
    if (remaining <= 0) {
      clearInterval(timerBarInterval);
    }
  }, 50);
}

function calculateForcePreview(responseTimeSec) {
  const F_BASE = 15;
  const LAMBDA = 0.35;
  const MIN_MULT = 0.20;
  
  const decay = Math.exp(-LAMBDA * responseTimeSec);
  const multiplier = Math.max(decay, MIN_MULT);
  const force = F_BASE * multiplier;
  
  return Math.round(force * 10) / 10;
}

// ─── Answer Submission ─────────────────────────────────────────────────────
function submitAnswer(answer) {
  if (!GameState.currentQuestion || GameState.isStunned) return;
  
  if (timerBarInterval) clearInterval(timerBarInterval);
  
  const responseTime = Date.now() - timerStartTime;
  if (DOM.responseTime) DOM.responseTime.textContent = `${responseTime} ms`;
  
  if (DOM.inputMode === 'multiple_choice') {
    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.disabled = true;
      if (parseInt(btn.textContent) === answer) {
        btn.style.borderColor = 'var(--accent-primary)';
      }
    });
  }
  
  socket.emit('SUBMIT_ANSWER', {
    questionId: GameState.currentQuestion.questionId,
    submittedAnswer: answer,
    clientTimestamp: Date.now(),
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
      if (GameState.numpadValue !== '') {
        submitAnswer(parseInt(GameState.numpadValue));
      }
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
      if (GameState.numpadValue !== '') {
        submitAnswer(parseInt(GameState.numpadValue));
      }
    } else if (e.key === 'Backspace') {
      GameState.numpadValue = GameState.numpadValue.slice(0, -1);
      if (DOM.numpadDisplay) DOM.numpadDisplay.textContent = GameState.numpadValue || '0';
    }
  } else {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 4) {
      const btns = DOM.answerOptions?.querySelectorAll('.answer-btn');
      if (btns && btns[num - 1]) {
        submitAnswer(parseInt(btns[num - 1].textContent));
      }
    }
  }
});

// ─── Answer Result ─────────────────────────────────────────────────────────
function showAnswerResult(data) {
  if (data.isCorrect) {
    // Show success feedback
    showFeedback('🎉', 'BENAR!', `+${data.forceApplied} pts`);
    
    // Play sound
    if (window.SoundEngine) {
      const streak = GameState.streaks[GameState.slot] || 0;
      if (streak >= 3) {
        SoundEngine.play('combo', streak); // Combo sound for streaks
      } else {
        SoundEngine.play('correct');
      }
      SoundEngine.play('pull');
    }
    
    // Animate rope pull
    const pullDir = GameState.slot === 'p1' ? 'left' : 'right';
    animatePull(pullDir);
    
    // Floating score
    const btn = document.querySelector('.answer-btn:active') || document.querySelector('.answer-btn');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      showFloatingScore(`+${data.forceApplied}`, rect.left + rect.width/2, rect.top);
    }
    
    // Confetti for combos
    const currentStreak = GameState.streaks[GameState.slot] || 0;
    if (currentStreak >= 5) {
      createConfetti('game-confetti', 20);
    }
  } else {
    // Show stun effect
    triggerStun();
    
    // Play wrong sound
    if (window.SoundEngine) {
      SoundEngine.play('wrong');
      SoundEngine.play('stun');
    }
  }
}

function showFeedback(icon, text, points) {
  if (!DOM.feedbackOverlay) return;
  
  DOM.feedbackOverlay.querySelector('.feedback-icon').textContent = icon;
  DOM.feedbackOverlay.querySelector('.feedback-text').textContent = text;
  DOM.feedbackOverlay.querySelector('.feedback-points').textContent = points;
  DOM.feedbackOverlay.classList.add('show');
  
  setTimeout(() => {
    DOM.feedbackOverlay.classList.remove('show');
  }, 1200);
}

function triggerStun() {
  GameState.isStunned = true;
  
  if (DOM.stunOverlay) {
    DOM.stunOverlay.classList.add('active');
  }
  
  document.body.style.animation = 'none';
  document.body.offsetHeight;
  document.body.style.animation = '';
  
  setTimeout(() => {
    if (DOM.stunOverlay) DOM.stunOverlay.classList.remove('active');
    GameState.isStunned = false;
  }, 600);
}

function animatePull(direction) {
  const arena = document.querySelector('.game-arena');
  if (arena) {
    arena.style.animation = `pullBounce${direction === 'left' ? 'Left' : 'Right'} 0.3s ease-out`;
    setTimeout(() => {
      arena.style.animation = '';
    }, 300);
  }
  
  // Update streak animation
  const myStreak = GameState.slot === 'p1' ? DOM.p1Streak : DOM.p2Streak;
  if (myStreak) {
    myStreak.classList.add('hot');
    setTimeout(() => myStreak.classList.remove('hot'), 500);
  }
}

// ─── Game State Update ─────────────────────────────────────────────────────
function updateGameState(data) {
  if (data.ropePosition !== undefined) {
    updateRopePosition(data.ropePosition);
  }
  
  if (data.lastAction) {
    const action = data.lastAction;
    const slot = action.playerId === GameState.playerId ? GameState.slot : 
                 (GameState.slot === 'p1' ? 'p2' : 'p1');
    
    if (action.isCorrect) {
      GameState.scores[slot] = (GameState.scores[slot] || 0) + action.forceApplied;
      GameState.streaks[slot] = (GameState.streaks[slot] || 0) + 1;
    } else {
      GameState.streaks[slot] = 0;
    }
    
    updateScoreDisplay();
  }
}

function updateScoreDisplay() {
  if (DOM.p1Score) DOM.p1Score.textContent = Math.round(GameState.scores.p1 || 0);
  if (DOM.p2Score) DOM.p2Score.textContent = Math.round(GameState.scores.p2 || 0);
  
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
    // Map -120..120 to 0%..100%
    const percent = ((position + 120) / 240) * 100;
    const clamped = Math.max(5, Math.min(95, percent));
    DOM.ropeFlag.style.left = `${clamped}%`;
  }
  
  if (DOM.ropeIndicator) {
    const percent = ((position + 120) / 240) * 100;
    DOM.ropeIndicator.style.left = `${Math.max(0, Math.min(100, percent))}%`;
  }
  
  // Color the rope based on position
  if (DOM.ropeLine) {
    const absPos = Math.abs(position);
    if (absPos > 60) {
      DOM.ropeLine.style.boxShadow = `0 0 15px ${position < 0 ? 'var(--p1-color)' : 'var(--p2-color)'}`;
    } else {
      DOM.ropeLine.style.boxShadow = '0 2px 8px rgba(255, 192, 72, 0.5)';
    }
  }
}

// ─── Match Timer ───────────────────────────────────────────────────────────
let matchTimerInterval = null;

function startMatchTimer() {
  if (matchTimerInterval) clearInterval(matchTimerInterval);
  
  matchTimerInterval = setInterval(() => {
    if (!GameState.isPlaying) {
      clearInterval(matchTimerInterval);
      return;
    }
    
    const elapsed = Math.floor((Date.now() - GameState.matchStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    if (DOM.matchTime) DOM.matchTime.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

// ─── Ping Monitor ──────────────────────────────────────────────────────────
function startPingMonitor() {
  setInterval(() => {
    GameState.lastPingTime = Date.now();
    socket.emit('PING');
  }, 5000);
}

socket.on('PONG', () => {
  const ping = Date.now() - GameState.lastPingTime;
  if (DOM.pingDisplay) DOM.pingDisplay.textContent = ping;
});

// ─── Match Over ────────────────────────────────────────────────────────────
function showMatchOver(data) {
  GameState.isPlaying = false;
  if (matchTimerInterval) clearInterval(matchTimerInterval);
  if (timerBarInterval) clearInterval(timerBarInterval);
  
  const isWinner = data.winnerId === GameState.playerId;
  
  if (DOM.resultTitle) {
    DOM.resultTitle.textContent = isWinner ? 'MENANG!' : 'KALAH!';
    DOM.resultTitle.style.color = isWinner ? 'var(--accent-warning)' : 'var(--accent-danger)';
  }
  
  if (DOM.resultSubtitle) {
    DOM.resultSubtitle.textContent = isWinner 
      ? 'Selamat! Kamu memenangkan pertandingan!' 
      : 'Lawan lebih kuat kali ini. Coba lagi!';
  }
  
  if (DOM.finalRopePos) DOM.finalRopePos.textContent = data.finalRopePosition;
  if (DOM.finalDuration) DOM.finalDuration.textContent = `${data.durationSeconds}s`;
  
  if (data.stats) {
    updateMatchStats('p1', data.stats.p1, data.room?.players?.p1?.name || 'P1');
    updateMatchStats('p2', data.stats.p2, data.room?.players?.p2?.name || 'P2');
  }
  
  showScreen('match-over');
  
  if (isWinner) {
    setTimeout(() => createConfetti('confetti-container', 60), 500);
  }
}

function updateMatchStats(slot, stats, name) {
  const nameEl = document.getElementById(`stats-${slot}-name`);
  const accEl = document.getElementById(`stats-${slot}-accuracy`);
  const timeEl = document.getElementById(`stats-${slot}-avgtime`);
  const forceEl = document.getElementById(`stats-${slot}-force`);
  const streakEl = document.getElementById(`stats-${slot}-streak`);
  
  if (nameEl) nameEl.textContent = name;
  if (accEl) accEl.textContent = `${Math.round((stats.accuracy || 0) * 100)}%`;
  if (timeEl) timeEl.textContent = `${Math.round((stats.avgResponseTimeSec || 0) * 1000)}ms`;
  if (forceEl) forceEl.textContent = Math.round((stats.totalForce || 0) * 10) / 10;
  if (streakEl) streakEl.textContent = stats.highestStreak || 0;
}

// ─── Rematch & Navigation ──────────────────────────────────────────────────
if (DOM.btnRematch) {
  DOM.btnRematch.addEventListener('click', () => {
    socket.emit('REMATCH_REQUEST', {});
  });
}

if (DOM.btnBackMenu) {
  DOM.btnBackMenu.addEventListener('click', () => {
    GameState.roomId = null;
    GameState.slot = null;
    GameState.isPlaying = false;
    showScreen('main-menu');
  });
}

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
  if (DOM.onlineCount) {
    DOM.onlineCount.textContent = Math.floor(Math.random() * 50) + 10;
  }
}, 5000);
