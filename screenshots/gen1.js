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
  console.log('✓ 01-main-menu.png saved');
  
  // === SCREENSHOT 2: Create Room Modal ===
  await page.click('#btn-create-room');
  await delay(500);
  await page.screenshot({ path: path.join(__dirname, '02-create-room-modal.png'), fullPage: false });
  console.log('✓ 02-create-room-modal.png saved');
  
  // Create room
  await page.type('#player-name', 'TestPlayer');
  await page.click('#btn-confirm-create');
  await delay(1000);
  
  // === SCREENSHOT 3: Waiting Room ===
  await page.screenshot({ path: path.join(__dirname, '03-waiting-room.png'), fullPage: false });
  console.log('✓ 03-waiting-room.png saved');
  
  // Get room code
  const roomCode = await page.$eval('#room-code-display', el => el.textContent);
  console.log('  Room code:', roomCode);
  
  // Open second tab for player 2
  const page2 = await browser.newPage();
  await page2.goto('http://localhost:3000');
  await delay(1000);
  
  // Join with second player
  await page2.click('#btn-join-room');
  await delay(500);
  await page2.type('#join-player-name', 'Player2');
  await page2.type('#room-code', roomCode);
  await page2.click('#btn-confirm-join');
  await delay(500);
  
  // Close second tab to avoid focus issues
  await page2.close();
  
  // === SCREENSHOT 4: Opponent joined ===
  await page.screenshot({ path: path.join(__dirname, '04-opponent-joined.png'), fullPage: false });
  console.log('✓ 04-opponent-joined.png saved');
  
  await browser.close();
  console.log('\n✅ Part 1 screenshots generated!');
})();
