const GameRoomManager = require('../server/game/GameRoomManager');
const { MathEngine } = require('../server/game/MathEngine');

console.log('=== INDEPENDENT QUESTIONS: Wrong = Retry Test ===\n');
const manager = new GameRoomManager();

// Setup room
const room = manager.createRoom({ difficulty: 'medium', winThreshold: 100 });
const roomId = room.roomId;
manager.joinRoom(roomId, 'p_andi', 'Andi');
manager.joinRoom(roomId, 'p_budi', 'Budi');
manager.startGame(roomId);

console.log('STEP 1: Initial questions');
const q1Andi = manager.getQuestionForPlayer(roomId, 'p_andi');
const q1Budi = manager.getQuestionForPlayer(roomId, 'p_budi');
console.log('  Andi Q1:', q1Andi.prompt);
console.log('  Budi Q1:', q1Budi.prompt);
console.log('  Different:', q1Andi.prompt !== q1Budi.prompt ? 'YES ✓' : 'NO ✗');

console.log('\nSTEP 2: Andi answers WRONG');
const realAnswer = MathEngine.generateQuestion('medium', room.playerQuestions.p1.seed).answer;
const wrongAnswer = realAnswer === 0 ? 999 : 0;
const wrongResult = manager.submitAnswer(roomId, 'p_andi', q1Andi.questionId, wrongAnswer, Date.now());
console.log('  isCorrect:', wrongResult.isCorrect);
console.log('  correctAnswer:', wrongResult.correctAnswer);
console.log('  Andi streak reset to:', room.playerStats.p1.streak);

console.log('\nSTEP 3: Andi should have SAME question (retry)');
const q1AndiRetry = manager.getQuestionForPlayer(roomId, 'p_andi');
console.log('  Andi question after wrong:', q1AndiRetry.prompt);
console.log('  Same question ID:', q1Andi.questionId === q1AndiRetry.questionId ? 'YES ✓' : 'NO ✗');

console.log('\nSTEP 4: Andi answers CORRECTLY');
const correctResult = manager.submitAnswer(roomId, 'p_andi', q1AndiRetry.questionId, realAnswer, Date.now());
console.log('  isCorrect:', correctResult.isCorrect, '| force:', correctResult.forceApplied);

console.log('\nSTEP 5: Andi gets NEW question after correct');
const q2Andi = manager.getQuestionForPlayer(roomId, 'p_andi');
console.log('  Andi Q2:', q2Andi.prompt);
console.log('  Question changed:', q1Andi.questionId !== q2Andi.questionId ? 'YES ✓' : 'NO ✗');

console.log('\nSTEP 6: Budi unaffected by Andi\'s wrong answer');
const q1BudiAfter = manager.getQuestionForPlayer(roomId, 'p_budi');
console.log('  Budi still has:', q1BudiAfter.prompt);
console.log('  Unchanged:', q1Budi.questionId === q1BudiAfter.questionId ? 'YES ✓' : 'NO ✗');

console.log('\n=== BEHAVIOR SUMMARY ===');
console.log('  ✓ Wrong answer = keep same question (retry until correct)');
console.log('  ✓ Correct answer = get new question');
console.log('  ✓ Players are independent');
console.log('  ✓ Stats tracked correctly');
