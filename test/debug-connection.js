const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => {
    console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText);
  });
  
  console.log('Loading mtow.rakasyau.my.id...');
  await page.goto('https://mtow.rakasyau.my.id', { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(3000);
  
  // Check status
  const status = await page.evaluate(() => {
    const el = document.getElementById('connection-status');
    return el ? { class: el.className, text: el.querySelector('.status-text')?.textContent } : 'not found';
  });
  console.log('Connection status:', status);
  
  // Click create room
  console.log('\nClicking create room...');
  await page.evaluate(() => document.getElementById('btn-create-room').click());
  await delay(1000);
  
  await page.screenshot({ path: path.join(__dirname, 'debug-create-1.png') });
  
  // Fill name
  await page.type('#player-name', 'TestHost');
  await delay(500);
  
  // Click confirm
  console.log('Clicking confirm create...');
  await page.evaluate(() => document.getElementById('btn-confirm-create').click());
  await delay(5000);
  
  // Check status again
  const status2 = await page.evaluate(() => {
    const el = document.getElementById('connection-status');
    return el ? { class: el.className, text: el.querySelector('.status-text')?.textContent } : 'not found';
  });
  console.log('Status after create:', status2);
  
  // Check room code
  const roomCode = await page.$eval('#room-code-display', el => el.textContent).catch(() => 'not found');
  console.log('Room code:', roomCode);
  
  // Check if PeerJS loaded
  const peerjsLoaded = await page.evaluate(() => typeof Peer !== 'undefined');
  console.log('PeerJS loaded:', peerjsLoaded);
  
  await page.screenshot({ path: path.join(__dirname, 'debug-create-2.png'), fullPage: false });
  
  await delay(5000);
  await browser.close();
})();
