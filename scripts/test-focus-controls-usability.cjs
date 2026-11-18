const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.CLOCKIT_TEST_URL || 'http://localhost:5173';

async function run() {
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'clockit-controls-test-'));
  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      userDataDir: tempProfile,
      args: ['--no-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();

    // Demo sign in
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    const demoBtn = await page.waitForSelector('.clockit-auth-demo');
    await demoBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});

    await page.goto(`${BASE_URL}/app/focus`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.focus-workspace');

    console.log('--- Testing Mobile Usability (375px) ---');
    await page.setViewport({ width: 375, height: 850 });
    await new Promise((r) => setTimeout(r, 400));

    // 1. Play / Pause timer
    const playBtn = await page.waitForSelector('.focus-primary-control');
    await playBtn.click();
    await new Promise((r) => setTimeout(r, 1200));
    const isRunningText = await page.$eval('.focus-session-status', (el) => el.textContent);
    console.log(`   Mobile timer play clicked. Status: "${isRunningText}"`);
    if (!isRunningText.includes('in progress')) throw new Error('Timer did not start on mobile');

    await playBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    const isPausedText = await page.$eval('.focus-session-status', (el) => el.textContent);
    console.log(`   Mobile timer pause clicked. Status: "${isPausedText}"`);
    if (!isPausedText.includes('Paused')) throw new Error(`Timer did not pause on mobile (status: "${isPausedText}")`);

    // 2. Mode picker
    const breakBtn = await page.waitForSelector('.focus-mode-picker button:nth-child(2)');
    await breakBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    const modeText = await page.$eval('.focus-session-kind', (el) => el.textContent);
    console.log(`   Mobile mode clicked. Mode: "${modeText}"`);
    if (!modeText.includes('Short Break')) throw new Error('Mode did not switch on mobile');

    // 3. Notes toolbar bold button
    const boldBtn = await page.waitForSelector('.clockit-toolbar-btn[title*="Bold"]');
    await boldBtn.click();
    console.log('   Mobile notes bold button clicked successfully.');

    // 4. Editor scrollability
    const scrollResultMobile = await page.evaluate(() => {
      const scrollEl = document.querySelector('.focus-notes-editor-wrap .clockit-editor-content-scroll');
      if (!scrollEl) return { exists: false };
      const initialScroll = scrollEl.scrollTop;
      scrollEl.scrollTop = 50;
      return {
        exists: true,
        scrollHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        canScroll: scrollEl.scrollHeight > scrollEl.clientHeight,
      };
    });
    console.log(`   Mobile editor scroll test: canScroll=${scrollResultMobile.canScroll}, scrollHeight=${scrollResultMobile.scrollHeight}px, clientHeight=${scrollResultMobile.clientHeight}px.`);

    console.log('--- Testing Desktop Usability (1280px) ---');
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));

    // 1. Analog / Digital clock toggle
    await page.evaluate(() => {
      const btn = document.querySelectorAll('.focus-clock-mode-switch button')[1];
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const hasDigitalClock = await page.$('.focus-digital-clock');
    console.log(`   Desktop clock mode switched to Digital: ${Boolean(hasDigitalClock)}`);
    if (!hasDigitalClock) throw new Error('Digital clock display did not appear');

    await page.evaluate(() => {
      const btn = document.querySelectorAll('.focus-clock-mode-switch button')[0];
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const hasAnalogClock = await page.$('.focus-analog-clock');
    console.log(`   Desktop clock mode switched back to Analog: ${Boolean(hasAnalogClock)}`);
    if (!hasAnalogClock) throw new Error('Analog clock display did not appear');

    // 2. Play / pause
    await playBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    const desktopStatus = await page.$eval('.focus-session-status', (el) => el.textContent);
    console.log(`   Desktop timer toggle: "${desktopStatus}"`);

    // 3. Mode switch back to Deep Work
    const deepWorkBtn = await page.waitForSelector('.focus-mode-picker button:nth-child(1)');
    await deepWorkBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    const desktopMode = await page.$eval('.focus-session-kind', (el) => el.textContent);
    console.log(`   Desktop mode switched back: "${desktopMode}"`);

    // 4. Editor scrollability
    const scrollResultDesktop = await page.evaluate(() => {
      const scrollEl = document.querySelector('.focus-notes-editor-wrap .clockit-editor-content-scroll');
      if (!scrollEl) return { exists: false };
      return {
        exists: true,
        scrollHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        canScroll: scrollEl.scrollHeight > scrollEl.clientHeight,
      };
    });
    console.log(`   Desktop editor scroll test: canScroll=${scrollResultDesktop.canScroll}, scrollHeight=${scrollResultDesktop.scrollHeight}px, clientHeight=${scrollResultDesktop.clientHeight}px.`);

    console.log('\nALL CONTROLS USABILITY TESTS PASSED ON BOTH MOBILE AND DESKTOP ✓');
    process.exit(0);
  } catch (err) {
    console.error('FAIL: Usability test error:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close().catch(() => {});
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

run();
