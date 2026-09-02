const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  // Create two pages for two players
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();
  
  // Player 1 creates room
  await page1.goto('http://localhost:3000');
  await delay(800);
  await page1.click('#btn-create-room');
  await delay(400);
  await page1.type('#player-name', 'Andi');
  await page1.click('#btn-confirm-create');
  await delay(800);
  
  const roomCode = await page1.$eval('#room-code-display', el => el.textContent);
  
  // Player 2 joins
  await page2.goto('http://localhost:3000');
  await delay(800);
  await page2.click('#btn-join-room');
  await delay(400);
  await page2.type('#join-player-name', 'Budi');
  await page2.type('#room-code', roomCode);
  await page2.click('#btn-confirm-join');
  await delay(500);
  
  // Both ready
  await page1.click('#btn-ready');
  await delay(300);
  await page2.click('#btn-ready');
  await delay(2000);
  
  // === SCREENSHOT: Game Screens ===
  await page1.screenshot({ path: path.join(__dirname, '05-game-andi.png'), fullPage: false });
  await page2.screenshot({ path: path.join(__dirname, '06-game-budi.png'), fullPage: false });
  console.log('✓ Game screens saved');
  
  await delay(1500);
  
  // Andi answers
  const andiBtn = await page1.$('.answer-btn');
  if (andiBtn) await andiBtn.click();
  await delay(800);
  await page1.screenshot({ path: path.join(__dirname, '07-andi-answered.png'), fullPage: false });
  
  await delay(1500);
  
  // Budi answers
  const budiBtn = await page2.$('.answer-btn');
  if (budiBtn) await budiBtn.click();
  await delay(800);
  await page2.screenshot({ path: path.join(__dirname, '08-budi-answered.png'), fullPage: false });
  console.log('✓ Gameplay screenshots saved');
  
  await browser.close();
  console.log('\n✅ All game screenshots generated!');
})();
