// ─── Handle Answer (Host receives from Guest) ─────────────────────────────
function handleOpponentAnswer(data) {
  if (!GameState.isHost) return;
  
  // Guest is always p2 (the opponent of host p1)
  const slot = 'p2';
  const question = playerQuestions[slot].current;
  
  const isCorrect = (data.submittedAnswer === question.answer);
  const responseTimeMs = data.responseTimeMs || 0;
  const responseTimeSec = Math.max(0.1, responseTimeMs / 1000);
  
  GameState.totalAnswers[slot]++;
  GameState.totalResponseTime[slot] += responseTimeMs;
  
  let forceApplied = 0;
  let nextQuestion = null;
  
  if (isCorrect) {
    GameState.correctCounts[slot]++;
    GameState.streaks[slot]++;
    if (GameState.streaks[slot] > GameState.maxStreaks[slot]) {
      GameState.maxStreaks[slot] = GameState.streaks[slot];
    }
    
    const force = MathEngine.calculateForce(responseTimeSec, GameState.difficulty, GameState.streaks[slot]);
    forceApplied = force;
    
    GameState.ropePosition += force;
    GameState.scores[slot] += force;
    
    GameState.ropePosition = Math.max(-120, Math.min(120, GameState.ropePosition));
    
    nextQuestion = generateNewQuestion(slot);
  } else {
    GameState.streaks[slot] = 0;
  }
  
  // Send result back to guest
  PeerManager.send({
    type: 'GAME_STATE',
    isCorrect,
    forceApplied,
    responseTimeMs,
    correctAnswer: question.answer,
    ropePosition: GameState.ropePosition,
    scores: GameState.scores,
    streaks: GameState.streaks,
    nextQuestion: nextQuestion ? {
      questionId: nextQuestion.questionId,
      prompt: nextQuestion.prompt,
      options: nextQuestion.options,
    } : null,
    winnerId: checkWinner(),
  });
  
  const winnerId = checkWinner();
  if (winnerId) {
    endMatch(winnerId);
  }
}
