const { MathEngine, CONFIG } = require('./MathEngine');

class GameRoom {
  constructor(roomId, settings = {}) {
    this.roomId = roomId;
    this.settings = {
      difficulty: settings.difficulty || 'medium',
      inputMode: settings.inputMode || 'multiple_choice',
      winThreshold: settings.winThreshold || CONFIG.DEFAULT_WIN_THRESHOLD,
    };
    
    this.players = {
      p1: null,
      p2: null,
    };
    
    this.gameState = {
      status: 'waiting', // waiting, ready, playing, finished
      ropePosition: CONFIG.ROPE_START,
      currentQuestionSeed: Date.now(),
      matchStartTime: null,
      matchEndTime: null,
      winnerId: null,
      questionCounter: 0,
    };
    
    this.lastBroadcastTime = 0;
  }
  
  addPlayer(playerId, playerName, slot = null) {
    if (slot === 'p1' || (!this.players.p1 && this.players.p2 !== playerId)) {
      this.players.p1 = { id: playerId, name: playerName };
      return 'p1';
    } else if (slot === 'p2' || (!this.players.p2 && this.players.p1 !== playerId)) {
      this.players.p2 = { id: playerId, name: playerName };
      return 'p2';
    }
    return null;
  }
  
  removePlayer(playerId) {
    if (this.players.p1?.id === playerId) this.players.p1 = null;
    if (this.players.p2?.id === playerId) this.players.p2 = null;
  }
  
  isFull() {
    return this.players.p1 !== null && this.players.p2 !== null;
  }
  
  isEmpty() {
    return this.players.p1 === null && this.players.p2 === null;
  }
  
  startMatch() {
    this.gameState.status = 'playing';
    this.gameState.matchStartTime = Date.now();
    this.gameState.ropePosition = CONFIG.ROPE_START;
    this.gameState.questionCounter = 0;
    this.generateNextQuestion();
  }
  
  generateNextQuestion() {
    this.gameState.questionCounter++;
    this.gameState.currentQuestionSeed = Date.now() + this.gameState.questionCounter;
  }
  
  processAnswer(playerId, questionId, submittedAnswer, clientTimestamp) {
    if (this.gameState.status !== 'playing') {
      return { error: 'Game is not in progress' };
    }
    
    const playerSlot = this.getPlayerSlot(playerId);
    if (!playerSlot) {
      return { error: 'Player not found in this room' };
    }
    
    const question = MathEngine.generateQuestion(
      this.settings.difficulty,
      this.gameState.currentQuestionSeed
    );
    
    const isCorrect = (submittedAnswer === question.answer);
    const serverTime = Date.now();
    const responseTimeSec = Math.max(0.1, (serverTime - this.gameState.matchStartTime) / 1000);
    
    let result = {
      playerId,
      isCorrect,
      forceApplied: 0,
      responseTimeMs: Math.round(responseTimeSec * 1000),
    };
    
    if (isCorrect) {
      const currentStreak = this.getCurrentStreak(playerId);
      const force = MathEngine.calculateForce(responseTimeSec, this.settings.difficulty, currentStreak);
      result.forceApplied = force;
      this.applyForce(playerSlot, force);
      this.incrementStreak(playerId);
    } else {
      this.resetStreak(playerId);
    }
    
    // Check win condition
    this.checkWinCondition();
    
    // Generate next question
    this.generateNextQuestion();
    
    return result;
  }
  
  applyForce(playerSlot, force) {
    // p1 pulls left (negative), p2 pulls right (positive)
    if (playerSlot === 'p1') {
      this.gameState.ropePosition -= force;
    } else {
      this.gameState.ropePosition += force;
    }
    
    // Clamp to valid range
    this.gameState.ropePosition = Math.max(
      CONFIG.ROPE_MIN - 20, // Allow slight overpull for visual effect
      Math.min(CONFIG.ROPE_MAX + 20, this.gameState.ropePosition)
    );
  }
  
  checkWinCondition() {
    const threshold = this.settings.winThreshold || CONFIG.DEFAULT_WIN_THRESHOLD;
    
    if (this.gameState.ropePosition <= -threshold) {
      this.gameState.winnerId = this.players.p1?.id;
      this.endMatch('THRESHOLD_REACHED');
    } else if (this.gameState.ropePosition >= threshold) {
      this.gameState.winnerId = this.players.p2?.id;
      this.endMatch('THRESHOLD_REACHED');
    }
  }
  
  endMatch(reason) {
    this.gameState.status = 'finished';
    this.gameState.matchEndTime = Date.now();
  }
  
  getPlayerSlot(playerId) {
    if (this.players.p1?.id === playerId) return 'p1';
    if (this.players.p2?.id === playerId) return 'p2';
    return null;
  }
  
  getCurrentStreak(playerId) {
    // In production, track per-player streak; simplified here
    return 0;
  }
  
  incrementStreak(playerId) {
    // Track per-player streak
  }
  
  resetStreak(playerId) {
    // Reset streak on wrong answer
  }
  
  getPublicState() {
    return {
      roomId: this.roomId,
      status: this.gameState.status,
      ropePosition: Math.round(this.gameState.ropePosition * 100) / 100,
      players: {
        p1: this.players.p1 ? { id: this.players.p1.id, name: this.players.p1.name } : null,
        p2: this.players.p2 ? { id: this.players.p2.id, name: this.players.p2.name } : null,
      },
      settings: this.settings,
      timestamp: Date.now(),
    };
  }
}

module.exports = GameRoom;
