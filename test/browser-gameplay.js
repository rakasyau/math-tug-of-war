const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required']
  });
  
  console.log('=== FULL GAMEPLAY TEST ===\n');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYER 1 (Andi)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const p1 = await browser.newPage();
  p1.on('console', msg => {
    const type = msg.type();
    if (type === 'error') console.log('P1 ERROR:', msg.text());
  });
  p1.on('pageerror', err => console.log('P1 PAGE ERROR:', err.message));
  
  await p1.goto('http://localhost:3000');
  await delay(1500);
  console.log('P1: Opened main menu');
  
  // Click Create Room
  await p1.evaluate(() => document.getElementById('btn-create-room').click());
  await delay(500);
  await p1.type('#player-name', 'Andi');
  await p1.evaluate(() => document.getElementById('btn-confirm-create').click());
  await delay(1000);
  console.log('P1: Created room');
  
  // Get room code
  const roomCode = await p1.$eval('#room-code-display', el => el.textContent);
  console.log(`P1: Room code is ${roomCode}`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYER 2 (Budi)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const p2 = await browser.newPage();
  p2.on('console', msg => {
    const type = msg.type();
    if (type === 'error') console.log('P2 ERROR:', msg.text());
  });
  p2.on('pageerror', err => console.log('P2 PAGE ERROR:', err.message));
  
  await p2.goto('http://localhost:3000');
  await delay(1500);
  console.log('P2: Opened main menu');
  
  await p2.evaluate(() => document.getElementById('btn-join-room').click());
  await delay(500);
  await p2.type('#join-player-name', 'Budi');
  await p2.type('#room-code', roomCode);
  await p2.evaluate(() => document.getElementById('btn-confirm-join').click());
  await delay(1000);
  console.log('P2: Joined room');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Both Players Ready
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('P1: Clicking READY...');
  await p1.evaluate(() => {
    const btn = document.getElementById('btn-ready');
    if (btn) btn.click();
    else console.log('P1: btn-ready not found!');
  });
  await delay(500);
  
  console.log('P2: Clicking READY...');
  await p2.evaluate(() => {
    const btn = document.getElementById('btn-ready');
    if (btn) btn.click();
    else console.log('P2: btn-ready not found!');
  });
  await delay(3000); // Wait for auto-start
  
  // Check if game started
  const p1InGame = await p1.evaluate(() => document.getElementById('game-screen').classList.contains('active'));
  const p2InGame = await p2.evaluate(() => document.getElementById('game-screen').classList.contains('active'));
  console.log(`P1 in game: ${p1InGame}`);
  console.log(`P2 in game: ${p2InGame}`);
  
  if (!p1InGame || !p2InGame) {
    console.log('Game did not start. Taking debug screenshots...');
    await p1.screenshot({ path: path.join(__dirname, 'debug-p1.png') });
    await p2.screenshot({ path: path.join(__dirname, 'debug-p2.png') });
    await browser.close();
    process.exit(1);
  }
  
  console.log('\n--- GAME STARTED ---');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GAMEPLAY
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Andi answers 3 questions
  for (let i = 1; i <= 3; i++) {
    await delay(1000);
    
    const qPrompt = await p1.$eval('#question-prompt', el => el.textContent);
    console.log(`\nP1 Q${i}: ${qPrompt}`);
    
    // Calculate answer
    let correctAnswer = null;
    try {
      const prompt = qPrompt.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/−/g, '-');
      if (prompt.includes('/')) {
        const parts = prompt.split('/').map(p => p.trim());
        const numerator = eval(parts[0].replace(/×/g, '*'));
        correctAnswer = Math.round(numerator / parseInt(parts[1]));
      } else {
        correctAnswer = Math.round(eval(prompt));
      }
    } catch (e) {
      correctAnswer = 0;
    }
    
    // Click correct answer
    const clicked = await p1.evaluate((answer) => {
      const btns = document.querySelectorAll('.answer-btn');
      for (let btn of btns) {
        if (parseInt(btn.textContent) === answer) {
          btn.click();
          return true;
        }
      }
      return false;
    }, correctAnswer);
    
    if (!clicked) {
      // Click first button as fallback
      await p1.evaluate(() => {
        const btns = document.querySelectorAll('.answer-btn');
        if (btns.length > 0) btns[0].click();
      });
    }
    
    console.log(`P1: Answered ${correctAnswer}`);
    await delay(1500);
  }
  
  // Budi answers 2 questions (1 wrong, 1 correct)
  for (let i = 1; i <= 2; i++) {
    await delay(1000);
    
    const qPrompt = await p2.$eval('#question-prompt', el => el.textContent);
    console.log(`\nP2 Q${i}: ${qPrompt}`);
    
    let correctAnswer = null;
    try {
      const prompt = qPrompt.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/−/g, '-');
      if (prompt.includes('/')) {
        const parts = prompt.split('/').map(p => p.trim());
        const numerator = eval(parts[0].replace(/×/g, '*'));
        correctAnswer = Math.round(numerator / parseInt(parts[1]));
      } else {
        correctAnswer = Math.round(eval(prompt));
      }
    } catch (e) {
      correctAnswer = 0;
    }
    
    if (i === 2) {
      // Answer wrong first
      await p2.evaluate((answer) => {
        const btns = document.querySelectorAll('.answer-btn');
        for (let btn of btns) {
          if (parseInt(btn.textContent) === answer) {
            btn.click();
            return;
          }
        }
      }, correctAnswer + 1);
      console.log(`P2: Intentionally wrong (${correctAnswer + 1})`);
      await delay(1500);
      
      // Answer correctly
      await p2.evaluate((answer) => {
        const btns = document.querySelectorAll('.answer-btn');
        for (let btn of btns) {
          if (parseInt(btn.textContent) === answer) {
            btn.click();
            return;
          }
        }
      }, correctAnswer);
      console.log(`P2: Correct (${correctAnswer})`);
    } else {
      await p2.evaluate((answer) => {
        const btns = document.querySelectorAll('.answer-btn');
        for (let btn of btns) {
          if (parseInt(btn.textContent) === answer) {
            btn.click();
            return;
          }
        }
      }, correctAnswer);
      console.log(`P2: Correct (${correctAnswer})`);
    }
    
    await delay(1500);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Final State
  // ═══════════════════════════════════════════════════════════════════════════
  
  await delay(2000);
  
  const p1Score = await p1.$eval('#p1-score', el => el.textContent).catch(() => 'N/A');
  const p2Score = await p2.$eval('#p2-score', el => el.textContent).catch(() => 'N/A');
  
  console.log('\n=== FINAL STATE ===');
  console.log(`P1 Score: ${p1Score}`);
  console.log(`P2 Score: ${p2Score}`);
  
  await p1.screenshot({ path: path.join(__dirname, 'test-p1-final.png'), fullPage: false });
  await p2.screenshot({ path: path.join(__dirname, 'test-p2-final.png'), fullPage: false });
  
  await browser.close();
  console.log('\n✅ GAMEPLAY TEST COMPLETE');
})();
