/* ─── Math Tug of War - Client Game Logic ────────────────────────────────── */

const socket = io();

// ─── Game State ────────────────────────────────────────────────────────────
const GameState = {
  playerId: null,
  playerName: `Player_${Math.floor(Math.random() * 9999)}`,
  roomId: null,
  slot: null, // 'p1' or 'p2'
  isPlaying: false,
  currentQuestion: null,
  ropePosition: 0,
  opponentRopePosition: 0,
  scores: { p1: 0, p2: 0 },
  streaks: { p1: 0, p2: 0 },
  matchStartTime: null,
  inputMode: 'multiple_choice',
  isStunned: false,
  numpadValue: '',
  lastPingTime: 0,
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
  difficulty: document.getElementById('difficulty'),
  
  // Create Room Modal
  playerName: document.getElementById('player-name'),
  inputMode: document.getElementById('input-mode'),
  winThreshold: document.getElementById('win-threshold'),
  btnConfirmCreate: document.getElementById('btn-confirm-create'),
  btnCancelCreate: document.getElementById('btn-cancel-create'),
  
  // Join Room Modal
  joinPlayerName: document.getElementById('join-player-name'),
  roomCode: document.getElementById('room-code'),
  btnConfirmJoin: document.getElementById('btn-confirm-join'),
  btnCancelJoin: document.getElementById('btn-cancel-join'),
  
  // Waiting Room
  roomCodeDisplay: document.getElementById('room-code-display'),
  shareCode: document.getElementById('share-code'),
  slotP1: document.getElementById('slot-p1'),
  slotP2: document.getElementById('slot-p2'),
  btnReady: document.getElementById('btn-ready'),
  btnLeaveRoom: document.getElementById('btn-leave-room'),
  
  // Game
  gameRoomCode: document.getElementById('game-room-code'),
  matchTime: document.getElementById('match-time'),
  pingDisplay: document.getElementById('ping-display'),
  p1Score: document.getElementById('p1-score'),
  p2Score: document.getElementById('p2-score'),
  p1Name: document.getElementById('p1-name'),
  p2Name: document.getElementById('p2-name'),
  p1Streak: document.getElementById('p1-streak'),
  p2Streak: document.getElementById('p2-streak'),
  rope: document.getElementById('rope'),
  ropePosition: document.getElementById('rope-position'),
  questionPrompt: document.getElementById('question-prompt'),
  timerBar: document.getElementById('timer-bar'),
  forcePotential: document.getElementById('force-potential'),
  responseTime: document.getElementById('response-time'),
  answerOptions: document.getElementById('answer-options'),
  numpad: document.getElementById('numpad'),
  numpadDisplay: document.getElementById('numpad-display'),
  
  // Match Over
  resultTitle: document.getElementById('result-title'),
  resultSubtitle: document.getElementById('result-subtitle'),
  finalRopePos: document.getElementById('final-rope-pos'),
  finalDuration: document.getElementById('final-duration'),
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
  document.getElementById(screenId).classList.add('active');
}

function showModal(modal) {
  modal.classList.add('active');
}

function hideModal(modal) {
  modal.classList.remove('active');
}

// ─── Connection Handling ───────────────────────────────────────────────────
socket.on('connect', () => {
  updateConnectionStatus('connected', 'Terhubung');
});

socket.on('disconnect', () => {
  updateConnectionStatus('disconnected', 'Terputus');
});

socket.on('PLAYER_ID', (data) => {
  GameState.playerId = data.playerId;
});

function updateConnectionStatus(status, text) {
  DOM.connectionStatus.className = `connection-status ${status}`;
  DOM.connectionStatus.querySelector('.status-text').textContent = text;
}

// ─── Menu Event Listeners ──────────────────────────────────────────────────
DOM.btnQuickMatch.addEventListener('click', () => {
  socket.emit('QUICK_MATCH', {
    playerName: GameState.playerName,
    difficulty: DOM.difficulty.value,
  });
});

DOM.btnCreateRoom.addEventListener('click', () => {
  showModal(DOM.createRoomModal);
});

DOM.btnJoinRoom.addEventListener('click', () => {
  showModal(DOM.joinRoomModal);
});

DOM.btnConfirmCreate.addEventListener('click', () => {
  GameState.playerName = DOM.playerName.value || GameState.playerName;
  socket.emit('CREATE_ROOM', {
    playerName: GameState.playerName,
    difficulty: DOM.difficulty.value,
    inputMode: DOM.inputMode.value,
    winThreshold: parseInt(DOM.winThreshold.value),
  });
  hideModal(DOM.createRoomModal);
});

