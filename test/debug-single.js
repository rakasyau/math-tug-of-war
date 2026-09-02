const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-web-security'
    ]
  });
  
  const page = await browser.newPage();
  
  // Check for errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  page.on('requestfailed', req => {
    console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText);
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await delay(2000);
  
  console.log('Page loaded. Errors:', errors.length);
  errors.forEach(e => console.log('  -', e));
  
  // Check if PeerJS loaded
  const peerjsLoaded = await page.evaluate(() => typeof Peer !== 'undefined');
  console.log('PeerJS loaded:', peerjsLoaded);
  
  // Check if SoundEngine loaded
  const soundLoaded = await page.evaluate(() => typeof SoundEngine !== 'undefined');
  console.log('SoundEngine loaded:', soundLoaded);
  
  // Check if PeerManager loaded
  const peerMgrLoaded = await page.evaluate(() => typeof PeerManager !== 'undefined');
  console.log('PeerManager loaded:', peerMgrLoaded);
  
  // Try to create a room
  console.log('\nTrying to create room...');
  await page.evaluate(() => document.getElementById('btn-create-room').click());
  await delay(500);
  await page.type('#player-name', 'TestHost');
  await page.evaluate(() => document.getElementById('btn-confirm-create').click());
  await delay(3000);
  
  const roomCode = await page.$eval('#room-code-display', el => el.textContent).catch(() => 'N/A');
  console.log('Room code:', roomCode);
  
  // Check connection status
  const connStatus = await page.evaluate(() => {
    const el = document.getElementById('connection-status');
    return el ? el.className : 'not found';
  });
  console.log('Connection status:', connStatus);
  
  await page.screenshot({ path: path.join(__dirname, 'debug-single.png'), fullPage: false });
  
  await browser.close();
  console.log('\nDone');
})();
