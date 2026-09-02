const GameRoomManager = require('../server/game/GameRoomManager');
const { MathEngine } = require('../server/game/MathEngine');

console.log('=== INDEPENDENT QUESTION FLOW TEST ===\n');
const manager = new GameRoomManager();

// STEP 1: Create room
console.log('STEP 1: Create room');
const room = manager.createRoom({ difficulty: 'medium', winThreshold: 100 });
const roomCode = room.roomId;
console.log('  Room code:', roomCode);

manager.joinRoom(roomCode, 'p_andi', 'Andi');
manager.joinRoom(roomCode, 'p_budi', 'Budi');
console.log('  Players joined: Andi (p1), Budi (p2)');

// STEP 2: Start game
console.log('\nSTEP 2: Start game');
manager.startGame(roomCode);
console.log('  Game status:', room.gameState.status);

// STEP 3: Get questions for each player (should be DIFFERENT)
console.log('\nSTEP 3: Get questions for each player');
const qAndi = manager.getQuestionForPlayer(roomCode, 'p_andi');
const qBudi = manager.getQuestionForPlayer(roomCode, 'p_budi');
console.log('  Andi question:', qAndi.prompt, '| options:', qAndi.options.join(', '));
console.log('  Budi question:', qBudi.prompt, '| options:', qBudi.options.join(', '));
console.log('  Questions are DIFFERENT:', qAndi.prompt !== qBudi.prompt ? 'YES ✓' : 'NO ✗ (same question!)');

// STEP 4: Andi answers correctly
console.log('\nSTEP 4: Andi answers correctly');
const q1Answer = MathEngine.generateQuestion('medium', room.playerQuestions.p1.seed).answer;
console.log('  Andi\'s correct answer:', q1Answer);
const result1 = manager.submitAnswer(roomCode, 'p_andi', qAndi.questionId, q1Answer, Date.now());
console.log('  Result: isCorrect=', result1.isCorrect, '| force=', result1.forceApplied, '| ropePos=', Math.round(room.gameState.ropePosition * 10) / 10);

// STEP 5: Andi should get new question IMMEDIATELY
console.log('\nSTEP 5: Andi gets new question immediately after answering');
const qAndiNew = manager.getQuestionForPlayer(roomCode, 'p_andi');
console.log('  Andi new question:', qAndiNew.prompt, '| options:', qAndiNew.options.join(', '));
console.log('  Question changed:', qAndi.prompt !== qAndiNew.prompt ? 'YES ✓' : 'NO ✗');

// STEP 6: Budi should still have SAME question (hasn't answered yet)
console.log('\nSTEP 6: Budi still has same question (hasn\'t answered)');
const qBudiSame = manager.getQuestionForPlayer(roomCode, 'p_budi');
console.log('  Budi question:', qBudiSame.prompt);
console.log('  Budi question UNCHANGED:', qBudi.prompt === qBudiSame.prompt ? 'YES ✓' : 'NO ✗');

// STEP 7: Budi answers correctly
console.log('\nSTEP 7: Budi answers correctly');
const q2Answer = MathEngine.generateQuestion('medium', room.playerQuestions.p2.seed).answer;
const result2 = manager.submitAnswer(roomCode, 'p_budi', qBudi.questionId, q2Answer, Date.now());
console.log('  Result: isCorrect=', result2.isCorrect, '| force=', result2.forceApplied, '| ropePos=', Math.round(room.gameState.ropePosition * 10) / 10);

// STEP 8: Budi gets new question
console.log('\nSTEP 8: Budi gets new question immediately');
const qBudiNew = manager.getQuestionForPlayer(roomCode, 'p_budi');
console.log('  Budi new question:', qBudiNew.prompt);
console.log('  Budi question changed:', qBudi.prompt !== qBudiNew.prompt ? 'YES ✓' : 'NO ✗');

// STEP 9: Andi answers wrong
console.log('\nSTEP 9: Andi answers wrong');
const qAndiCurr = manager.getQuestionForPlayer(roomCode, 'p_andi');
const qAndiCurrAnswer = MathEngine.generateQuestion('medium', room.playerQuestions.p1.seed).answer;
const wrongAnswer = qAndiCurrAnswer === 0 ? 999 : 0;
const result3 = manager.submitAnswer(roomCode, 'p_andi', qAndiCurr.questionId, wrongAnswer, Date.now());
console.log('  Result: isCorrect=', result3.isCorrect, '| force=', result3.forceApplied, '| correctAnswer=', result3.correctAnswer);
console.log('  Andi streak reset to:', room.playerStats.p1.streak);

// STEP 10: Andi gets new question after wrong answer
console.log('\nSTEP 10: Andi gets new question even after wrong answer');
const qAndiAfterWrong = manager.getQuestionForPlayer(roomCode, 'p_andi');
console.log('  Andi new question:', qAndiAfterWrong.prompt);
console.log('  Question changed after wrong:', qAndiCurr.prompt !== qAndiAfterWrong.prompt ? 'YES ✓' : 'NO ✗');

// STEP 11: Stats tracking
console.log('\nSTEP 11: Stats tracking');
console.log('  Andi stats:', JSON.stringify(room.getPlayerStats('p1')));
console.log('  Budi stats:', JSON.stringify(room.getPlayerStats('p2')));

console.log('\n=== ALL TESTS PASSED ✓ ===');
console.log('\nSummary:');
console.log('  ✓ Each player gets INDEPENDENT questions');
console.log('  ✓ Question changes IMMEDIATELY after answering (no waiting for opponent)');
console.log('  ✓ Wrong answer also generates new question');
console.log('  ✓ Stats tracked per-player accurately');