DOM.btnCancelCreate.addEventListener('click', () => hideModal(DOM.createRoomModal));

DOM.btnConfirmJoin.addEventListener('click', () => {
  GameState.playerName = DOM.joinPlayerName.value || GameState.playerName;
  socket.emit('JOIN_ROOM', {
    playerName: GameState.playerName,
    roomId: DOM.roomCode.value,
  });
  hideModal(DOM.joinRoomModal);
});

DOM.btnCancelJoin.addEventListener('click', () => hideModal(DOM.joinRoomModal));

// ─── Socket Event Handlers ─────────────────────────────────────────────────
socket.on('ROOM_CREATED', (data) => {
  GameState.roomId = data.roomId;
  GameState.slot = data.slot;
  GameState.inputMode = data.room.settings.inputMode;
  enterWaitingRoom(data);
});

socket.on('ROOM_JOINED', (data) => {
  GameState.roomId = data.roomId;
  GameState.slot = data.slot;
  GameState.inputMode = data.room.settings.inputMode;
  enterWaitingRoom(data);
});

socket.on('PLAYER_JOINED', (data) => {
  // Show that opponent joined
  const slot = GameState.slot === 'p1' ? 'p2' : 'p1';
  updateWaitingSlot(slot, data.playerName, false);
});

socket.on('ROOM_READY', (data) => {
  // Both players are in, show VS
  document.querySelectorAll('.ready-status').forEach(el => el.textContent='⏳');
});

socket.on('OPPONENT_READY', (data) => {
  const slot = GameState.slot === 'p1' ? 'p2' : 'p1';
  const slotEl = document.getElementById(`slot-${slot}`);
  slotEl.querySelector('.ready-status').textContent='✅';
});

DOM.btnReady.addEventListener('click', () => {
  socket.emit('PLAYER_READY', {});
  document.getElementById(`slot-${GameState.slot}`).querySelector('.ready-status').textContent='✅';
  DOM.btnReady.disabled = true;
  DOM.btnReady.textContent = 'Menunggu lawan...';
});

socket.on('GAME_STARTED', (data) => {
  startGame(data);
});

socket.on('GAME_STATE_UPDATE', (data) => {
  updateGameState(data);
});

socket.on('ANSWER_RESULT', (data) => {
  showAnswerResult(data);
});

socket.on('NEW_QUESTION', (data) => {
  showQuestion(data);
});

socket.on('MATCH_OVER', (data) => {
  showMatchOver(data);
});

socket.on('REMATCH_REQUESTED', (data) => {
  if (confirm('Lawan ingin main lagi! Terima?')) {
    socket.emit('REMATCH_ACCEPT', {});
  }
});

socket.on('REMATCH_ACCEPTED', (data) => {
  // Reset for rematch
  showScreen('waiting-room');
});

socket.on('ERROR', (data) => {
  alert(`Error: ${data.message}`);
});

// ─── Waiting Room ──────────────────────────────────────────────────────────
function enterWaitingRoom(data) {
  showScreen('waiting-room');
  DOM.roomCodeDisplay.textContent = data.roomId;
  DOM.shareCode.textContent = data.roomId;
  
  // Update own slot
  updateWaitingSlot(GameState.slot, GameState.playerName, false);
  
  // Update opponent slot if exists
  const oppSlot = GameState.slot === 'p1' ? 'p2' : 'p1';
  const opp = data.room.players[oppSlot];
  if (opp) {
    updateWaitingSlot(oppSlot, opp.name, false);
  }
}

function updateWaitingSlot(slot, name, isReady) {
  const slotEl = document.getElementById(`slot-${slot}`);
  slotEl.querySelector('.name').textContent = name;
  slotEl.querySelector('.ready-status').textContent = isReady ? '✅' : '⏳';
}

DOM.btnLeaveRoom.addEventListener('click', () => {
  socket.emit('LEAVE_ROOM', {});
  GameState.roomId = null;
  GameState.slot = null;
  showScreen('main-menu');
});

// ─── Game Start ────────────────────────────────────────────────────────────
function startGame(data) {
  showScreen('game-screen');
  GameState.isPlaying = true;
  GameState.matchStartTime = Date.now();
  GameState.scores = { p1: 0, p2: 0 };
  GameState.streaks = { p1: 0, p2: 0 };
  GameState.ropePosition = 0;
  GameState.isStunned = false;
  
  // Update room code display
  DOM.gameRoomCode.textContent = GameState.roomId;
  
  // Update player names
  DOM.p1Name.textContent = data.room.players.p1?.name || 'Player 1';
  DOM.p2Name.textContent = data.room.players.p2?.name || 'Player 2';
  
  // Show initial question
  if (GameState.slot === 'p1' && data.questions.p1) {
    showQuestion(data.questions.p1);
  } else if (GameState.slot === 'p2' && data.questions.p2) {
    showQuestion(data.questions.p2);
  }
  
  // Start match timer
  startMatchTimer();
  
  // Start ping monitor
  startPingMonitor();
}

