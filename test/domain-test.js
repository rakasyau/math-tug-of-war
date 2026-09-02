const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  console.log('=== TEST mtow.rakasyau.my.id ===\n');
  
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('https://mtow.rakasyau.my.id', { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(2000);
  
  const title = await page.title();
  const h1 = await page.$eval('h1', el => el.textContent).catch(() => 'N/A');
  const menuActive = await page.evaluate(() => document.getElementById('main-menu').classList.contains('active'));
  
  console.log('Title:', title);
  console.log('H1:', h1);
  console.log('Menu active:', menuActive);
  console.log('Errors:', errors.length);
  errors.forEach(e => console.log('  -', e));
  
  // Screenshot
  await page.screenshot({ path: path.join(__dirname, 'domain-test.png'), fullPage: false });
  console.log('\n✅ Domain test complete');
  
  await browser.close();
})();
