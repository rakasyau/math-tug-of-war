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
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('https://mtow.rakasyau.my.id', { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(2000);
  
  console.log('Title:', await page.title());
  console.log('Errors:', errors.length);
  
  // Test toggle buttons
  console.log('\n=== Testing Toggle Buttons ===');
  
  // Open create room modal
  await page.evaluate(() => document.getElementById('btn-create-room').click());
  await delay(500);
  
  // Check initial values
  const initialMode = await page.$eval('#inputMode', el => el.value);
  const initialThreshold = await page.$eval('#winThreshold', el => el.value);
  console.log('Initial inputMode:', initialMode);
  console.log('Initial winThreshold:', initialThreshold);
  
  // Click numpad toggle
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#inputModeGroup .toggle-btn');
    btns.forEach(btn => {
      if (btn.dataset.value === 'numpad') btn.click();
    });
  });
  await delay(300);
  
  const afterNumpad = await page.$eval('#inputMode', el => el.value);
  console.log('After clicking numpad:', afterNumpad);
  
  // Click 150 threshold
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#thresholdGroup .toggle-btn');
    btns.forEach(btn => {
      if (btn.dataset.value === '150') btn.click();
    });
  });
  await delay(300);
  
  const after150 = await page.$eval('#winThreshold', el => el.value);
  console.log('After clicking 150:', after150);
  
  // Take screenshot
  await page.screenshot({ path: path.join(__dirname, 'toggle-test.png'), fullPage: false });
  
  await browser.close();
  console.log('\n✅ Toggle test complete');
})();
