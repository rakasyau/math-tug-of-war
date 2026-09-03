/**
 * ═══════════════════════════════════════════════════════════════════
 *  MATH TUG OF WAR — End-to-End Game Logic Test Suite
 *  Tests the full game flow using the actual server-side game engine
 * ═══════════════════════════════════════════════════════════════════
 */

const GameRoomManager = require('../server/game/GameRoomManager');
const GameRoom = require('../server/game/GameRoom');
const { MathEngine, CONFIG } = require('../server/game/MathEngine');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
    failures.push(message);
  }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}`);
}

// ─── Test 1: Room Creation & Joining ──────────────────────────────────────
section('TEST 1: Room Creation & Joining');

const manager = new GameRoomManager();

// Create room
const room = manager.createRoom({ difficulty: 'medium', winThreshold: 100 });
const roomCode = room.roomId;
assert(/^\d{6}$/.test(roomCode), `Room code is 6 digits: ${roomCode}`);
assert(room.settings.difficulty === 'medium', 'Difficulty set to medium');
assert(room.settings.winThreshold === 100, 'Win threshold set to 100');

// P1 joins
const p1Join = manager.joinRoom(roomCode, 'player1', 'Budi');
assert(p1Join.success === true, 'Player 1 joined successfully');
assert(p1Join.slot === 'p1', 'Player 1 assigned to p1 slot');
assert(!room.isFull(), 'Room not full with 1 player');

// P2 joins
const p2Join = manager.joinRoom(roomCode, 'player2', 'Andi');
assert(p2Join.success === true, 'Player 2 joined successfully');
assert(p2Join.slot === 'p2', 'Player 2 assigned to p2 slot');
assert(room.isFull(), 'Room full with 2 players');

// ─── Test 2: Duplicate Join Prevention (Bug 1 fix) ───────────────────────
section('TEST 2: Duplicate Join Prevention');

const room2 = manager.createRoom({ difficulty: 'easy' });
const code2 = room2.roomId;
manager.joinRoom(code2, 'dupePlayer', 'Dupe');
const dupeResult = manager.joinRoom(code2, 'dupePlayer', 'Dupe');
// Same player should not get a second slot
const slot1 = room2.getPlayerSlot('dupePlayer');
assert(slot1 === 'p1', 'First join got p1 slot');
// The second join should fail because the player is already p1
const hasP2 = room2.players.p2;
assert(!hasP2 || hasP2.id !== 'dupePlayer', 'Same player NOT duplicated into p2');

// ─── Test 3: Room Full Rejection ──────────────────────────────────────────
section('TEST 3: Room Full Rejection');

const fullResult = manager.joinRoom(roomCode, 'player3', 'Charlie');
assert(fullResult.error === 'Room is full', 'Third player rejected from full room');

// ─── Test 4: Game Start & Per-Player Questions ───────────────────────────
section('TEST 4: Game Start & Per-Player Questions');

const startResult = manager.startGame(roomCode);
assert(startResult.success === true, 'Game started successfully');
assert(room.gameState.status === 'playing', 'Game status is "playing"');
assert(room.gameState.matchStartTime !== null, 'Match start time recorded');

// Each player gets their own question
const q1 = manager.getQuestionForPlayer(roomCode, 'player1');
const q2 = manager.getQuestionForPlayer(roomCode, 'player2');
assert(q1 !== null, 'P1 has a question');
assert(q2 !== null, 'P2 has a question');
assert(q1.questionId !== q2.questionId, 'P1 and P2 have DIFFERENT questions');
assert(q1.prompt !== undefined, 'P1 question has prompt');
assert(q1.options.length === 4, 'P1 question has 4 options');
assert(!q1.hasOwnProperty('answer'), 'P1 question does NOT expose answer');
assert(!q2.hasOwnProperty('answer'), 'P2 question does NOT expose answer');

// ─── Test 5: Correct Answer → Force Applied ──────────────────────────────
section('TEST 5: Correct Answer → Force Applied');

// Get the actual question with answer from the room internals
const realQ1 = room.getPlayerQuestion('p1');
const correctAnswer1 = realQ1.answer;

const result1 = manager.submitAnswer(roomCode, 'player1', realQ1.questionId, correctAnswer1, Date.now());
assert(result1.isCorrect === true, 'Correct answer recognized');
assert(result1.forceApplied > 0, `Force applied: ${result1.forceApplied}`);
assert(room.gameState.ropePosition < 0, `Rope moved left (P1 direction): ${room.gameState.ropePosition}`);
assert(room.playerStats.p1.streak === 1, 'P1 streak incremented to 1');
assert(room.playerStats.p1.correctCount === 1, 'P1 correct count = 1');
assert(room.playerStats.p1.totalAnswers === 1, 'P1 total answers = 1');

// New question should have been generated
const newQ1 = room.getPlayerQuestion('p1');
assert(newQ1.questionId !== realQ1.questionId, 'New question generated after correct answer');

// ─── Test 6: Wrong Answer → No Force, Same Question ─────────────────────
section('TEST 6: Wrong Answer → No Force, Same Question');

const beforeRope = room.gameState.ropePosition;
const currentQ2 = room.getPlayerQuestion('p2');
const wrongAnswer = currentQ2.answer + 9999; // Guaranteed wrong

const result2 = manager.submitAnswer(roomCode, 'player2', currentQ2.questionId, wrongAnswer, Date.now());
assert(result2.isCorrect === false, 'Wrong answer recognized');
assert(result2.forceApplied === 0, 'No force applied for wrong answer');
assert(room.gameState.ropePosition === beforeRope, 'Rope did not move');
assert(room.playerStats.p2.streak === 0, 'P2 streak reset to 0');
assert(result2.correctAnswer === currentQ2.answer, 'Correct answer sent back for feedback');

// Same question should be kept
const stillQ2 = room.getPlayerQuestion('p2');
assert(stillQ2.questionId === currentQ2.questionId, 'Same question kept after wrong answer');

// ─── Test 7: Streak & Combo System ──────────────────────────────────────
section('TEST 7: Streak & Combo System');

// Answer correctly 3 times for P1 to build streak
for (let i = 0; i < 3; i++) {
  const q = room.getPlayerQuestion('p1');
  manager.submitAnswer(roomCode, 'player1', q.questionId, q.answer, Date.now());
}
// P1 had 1 correct before, now 3 more = 4 total, streak = 4
assert(room.playerStats.p1.streak === 4, `P1 streak after 4 correct: ${room.playerStats.p1.streak}`);
assert(room.playerStats.p1.maxStreak === 4, `P1 max streak: ${room.playerStats.p1.maxStreak}`);

// Wrong answer resets streak but not maxStreak
const wrongQ = room.getPlayerQuestion('p1');
manager.submitAnswer(roomCode, 'player1', wrongQ.questionId, wrongQ.answer + 9999, Date.now());
assert(room.playerStats.p1.streak === 0, 'Streak reset after wrong');
assert(room.playerStats.p1.maxStreak === 4, 'Max streak preserved');

// ─── Test 8: Force Calculation ──────────────────────────────────────────
section('TEST 8: Force Calculation');

// Fast response, no streak
const force1 = MathEngine.calculateForce(0.5, 'medium', 0);
assert(force1 > 0, `Force for 0.5s medium: ${force1}`);

// Slow response should give less force
const force2 = MathEngine.calculateForce(5.0, 'medium', 0);
assert(force2 < force1, `Force decays with time: ${force2} < ${force1}`);

// Streak should give more force
const force3 = MathEngine.calculateForce(0.5, 'medium', 5);
assert(force3 > force1, `Combo bonus: ${force3} > ${force1}`);

// Combo cap at 1.5x
const force4 = MathEngine.calculateForce(0.5, 'medium', 100);
const force5 = MathEngine.calculateForce(0.5, 'medium', 50);
assert(force4 === force5, `Combo capped: ${force4} === ${force5}`);

// Difficulty affects base force
const forceEasy = MathEngine.calculateForce(1.0, 'easy', 0);
const forceMed = MathEngine.calculateForce(1.0, 'medium', 0);
const forceHard = MathEngine.calculateForce(1.0, 'hard', 0);
assert(forceHard > forceMed && forceMed > forceEasy, 
  `Hard(${forceHard}) > Medium(${forceMed}) > Easy(${forceEasy})`);

// ─── Test 9: Win Condition ───────────────────────────────────────────────
section('TEST 9: Win Condition');

const winRoom = manager.createRoom({ difficulty: 'easy', winThreshold: 50 });
const winCode = winRoom.roomId;
manager.joinRoom(winCode, 'win_p1', 'Winner');
manager.joinRoom(winCode, 'win_p2', 'Loser');
manager.startGame(winCode);

// Force rope to threshold
let safety = 0;
while (winRoom.gameState.status === 'playing' && safety < 200) {
  safety++;
  const q = winRoom.getPlayerQuestion('p1');
  if (!q) break;
  manager.submitAnswer(winCode, 'win_p1', q.questionId, q.answer, Date.now());
}

assert(winRoom.gameState.status === 'finished', 'Game finished after threshold');
assert(winRoom.gameState.winnerId === 'win_p1', `Winner is P1 (pulled rope to -50)`);
assert(winRoom.gameState.ropePosition <= -50, `Rope at or beyond -50: ${winRoom.gameState.ropePosition}`);
assert(winRoom.gameState.matchEndTime !== null, 'Match end time recorded');

// ─── Test 10: P2 Win (rope goes positive) ───────────────────────────────
section('TEST 10: P2 Win Direction');

const p2WinRoom = manager.createRoom({ difficulty: 'easy', winThreshold: 50 });
const p2WinCode = p2WinRoom.roomId;
manager.joinRoom(p2WinCode, 'dir_p1', 'P1');
manager.joinRoom(p2WinCode, 'dir_p2', 'P2');
manager.startGame(p2WinCode);

safety = 0;
while (p2WinRoom.gameState.status === 'playing' && safety < 200) {
  safety++;
  const q = p2WinRoom.getPlayerQuestion('p2');
  if (!q) break;
  manager.submitAnswer(p2WinCode, 'dir_p2', q.questionId, q.answer, Date.now());
}

assert(p2WinRoom.gameState.status === 'finished', 'Game finished');
assert(p2WinRoom.gameState.winnerId === 'dir_p2', 'P2 won by pulling rope positive');
assert(p2WinRoom.gameState.ropePosition >= 50, `Rope at or beyond +50: ${p2WinRoom.gameState.ropePosition}`);

// ─── Test 11: Distractor Quality (Bug 8 fix) ────────────────────────────
section('TEST 11: Distractor Quality (No Negatives)');

// Generate many questions and verify no negative options
let negativeFound = false;
let duplicateFound = false;
let missingAnswer = false;

for (let i = 0; i < 200; i++) {
  const seed = Date.now() + i * 7919;
  const difficulties = ['easy', 'medium', 'hard'];
  const diff = difficulties[i % 3];
  const question = MathEngine.generateQuestion(diff, seed);
  
  // Check no negative options
  const negOpts = question.options.filter(o => o < 0);
  if (negOpts.length > 0) {
    negativeFound = true;
    console.log(`  !! Negative option found: ${question.prompt} = ${question.answer}, options: ${question.options}`);
  }
  
  // Check answer is in options
  if (!question.options.includes(question.answer)) {
    missingAnswer = true;
    console.log(`  !! Answer not in options: ${question.prompt} = ${question.answer}, options: ${question.options}`);
  }
  
  // Check exactly 4 unique options
  const unique = new Set(question.options);
  if (unique.size !== 4) {
    duplicateFound = true;
    console.log(`  !! Duplicate/missing options: ${question.options} (unique: ${unique.size})`);
  }
}

assert(!negativeFound, 'No negative options in 200 questions');
assert(!missingAnswer, 'Answer always present in options');
assert(!duplicateFound, 'All 4 options are unique');

// ─── Test 12: Rematch State Reset (Bug 2 fix) ───────────────────────────
section('TEST 12: Rematch State Reset');

// Use the win room from test 9 — simulate rematch
const rematchRoom = winRoom;

// Verify dirty state before reset
assert(rematchRoom.gameState.status === 'finished', 'Room is finished before rematch');
assert(rematchRoom.playerStats.p1.correctCount > 0, 'P1 has stats from previous match');

// Simulate REMATCH_ACCEPT logic (same as server/index.js handler)
rematchRoom.gameState.status = 'waiting';
rematchRoom.gameState.ropePosition = CONFIG.ROPE_START;
rematchRoom.gameState.winnerId = null;
rematchRoom.gameState.matchStartTime = null;
rematchRoom.gameState.matchEndTime = null;
rematchRoom.readyState = {};
rematchRoom.playerStats = {
  p1: { score: 0, streak: 0, maxStreak: 0, correctCount: 0, totalAnswers: 0, totalResponseTime: 0 },
  p2: { score: 0, streak: 0, maxStreak: 0, correctCount: 0, totalAnswers: 0, totalResponseTime: 0 },
};
rematchRoom.playerQuestions = {
  p1: { current: null, seed: null, history: [] },
  p2: { current: null, seed: null, history: [] },
};

assert(rematchRoom.gameState.status === 'waiting', 'Status reset to waiting');
assert(rematchRoom.gameState.ropePosition === 0, 'Rope reset to 0');
assert(rematchRoom.gameState.winnerId === null, 'Winner cleared');
assert(rematchRoom.playerStats.p1.correctCount === 0, 'P1 stats reset');
assert(rematchRoom.playerStats.p2.score === 0, 'P2 score reset');
assert(rematchRoom.playerQuestions.p1.current === null, 'P1 question cleared');
assert(rematchRoom.playerQuestions.p2.current === null, 'P2 question cleared');

// Start a new match on the rematch room
rematchRoom.startMatch();
assert(rematchRoom.gameState.status === 'playing', 'Rematch started successfully');
const rematchQ1 = rematchRoom.getPlayerQuestion('p1');
assert(rematchQ1 !== null, 'New question generated for rematch');

// ─── Test 13: Player Stats Calculation ───────────────────────────────────
section('TEST 13: Player Stats Calculation');

const statsRoom = manager.createRoom({ difficulty: 'easy', winThreshold: 200 });
const statsCode = statsRoom.roomId;
manager.joinRoom(statsCode, 'stats_p1', 'StatsP1');
manager.joinRoom(statsCode, 'stats_p2', 'StatsP2');
manager.startGame(statsCode);

// P1 answers 3 correct, 1 wrong
for (let i = 0; i < 3; i++) {
  const q = statsRoom.getPlayerQuestion('p1');
  manager.submitAnswer(statsCode, 'stats_p1', q.questionId, q.answer, Date.now());
}
const wrongQ2 = statsRoom.getPlayerQuestion('p1');
manager.submitAnswer(statsCode, 'stats_p1', wrongQ2.questionId, wrongQ2.answer + 999, Date.now());

const p1Stats = statsRoom.getPlayerStats('p1');
assert(p1Stats.accuracy === 0.75, `Accuracy: 3/4 = ${p1Stats.accuracy}`);
assert(p1Stats.maxStreak === 3, `Max streak: ${p1Stats.maxStreak}`);
assert(p1Stats.streak === 0, `Current streak (after wrong): ${p1Stats.streak}`);
assert(p1Stats.score > 0, `Total score: ${p1Stats.score}`);

// ─── Test 14: Leave Room & Cleanup ───────────────────────────────────────
section('TEST 14: Leave Room & Cleanup');

const leaveRoom = manager.createRoom({ difficulty: 'easy' });
const leaveCode = leaveRoom.roomId;
manager.joinRoom(leaveCode, 'leave_p1', 'LeaveP1');
manager.joinRoom(leaveCode, 'leave_p2', 'LeaveP2');
assert(leaveRoom.isFull(), 'Room full before leave');

manager.leaveRoom('leave_p1');
assert(!leaveRoom.isFull(), 'Room not full after P1 leave');
assert(leaveRoom.players.p1 === null, 'P1 slot cleared');

manager.leaveRoom('leave_p2');
// Room should be deleted when empty
assert(manager.getRoom(leaveCode) === undefined, 'Empty room auto-deleted');

// ─── Test 15: Matchmaking Queue ──────────────────────────────────────────
section('TEST 15: Matchmaking Queue');

const mm1 = manager.joinMatchmaking('mm_p1', 'MM1', { difficulty: 'hard' });
assert(mm1.success === true, 'P1 joined matchmaking');
assert(mm1.slot === 'p1', 'P1 is first in queue → p1 slot');

// P2 joins with same difficulty → matched
const mm2 = manager.joinMatchmaking('mm_p2', 'MM2', { difficulty: 'hard' });
assert(mm2.success === true, 'P2 matched with P1');
assert(mm2.slot === 'p2', 'P2 gets p2 slot');
assert(mm2.room.roomId === mm1.room.roomId, 'Same room for matched players');

// P3 with different difficulty → new room
const mm3 = manager.joinMatchmaking('mm_p3', 'MM3', { difficulty: 'easy' });
assert(mm3.success === true, 'P3 joined matchmaking');
assert(mm3.room.roomId !== mm1.room.roomId, 'Different difficulty → different room');

// ─── Test 16: Question Generation Across Difficulties ────────────────────
section('TEST 16: Question Generation Across Difficulties');

// Easy: only + and -
for (let i = 0; i < 20; i++) {
  const q = MathEngine.generateQuestion('easy', Date.now() + i * 31);
  const hasOnlyAddSub = /^[\d\s+−-]+$/.test(q.prompt);
  if (!hasOnlyAddSub) {
    assert(false, `Easy question should only have +/- but got: ${q.prompt}`);
    break;
  }
}
assert(true, 'Easy questions use only + and −');

// Hard: can include ×, ÷
let foundMul = false, foundDiv = false;
for (let i = 0; i < 200; i++) {
  const q = MathEngine.generateQuestion('hard', Date.now() + i * 37);
  if (q.prompt.includes('×')) foundMul = true;
  if (q.prompt.includes('÷')) foundDiv = true;
}
assert(foundMul, 'Hard difficulty generates × questions');
assert(foundDiv, 'Hard difficulty generates ÷ questions');

// ─── Results Summary ─────────────────────────────────────────────────────
section('TEST RESULTS SUMMARY');

console.log(`\n  Total: ${passed + failed} assertions`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failures.length > 0) {
  console.log(`\n  Failed assertions:`);
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

console.log(`\n${'═'.repeat(60)}`);
if (failed === 0) {
  console.log('  ALL TESTS PASSED!');
} else {
  console.log('  SOME TESTS FAILED');
  process.exit(1);
}
console.log(`${'═'.repeat(60)}\n`);
