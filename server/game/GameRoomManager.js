const { v4: uuidv4 } = require('uuid');
const GameRoom = require('./GameRoom');
const { CONFIG } = require('./MathEngine');

class GameRoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> GameRoom
    this.playerRooms = new Map(); // playerId -> roomId
    this.matchmakingQueue = [];
  }
  
  // ─── Room Management ─────────────────────────────────────────────────────
  createRoom(settings = {}) {
    const roomId = this._generateRoomCode();
    const room = new GameRoom(roomId, settings);
    this.rooms.set(roomId, room);
    return room;
  }
  
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }
  
  deleteRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Clean up player-room mappings
      if (room.players.p1) this.playerRooms.delete(room.players.p1.id);
      if (room.players.p2) this.playerRooms.delete(room.players.p2.id);
      this.rooms.delete(roomId);
    }
  }
  
  joinRoom(roomId, playerId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.isFull()) return { error: 'Room is full' };
    if (room.gameState.status === 'playing') return { error: 'Game already in progress' };
    
    const slot = room.addPlayer(playerId, playerName);
    if (slot) {
      this.playerRooms.set(playerId, roomId);
      return { success: true, slot, room };
    }
    return { error: 'Could not join room' };
  }
  
  leaveRoom(playerId) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(playerId);
      if (room.isEmpty()) {
        this.deleteRoom(roomId);
      }
    }
    this.playerRooms.delete(playerId);
  }
  
  // ─── Matchmaking ─────────────────────────────────────────────────────────
  joinMatchmaking(playerId, playerName, preferences = {}) {
    // Check if already in a room
    if (this.playerRooms.has(playerId)) {
      return { error: 'Already in a room' };
    }
    
    // Try to find an existing waiting room with matching preferences
    const waitingRoom = this.matchmakingQueue.find(r => {
      const room = this.rooms.get(r.roomId);
      return room && 
        room.gameState.status === 'waiting' && 
        !room.isFull() &&
        room.settings.difficulty === (preferences.difficulty || 'medium');
    });
    
    if (waitingRoom) {
      const room = this.rooms.get(waitingRoom.roomId);
      const result = this.joinRoom(room.roomId, playerId, playerName);
      if (result.success) {
        return result;
      }
    }
    
    // Create new room and add to queue
    const room = this.createRoom({ difficulty: preferences.difficulty || 'medium' });
    const result = this.joinRoom(room.roomId, playerId, playerName);
    
    if (result.success) {
      this.matchmakingQueue.push({ roomId: room.roomId, playerId, timestamp: Date.now() });
    }
    
    return result;
  }
  
  leaveMatchmaking(playerId) {
    this.matchmakingQueue = this.matchmakingQueue.filter(q => q.playerId !== playerId);
  }
  
  // ─── Game Actions ────────────────────────────────────────────────────────
  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (!room.isFull()) return { error: 'Need 2 players to start' };
    
    room.startMatch();
    this._removeFromMatchmaking(roomId);
    
    return { success: true, room };
  }
  
  submitAnswer(roomId, playerId, questionId, submittedAnswer, clientTimestamp) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    
    const result = room.processAnswer(playerId, questionId, submittedAnswer, clientTimestamp);
    
    // If game ended, clean up matchmaking
    if (room.gameState.status === 'finished') {
      this._removeFromMatchmaking(roomId);
    }
    
    return { ...result, room };
  }
  
  // ─── Utility ─────────────────────────────────────────────────────────────
  _generateRoomCode() {
    // Generate 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  _removeFromMatchmaking(roomId) {
    this.matchmakingQueue = this.matchmakingQueue.filter(q => q.roomId !== roomId);
  }
  
  getRoomByPlayer(playerId) {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) : null;
  }
  
  getQuestionForPlayer(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState.status !== 'playing') return null;
    
    const playerSlot = room.getPlayerSlot(playerId);
    if (!playerSlot) return null;
    
    // Return this player's current question (without answer)
    const question = room.getPlayerQuestion(playerSlot);
    
    return question ? {
      questionId: question.questionId,
      prompt: question.prompt,
      options: question.options,
    } : null;
  }
}

module.exports = GameRoomManager;
