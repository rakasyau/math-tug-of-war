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
  
  // === SCREENSHOT 1: Main Menu with Sound Toggle ===
  await page.goto('http://localhost:3000');
  await delay(1500);
  await page.screenshot({ path: path.join(__dirname, '01-main-menu-new.png'), fullPage: false });
  console.log('OK 01-main-menu-new.png');
  
  // === SCREENSHOT 2: Create Room Modal ===
  await page.click('#btn-create-room');
  await delay(500);
  await page.screenshot({ path: path.join(__dirname, '02-create-room-new.png'), fullPage: false });
  console.log('OK 02-create-room-new.png');
  
  // Create room
  await page.type('#player-name', 'TestPlayer');
  await page.click('#btn-confirm-create');
  await delay(1000);
  
  // === SCREENSHOT 3: Waiting Room ===
  await page.screenshot({ path: path.join(__dirname, '03-waiting-new.png'), fullPage: false });
  console.log('OK 03-waiting-new.png');
  
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
  await page.screenshot({ path: path.join(__dirname, '04-game-new.png'), fullPage: false });
  console.log('OK 04-game-new.png');
  
  // Simulate correct answer
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.answer-btn');
    btns[0].classList.add('correct');
  });
  await delay(300);
  
  // === SCREENSHOT 5: Correct Answer Feedback ===
  await page.screenshot({ path: path.join(__dirname, '05-correct-new.png'), fullPage: false });
  console.log('OK 05-correct-new.png');
  
  // Simulate wrong answer
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.answer-btn');
    btns[0].classList.remove('correct');
    btns[1].classList.add('incorrect');
    document.getElementById('stun-overlay').classList.add('active');
  });
  await delay(300);
  
  // === SCREENSHOT 6: Wrong Answer / Stun ===
  await page.screenshot({ path: path.join(__dirname, '06-wrong-new.png'), fullPage: false });
  console.log('OK 06-wrong-new.png');
  
  // Simulate match over
  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('match-over').classList.add('active');
    document.getElementById('result-title').textContent = 'MENANG!';
    document.getElementById('result-subtitle').textContent = 'Selamat! Kamu memenangkan pertandingan!';
    document.getElementById('final-rope-pos').textContent = '-102.3';
    document.getElementById('final-duration').textContent = '84s';
    document.getElementById('confetti-container').style.display = 'block';
  });
  await delay(500);
  
  // === SCREENSHOT 7: Match Over ===
  await page.screenshot({ path: path.join(__dirname, '07-match-over-new.png'), fullPage: false });
  console.log('OK 07-match-over-new.png');
  
  // === SCREENSHOT 8: Mobile View ===
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('main-menu').classList.add('active');
    document.getElementById('confetti-container').style.display = 'none';
  });
  await delay(500);
  await page.screenshot({ path: path.join(__dirname, '08-mobile.png'), fullPage: false });
  console.log('OK 08-mobile.png');
  
  // === SCREENSHOT 9: Mobile Game ===
  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-room-code').textContent = '782910';
    document.getElementById('p1-name-game').textContent = 'Andi';
    document.getElementById('p2-name-game').textContent = 'Budi';
    document.getElementById('question-prompt').textContent = '12 + 8';
    document.querySelector('.force-value').textContent = '15.9';
    const options = [19, 20, 21, 22];
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
  await page.screenshot({ path: path.join(__dirname, '09-mobile-game.png'), fullPage: false });
  console.log('OK 09-mobile-game.png');
  
  await browser.close();
  console.log('\n✅ All screenshots generated!');
})();
