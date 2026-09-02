const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  console.log('=== SCREENSHOT TEST ===\n');
  
  // Test 1: Desktop 1280x800
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1280, height: 800 });
  await page1.goto('https://mtow.rakasyau.my.id', { waitUntil: 'networkidle0' });
  await delay(2000);
  await page1.screenshot({ path: path.join(__dirname, 'desktop-1280.png'), fullPage: false });
  console.log('Desktop 1280x800 captured');
  
  // Test 2: Tablet 768x1024
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 768, height: 1024 });
  await page2.goto('https://mtow.rakasyau.my.id', { waitUntil: 'networkidle0' });
  await delay(2000);
  await page2.screenshot({ path: path.join(__dirname, 'tablet-768.png'), fullPage: false });
  console.log('Tablet 768x1024 captured');
  
  // Test 3: Mobile 390x844
  const page3 = await browser.newPage();
  await page3.setViewport({ width: 390, height: 844 });
  await page3.goto('https://mtow.rakasyau.my.id', { waitUntil: 'networkidle0' });
  await delay(2000);
  await page3.screenshot({ path: path.join(__dirname, 'mobile-390.png'), fullPage: false });
  console.log('Mobile 390x844 captured');
  
  // Test 4: Create room on desktop
  const page4 = await browser.newPage();
  await page4.setViewport({ width: 1280, height: 800 });
  await page4.goto('https://mtow.rakasyau.my.id', { waitUntil: 'networkidle0' });
  await delay(2000);
  await page4.evaluate(() => document.getElementById('btn-create-room').click());
  await delay(1000);
  await page4.screenshot({ path: path.join(__dirname, 'desktop-create.png'), fullPage: false });
  console.log('Desktop create room captured');
  
  // Test 5: Join room on tablet
  const page5 = await browser.newPage();
  await page5.setViewport({ width: 768, height: 1024 });
  await page5.goto('https://mtow.rakasyau.my.id', { waitUntil: 'networkidle0' });
  await delay(2000);
  await page5.evaluate(() => document.getElementById('btn-join-room').click());
  await delay(1000);
  await page5.screenshot({ path: path.join(__dirname, 'tablet-join.png'), fullPage: false });
  console.log('Tablet join room captured');
  
  await browser.close();
  console.log('\n✅ All screenshots captured');
})();