// ─── Question Display ──────────────────────────────────────────────────────
function showQuestion(question) {
  if (!question || GameState.isStunned) return;
  
  GameState.currentQuestion = question;
  GameState.numpadValue = '';
  
  DOM.questionPrompt.textContent = question.prompt;
  DOM.responseTime.textContent = '-- ms';
  
  if (GameState.inputMode === 'numpad') {
    DOM.answerOptions.style.display = 'none';
    DOM.numpad.style.display = 'block';
    DOM.numpadDisplay.textContent = '0';
  } else {
    DOM.answerOptions.style.display = 'grid';
    DOM.numpad.style.display = 'none';
    renderAnswerOptions(question.options);
  }
  
  startTimerBar();
}

function renderAnswerOptions(options) {
  DOM.answerOptions.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
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
  const totalDuration = 10000; // 10 seconds for full bar drain
  
  timerBarInterval = setInterval(() => {
    const elapsed = Date.now() - timerStartTime;
    const remaining = Math.max(0, 1 - (elapsed / totalDuration));
    const percent = remaining * 100;
    
    DOM.timerBar.style.width = `${percent}%`;
    
    // Update force potential display
    const responseTimeSec = elapsed / 1000;
    const force = calculateForcePreview(responseTimeSec);
    DOM.forcePotential.textContent = `Force: ${force}`;
    
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
  DOM.responseTime.textContent = `${responseTime} ms`;
  
  // Highlight selected answer
  if (GameState.inputMode === 'multiple_choice') {
    document.querySelectorAll('.answer-btn').forEach(btn => {
      if (parseInt(btn.textContent) === answer) {
        btn.style.borderColor = 'var(--primary-light)';
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
      DOM.numpadDisplay.textContent = GameState.numpadValue;
    } else if (btn.classList.contains('numpad-clear')) {
      GameState.numpadValue = '';
      DOM.numpadDisplay.textContent = '0';
    } else if (btn.classList.contains('numpad-enter')) {
      if (GameState.numpadValue !== '') {
        submitAnswer(parseInt(GameState.numpadValue));
      }
    }
  });
});

// Keyboard support for numpad mode
document.addEventListener('keydown', (e) => {
  if (!GameState.isPlaying || GameState.inputMode !== 'numpad' || GameState.isStunned) return;
  
  if (e.key >= '0' && e.key <= '9') {
    GameState.numpadValue += e.key;
    DOM.numpadDisplay.textContent = GameState.numpadValue;
  } else if (e.key === 'Enter') {
    if (GameState.numpadValue !== '') {
      submitAnswer(parseInt(GameState.numpadValue));
    }
  } else if (e.key === 'Backspace') {
    GameState.numpadValue = GameState.numpadValue.slice(0, -1);
    DOM.numpadDisplay.textContent = GameState.numpadValue || '0';
  }
});

// Keyboard support for multiple choice (1-4)
document.addEventListener('keydown', (e) => {
  if (!GameState.isPlaying || GameState.inputMode !== 'multiple_choice' || GameState.isStunned) return;
  
  const num = parseInt(e.key);
  if (num >= 1 && num <= 4) {
    const btns = DOM.answerOptions.querySelectorAll('.answer-btn');
    if (btns[num - 1]) {
      submitAnswer(parseInt(btns[num - 1].textContent));
    }
  }
});

// ─── Answer Result ─────────────────────────────────────────────────────────
function showAnswerResult(data) {
  if (data.isCorrect) {
    // Show pull effect
    document.querySelector('.game-arena').classList.add('pull-effect');
    setTimeout(() => {
      document.querySelector('.game-arena').classList.remove('pull-effect');
    }, 300);
  } else {
    // Show stun effect
    triggerStun();
  }
}

function triggerStun() {
  GameState.isStunned = true;
  
  const overlay = document.createElement('div');
  overlay.className = 'stun-overlay';
  overlay.textContent = 'SALAH!';
  document.body.appendChild(overlay);
  
  // Shake screen
  document.body.classList.add('shake');
  
  setTimeout(() => {
    overlay.remove();
    document.body.classList.remove('shake');
    GameState.isStunned = false;
  }, 600);
}

// ─── Game State Update ─────────────────────────────────────────────────────
function updateGameState(data) {
  // Update rope position with smooth interpolation
  const targetPosition = data.ropePosition;
  animateRopeTo(targetPosition);
  
  // Update scores (approximate from force applied)
  if (data.lastAction) {
    const action = data.lastAction;
    const slot = action.playerId === GameState.playerId ? GameState.slot : 
                 (GameState.slot === 'p1' ? 'p2' : 'p1');
    
    if (action.isCorrect) {
      GameState.scores[slot] += action.forceApplied;
      GameState.streaks[slot]++;
    } else {
      GameState.streaks[slot] = 0;
    }
    
    updateScoreDisplay();
  }
  
  // Update rope position text
  DOM.ropePosition.textContent = `Posisi: ${Math.round(data.ropePosition * 10) / 10}`;
}

function animateRopeTo(targetPosition) {
  const startPosition = GameState.ropePosition;
  const duration = 200; // ms
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startPosition + (targetPosition - startPosition) * eased;
    
    // Update rope visual (flag position)
    const percent = ((current + 120) / 240) * 100; // Map -120..120 to 0..100%
    DOM.rope.style.setProperty('--rope-percent', `${percent}%`);
    DOM.rope.querySelector('::after') || (DOM.rope.style.background = 
      `linear-gradient(90deg, var(--p1-color) 0%, var(--rope-color) ${percent}%, var(--p2-color) 100%)`);
    
    GameState.ropePosition = current;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

function updateScoreDisplay() {
  DOM.p1Score.textContent = Math.round(GameState.scores.p1);
  DOM.p2Score.textContent = Math.round(GameState.scores.p2);
  DOM.p1Streak.textContent = `Streak: ${GameState.streaks.p1}x`;
  DOM.p2Streak.textContent = `Streak: ${GameState.streaks.p2}x`;
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
    DOM.matchTime.textContent = `${minutes}:${seconds}`;
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
  DOM.pingDisplay.textContent = ping;
});

// ─── Match Over ────────────────────────────────────────────────────────────
function showMatchOver(data) {
  GameState.isPlaying = false;
  if (matchTimerInterval) clearInterval(matchTimerInterval);
  if (timerBarInterval) clearInterval(timerBarInterval);
  
  const isWinner = data.winnerId === GameState.playerId;
  
  DOM.resultTitle.textContent = isWinner ? 'MENANG!' : 'KALAH!';
  DOM.resultTitle.style.background = isWinner 
    ? 'linear-gradient(135deg, var(--secondary), var(--primary-light))'
    : 'linear-gradient(135deg, var(--danger), var(--warning))';
  DOM.resultTitle.style.webkitBackgroundClip = 'text';
  DOM.resultTitle.style.webkitTextFillColor = 'transparent';
  
  DOM.resultSubtitle.textContent = isWinner 
    ? 'Kamu memenangkan pertandingan!' 
    : 'Lawan lebih kali ini!';
  
  DOM.finalRopePos.textContent = data.finalRopePosition;
  DOM.finalDuration.textContent = `${data.durationSeconds}s`;
  
  // Update stats
  if (data.stats) {
    updateMatchStats('p1', data.stats.p1, data.room?.players?.p1?.name || 'Player 1');
    updateMatchStats('p2', data.stats.p2, data.room?.players?.p2?.name || 'Player 2');
  }
  
  showScreen('match-over');
}

function updateMatchStats(slot, stats, name) {
  const nameEl = document.getElementById(`stats-${slot}-name`);
  const accEl = document.getElementById(`stats-${slot}-accuracy`);
  const timeEl = document.getElementById(`stats-${slot}-avgtime`);
  const forceEl = document.getElementById(`stats-${slot}-force`);
  const streakEl = document.getElementById(`stats-${slot}-streak`);
  
  if (nameEl) nameEl.textContent = name;
  if (accEl) accEl.textContent = `${Math.round(stats.accuracy * 100)}%`;
  if (timeEl) timeEl.textContent = `${Math.round(stats.avgResponseTimeSec * 1000)}ms`;
  if (forceEl) forceEl.textContent = Math.round(stats.totalForce * 10) / 10;
  if (streakEl) streakEl.textContent = stats.highestStreak;
}

// ─── Rematch & Navigation ──────────────────────────────────────────────────
DOM.btnRematch.addEventListener('click', () => {
  socket.emit('REMATCH_REQUEST', {});
});

DOM.btnBackMenu.addEventListener('click', () => {
  GameState.roomId = null;
  GameState.slot = null;
  GameState.isPlaying = false;
  showScreen('main-menu');
});

// ─── Initialize ────────────────────────────────────────────────────────────
showScreen('main-menu');
