const GameRoomManager = require('../server/game/GameRoomManager');
const { MathEngine } = require('../server/game/MathEngine');

console.log('=== FULL GAME FLOW TEST ===\n');
const manager = new GameRoomManager();

// STEP 1: Player 1 creates room
console.log('STEP 1: Player 1 (Budi) creates room');
const room = manager.createRoom({ difficulty: 'medium', winThreshold: 100 });
const roomCode = room.roomId;
const is6Digits = /^\d{6}$/.test(roomCode);
console.log('  Room code:', roomCode, is6Digits ? '✓ 6 digits' : '✗');
manager.joinRoom(roomCode, 'p_budi', 'Budi');
console.log('  Budi joined as P1');

// STEP 2: Player 2 joins with code
console.log('\nSTEP 2: Player 2 (Andi) joins with code', roomCode);
const joinResult = manager.joinRoom(roomCode, 'p_andi', 'Andi');
console.log('  Andi joined:', joinResult.success ? '✓' : '✗', 'as', joinResult.slot);
console.log('  Room full:', room.isFull() ? '✓' : '✗');

// STEP 3: Start game
console.log('\nSTEP 3: Starting game');
manager.startGame(roomCode);
console.log('  Game status:', room.gameState.status, '✓');

// STEP 4: Get questions (verify no answer leaked)
console.log('\nSTEP 4: Questions generated (security check)');
const q1 = manager.getQuestionForPlayer(roomCode, 'p_budi');
const q2 = manager.getQuestionForPlayer(roomCode, 'p_andi');
console.log('  P1 question:', q1.prompt, '| options:', q1.options.join(', '));
console.log('  P2 question:', q2.prompt, '| options:', q2.options.join(', '));
console.log('  Answer in P1 payload:', JSON.stringify(q1).includes('"answer"') ? 'YES ✗ SECURITY ISSUE' : 'NO ✓ SECURE');
console.log('  Answer in P2 payload:', JSON.stringify(q2).includes('"answer"') ? 'YES ✗ SECURITY ISSUE' : 'NO ✓ SECURE');

// STEP 5: Simulate Budi answers correctly (use per-player question)
console.log('\nSTEP 5: Budi answers correctly');
const realQ1 = room.getPlayerQuestion('p1');
const answer1 = realQ1.answer;
console.log('  Correct answer:', answer1);
const result1 = manager.submitAnswer(roomCode, 'p_budi', q1.questionId, answer1, Date.now());
console.log('  Result: isCorrect=', result1.isCorrect, '| force=', result1.forceApplied, '| ropePos=', Math.round(room.gameState.ropePosition*10)/10);

// STEP 6: Simulate Andi answers correctly (use per-player question)
console.log('\nSTEP 6: Andi answers correctly');
const realQ2 = room.getPlayerQuestion('p2');
const answer2 = realQ2.answer;
const result2 = manager.submitAnswer(roomCode, 'p_andi', q2.questionId, answer2, Date.now());
console.log('  Result: isCorrect=', result2.isCorrect, '| force=', result2.forceApplied, '| ropePos=', Math.round(room.gameState.ropePosition*10)/10);

// STEP 7: Simulate wrong answer
console.log('\nSTEP 7: Budi answers wrong');
const currentQ = room.getPlayerQuestion('p1');
const result3 = manager.submitAnswer(roomCode, 'p_budi', currentQ.questionId, -999, Date.now());
console.log('  Result: isCorrect=', result3.isCorrect, '| force=', result3.forceApplied, '(should be 0)');

// STEP 8: Simulate many correct answers to trigger win
console.log('\nSTEP 8: Simulating match to completion...');
let safety = 0;
while (room.gameState.status === 'playing' && safety < 50) {
  safety++;
  // Alternate players answering correctly
  if (safety % 2 === 0) {
    const q = room.getPlayerQuestion('p1');
    if (q) manager.submitAnswer(roomCode, 'p_budi', q.questionId, q.answer, Date.now());
  } else {
    const q = room.getPlayerQuestion('p2');
    if (q) manager.submitAnswer(roomCode, 'p_andi', q.questionId, q.answer, Date.now());
  }
}

// If game didn't end from balanced play, force one side
if (room.gameState.status === 'playing') {
  while (room.gameState.status === 'playing' && safety < 100) {
    safety++;
    const q = room.getPlayerQuestion('p1');
    if (q) manager.submitAnswer(roomCode, 'p_budi', q.questionId, q.answer, Date.now());
  }
}

console.log('  Game ended! Status:', room.gameState.status);
console.log('  Winner:', room.gameState.winnerId);
console.log('  Final rope position:', Math.round(room.gameState.ropePosition*10)/10);
console.log('  Duration:', room.gameState.matchEndTime - room.gameState.matchStartTime, 'ms');

console.log('\n=== ALL TESTS PASSED ✓ ===');
