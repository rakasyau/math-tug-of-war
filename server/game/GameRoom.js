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
    
    // Per-player question state (independent!)
    this.playerQuestions = {
      p1: { current: null, seed: null, history: [] },
      p2: { current: null, seed: null, history: [] },
    };
    
    // Per-player stats
    this.playerStats = {
      p1: { score: 0, streak: 0, maxStreak: 0, correctCount: 0, totalAnswers: 0, totalResponseTime: 0 },
      p2: { score: 0, streak: 0, maxStreak: 0, correctCount: 0, totalAnswers: 0, totalResponseTime: 0 },
    };
    
    this.gameState = {
      status: 'waiting', // waiting, ready, playing, finished
      ropePosition: CONFIG.ROPE_START,
      matchStartTime: null,
      matchEndTime: null,
      winnerId: null,
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
    
    // Generate initial questions for each player (independent seeds!)
    this.playerQuestions.p1.current = this._generateNewQuestion('p1');
    this.playerQuestions.p2.current = this._generateNewQuestion('p2');
    
    // Reset stats
    this.playerStats.p1 = { score: 0, streak: 0, maxStreak: 0, correctCount: 0, totalAnswers: 0, totalResponseTime: 0 };
    this.playerStats.p2 = { score: 0, streak: 0, maxStreak: 0, correctCount: 0, totalAnswers: 0, totalResponseTime: 0 };
  }
  
  // Generate a new question for a specific player
  _generateNewQuestion(playerSlot) {
    const seed = Date.now() + Math.floor(Math.random() * 100000) + (playerSlot === 'p1' ? 1 : 2);
    this.playerQuestions[playerSlot].seed = seed;
    
    const question = MathEngine.generateQuestion(this.settings.difficulty, seed);
    this.playerQuestions[playerSlot].current = question;
    
    return question;
  }
  
  // Get the current question for a specific player
  getPlayerQuestion(playerSlot) {
    return this.playerQuestions[playerSlot]?.current || null;
  }
  
  processAnswer(playerId, questionId, submittedAnswer, clientTimestamp) {
    if (this.gameState.status !== 'playing') {
      return { error: 'Game is not in progress' };
    }
    
    const playerSlot = this.getPlayerSlot(playerId);
    if (!playerSlot) {
      return { error: 'Player not found in this room' };
    }
    
    // Get the current question for this specific player
    const question = this.getPlayerQuestion(playerSlot);
    if (!question) {
      return { error: 'No question available' };
    }
    
    // Validate answer
    const isCorrect = (submittedAnswer === question.answer);
    const serverTime = Date.now();
    const responseTimeMs = clientTimestamp ? (serverTime - clientTimestamp) : 0;
    const responseTimeSec = Math.max(0.1, responseTimeMs / 1000);
    
    // Update player stats
    const stats = this.playerStats[playerSlot];
    stats.totalAnswers++;
    stats.totalResponseTime += responseTimeMs;
    
    let result = {
      playerId,
      isCorrect,
      forceApplied: 0,
      responseTimeMs: Math.round(responseTimeMs),
      correctAnswer: question.answer, // Send correct answer for feedback
    };
    
    if (isCorrect) {
      // Calculate force with combo
      stats.correctCount++;
      stats.streak++;
      if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
      
      const force = MathEngine.calculateForce(responseTimeSec, this.settings.difficulty, stats.streak);
      result.forceApplied = force;
      
      // Apply force to rope
      this.applyForce(playerSlot, force);
      stats.score += force;
      
      // Generate new question ONLY on correct answer
      this._generateNewQuestion(playerSlot);
      
    } else {
      // Wrong answer: reset streak, keep same question
      stats.streak = 0;
      // No new question — player must retry until correct
    }
    
    // Check win condition after every answer
    this.checkWinCondition();
    
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
      CONFIG.ROPE_MIN - 20,
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
  
  getPlayerStats(playerSlot) {
    const stats = this.playerStats[playerSlot];
    const avgResponseTime = stats.totalAnswers > 0 ? stats.totalResponseTime / stats.totalAnswers : 0;
    const accuracy = stats.totalAnswers > 0 ? stats.correctCount / stats.totalAnswers : 0;
    
    return {
      score: stats.score,
      streak: stats.streak,
      maxStreak: stats.maxStreak,
      accuracy,
      avgResponseTimeSec: avgResponseTime / 1000,
      totalForce: stats.score,
    };
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
  
  // Get public state with per-player questions (without answers)
  getStateWithQuestions() {
    const q1 = this.playerQuestions.p1.current;
    const q2 = this.playerQuestions.p2.current;
    
    return {
      ...this.getPublicState(),
      questions: {
        p1: q1 ? { questionId: q1.questionId, prompt: q1.prompt, options: q1.options } : null,
        p2: q2 ? { questionId: q2.questionId, prompt: q2.prompt, options: q2.options } : null,
      },
    };
  }
}

module.exports = GameRoom;
