const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  const page = await browser.newPage();
  
  // === SCREENSHOT 1: Main Menu ===
  await page.goto('http://localhost:3000');
  await delay(1000);
  await page.screenshot({ path: path.join(__dirname, '01-main-menu.png'), fullPage: false });
  console.log('OK 01-main-menu.png');
  
  // === SCREENSHOT 2: Create Room Modal ===
  await page.click('#btn-create-room');
  await delay(500);
  await page.screenshot({ path: path.join(__dirname, '02-create-room-modal.png'), fullPage: false });
  console.log('OK 02-create-room-modal.png');
  
  // Create room
  await page.type('#player-name', 'TestPlayer');
  await page.click('#btn-confirm-create');
  await delay(1000);
  
  // === SCREENSHOT 3: Waiting Room ===
  await page.screenshot({ path: path.join(__dirname, '03-waiting-room.png'), fullPage: false });
  console.log('OK 03-waiting-room.png');
  
  // Simulate game screen
  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-room-code').textContent = '782910';
    document.getElementById('p1-name-game').textContent = 'TestPlayer';
    document.getElementById('p2-name-game').textContent = 'Opponent';
    document.getElementById('question-prompt').textContent = '7 x 8 - 14';
    document.querySelector('.force-value').textContent = '11.4';
    const options = [42, 48, 52, 40];
    const container = document.getElementById('answer-options');
    container.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      btn.textContent = opt;
      container.appendChild(btn);
    });
  });
  await delay(500);
  
  // === SCREENSHOT 4: Game Screen ===
  await page.screenshot({ path: path.join(__dirname, '04-game-screen.png'), fullPage: false });
  console.log('OK 04-game-screen.png');
  
  // Simulate correct answer
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.answer-btn');
    btns[0].classList.add('correct');
  });
  await delay(500);
  
  // === SCREENSHOT 5: After correct answer ===
  await page.screenshot({ path: path.join(__dirname, '05-correct-answer.png'), fullPage: false });
  console.log('OK 05-correct-answer.png');
  
  // Simulate wrong answer
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.answer-btn');
    btns[0].classList.remove('correct');
    btns[1].classList.add('incorrect');
  });
  await delay(500);
  
  // === SCREENSHOT 6: After wrong answer ===
  await page.screenshot({ path: path.join(__dirname, '06-wrong-answer.png'), fullPage: false });
  console.log('OK 06-wrong-answer.png');
  
  // Simulate match over
  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('match-over').classList.add('active');
    document.getElementById('result-title').textContent = 'MENANG!';
    document.getElementById('result-subtitle').textContent = 'Selamat! Kamu memenangkan pertandingan!';
    document.getElementById('final-rope-pos').textContent = '-102.3';
    document.getElementById('final-duration').textContent = '84s';
  });
  await delay(500);
  
  // === SCREENSHOT 7: Match Over ===
  await page.screenshot({ path: path.join(__dirname, '07-match-over.png'), fullPage: false });
  console.log('OK 07-match-over.png');
  
  await browser.close();
  console.log('DONE');
})();
