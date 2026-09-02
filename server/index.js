const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const GameRoomManager = require('./game/GameRoomManager');
const { CONFIG } = require('./game/MathEngine');

// ─── Server Setup ──────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 25000,
  pingTimeout: 10000,
});

const manager = new GameRoomManager();

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// ─── Socket.IO Connection Handling ─────────────────────────────────────────
io.on('connection', (socket) => {
  const playerId = uuidv4();
  socket.data.playerId = playerId;
  socket.data.playerName = `Player_${playerId.slice(0, 4)}`;
  
  console.log(`[CONNECT] ${playerId} connected`);
  
  // Send player their ID
  socket.emit('PLAYER_ID', { playerId });
  
  // ─── Quick Match ────────────────────────────────────────────────────────
  socket.on('QUICK_MATCH', (data) => {
    console.log(`[MATCHMAKING] ${playerId} looking for match`);
    
    const result = manager.joinMatchmaking(
      playerId,
      data.playerName || socket.data.playerName,
      { difficulty: data.difficulty }
    );
    
    if (result.error) {
      socket.emit('ERROR', { message: result.error });
      return;
    }
    
    const room = result.room;
    socket.join(room.roomId);
    
    socket.emit('ROOM_JOINED', {
      roomId: room.roomId,
      slot: result.slot,
      room: room.getPublicState(),
    });
    
    // Notify other player
    socket.to(room.roomId).emit('PLAYER_JOINED', {
      playerId,
      playerName: data.playerName || socket.data.playerName,
    });
    
    // If room is full, notify both players
    if (room.isFull()) {
      io.to(room.roomId).emit('ROOM_READY', {
        room: room.getPublicState(),
      });
    }
  });
  
  // ─── Create Private Room ────────────────────────────────────────────────
  socket.on('CREATE_ROOM', (data) => {
    const room = manager.createRoom({
      difficulty: data.difficulty || 'medium',
      inputMode: data.inputMode || 'multiple_choice',
      winThreshold: data.winThreshold || CONFIG.DEFAULT_WIN_THRESHOLD,
    });
    
    const result = manager.joinRoom(room.roomId, playerId, data.playerName || socket.data.playerName);
    
    if (result.success) {
      socket.join(room.roomId);
      socket.emit('ROOM_CREATED', {
        roomId: room.roomId,
        slot: result.slot,
        room: room.getPublicState(),
      });
    }
  });
  
  // ─── Join Private Room ──────────────────────────────────────────────────
  socket.on('JOIN_ROOM', (data) => {
    const result = manager.joinRoom(data.roomId, playerId, data.playerName || socket.data.playerName);
    
    if (result.error) {
      socket.emit('ERROR', { message: result.error });
      return;
    }
    
    const room = result.room;
    socket.join(room.roomId);
    
    socket.emit('ROOM_JOINED', {
      roomId: room.roomId,
      slot: result.slot,
      room: room.getPublicState(),
    });
    
    socket.to(room.roomId).emit('PLAYER_JOINED', {
      playerId,
      playerName: data.playerName || socket.data.playerName,
    });
    
    if (room.isFull()) {
      io.to(room.roomId).emit('ROOM_READY', {
        room: room.getPublicState(),
      });
    }
  });
  
  // ─── Ready Check ────────────────────────────────────────────────────────
  socket.on('PLAYER_READY', (data) => {
    const room = manager.getRoomByPlayer(playerId);
    if (!room) return;
    
    socket.to(room.roomId).emit('OPPONENT_READY', { playerId });
    
    // Track ready state
    if (!room.readyState) room.readyState = {};
    const playerSlot = room.getPlayerSlot(playerId);
    if (playerSlot) {
      room.readyState[playerSlot] = true;
    }
    
    // Auto-start when both players ready
    if (room.readyState.p1 && room.readyState.p2) {
      console.log(`[GAME] Both players ready in room ${room.roomId}, starting in 500ms...`);
      setTimeout(() => {
        if (room.gameState.status === 'waiting') {
          const result = manager.startGame(room.roomId);
          if (result.success) {
            console.log(`[GAME] Room ${room.roomId} started!`);
            const q1 = manager.getQuestionForPlayer(room.roomId, room.players.p1.id);
            const q2 = manager.getQuestionForPlayer(room.roomId, room.players.p2.id);
            
            io.to(room.roomId).emit('GAME_STARTED', {
              room: room.getPublicState(),
              questions: { p1: q1, p2: q2 },
            });
          }
        }
      }, 500);
    }
  });
  
  // ─── Game auto-starts when both ready ──────────────────────────────────
  // (Server emits GAME_STARTED directly when both players ready)
  
  // ─── Submit Answer ──────────────────────────────────────────────────────
  socket.on('SUBMIT_ANSWER', (data) => {
    const room = manager.getRoomByPlayer(playerId);
    if (!room || room.gameState.status !== 'playing') return;
    
    const result = manager.submitAnswer(
      room.roomId,
      playerId,
      data.questionId,
      data.submittedAnswer,
      data.clientTimestamp
    );
    
    if (result.error) {
      socket.emit('ERROR', { message: result.error });
      return;
    }
    
    // Get the next question for this player (already generated in processAnswer)
    const nextQuestion = room.getPlayerQuestion(room.getPlayerSlot(playerId));
    
    // Send result + next question to answering player ONLY
    socket.emit('ANSWER_RESULT', {
      isCorrect: result.isCorrect,
      forceApplied: result.forceApplied,
      responseTimeMs: result.responseTimeMs,
      correctAnswer: result.correctAnswer,
      nextQuestion: nextQuestion ? {
        questionId: nextQuestion.questionId,
        prompt: nextQuestion.prompt,
        options: nextQuestion.options,
      } : null,
    });
    
    // Broadcast rope state to BOTH players (but NOT the next question)
    io.to(room.roomId).emit('GAME_STATE_UPDATE', {
      roomId: room.roomId,
      ropePosition: Math.round(room.gameState.ropePosition * 100) / 100,
      lastAction: {
        playerId: result.playerId,
        isCorrect: result.isCorrect,
        forceApplied: result.forceApplied,
        responseTimeMs: result.responseTimeMs,
      },
      players: {
        p1: room.players.p1 ? {
          id: room.players.p1.id,
          name: room.players.p1.name,
          score: Math.round(room.playerStats.p1.score * 10) / 10,
          streak: room.playerStats.p1.streak,
        } : null,
        p2: room.players.p2 ? {
          id: room.players.p2.id,
          name: room.players.p2.name,
          score: Math.round(room.playerStats.p2.score * 10) / 10,
          streak: room.playerStats.p2.streak,
        } : null,
      },
      timestamp: Date.now(),
    });
    
    // Check if game ended
    if (room.gameState.status === 'finished') {
      const duration = room.gameState.matchEndTime - room.gameState.matchStartTime;
      
      io.to(room.roomId).emit('MATCH_OVER', {
        roomId: room.roomId,
        winnerId: room.gameState.winnerId,
        reason: 'THRESHOLD_REACHED',
        finalRopePosition: Math.round(room.gameState.ropePosition * 100) / 100,
        durationSeconds: Math.round(duration / 1000),
        stats: {
          p1: room.getPlayerStats('p1'),
          p2: room.getPlayerStats('p2'),
        },
        room: room.getPublicState(),
      });
    }
  });
  
  // ─── Rematch Request ────────────────────────────────────────────────────
  socket.on('REMATCH_REQUEST', () => {
    const room = manager.getRoomByPlayer(playerId);
    if (!room) return;
    
    socket.to(room.roomId).emit('REMATCH_REQUESTED', { playerId });
  });
  
  // ─── Ping/Pong for Latency Measurement ─────────────────────────────────
  socket.on('PING', () => {
    socket.emit('PONG');
  });

  socket.on('REMATCH_ACCEPT', () => {
    const room = manager.getRoomByPlayer(playerId);
    if (!room) return;
    
    // Reset room for rematch
    room.gameState.status = 'waiting';
    room.gameState.ropePosition = CONFIG.ROPE_START;
    room.gameState.winnerId = null;
    room.gameState.matchStartTime = null;
    room.gameState.matchEndTime = null;
    room.gameState.questionCounter = 0;
    room.readyState = {};
    
    io.to(room.roomId).emit('REMATCH_ACCEPTED', {
      room: room.getPublicState(),
    });
  });
  
  // ─── Leave Room ─────────────────────────────────────────────────────────
  socket.on('LEAVE_ROOM', () => {
    const room = manager.getRoomByPlayer(playerId);
    if (room) {
      socket.leave(room.roomId);
      socket.to(room.roomId).emit('PLAYER_LEFT', { playerId });
    }
    manager.leaveRoom(playerId);
    manager.leaveMatchmaking(playerId);
  });

  // ─── Disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] ${playerId} disconnected`);
    manager.leaveRoom(playerId);
    manager.leaveMatchmaking(playerId);
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║        MATH TUG OF WAR - Server Running           ║
  ╠═══════════════════════════════════════════════════╣
  ║  Port: ${PORT}                                       ║
  ║  URL:  http://localhost:${PORT}                      ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server };
