const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'tmp', 'screenshots', 'casestudies');

const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

const EXPECTED_STORIES = [
  'Distraction-Free Focus Workspace',
  'Unified Productivity Dashboard',
  'Interconnected Notes Experience',
  'Personal Habit Tracking',
  'Cross-Device Usability & Owner Isolation',
];

async function run() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`FATAL: Chrome not found at ${CHROME_PATH}`);
    process.exit(1);
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log(`[verify-casestudies] Launching Chrome at ${CHROME_PATH}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  let errors = 0;

  try {
    console.log(`[verify-casestudies] Navigating to ${APP_URL}/case-studies...`);
    await page.goto(`${APP_URL}/case-studies`, { waitUntil: 'networkidle2', timeout: 20000 });

    // 1. Verify page title / hero
    const heroH1 = await page.$eval('h1', el => el.textContent.trim());
    console.log(`[verify-casestudies] Detected h1: "${heroH1}"`);
    if (heroH1 !== 'Case Studies') {
      console.error(`FAIL: Expected h1 "Case Studies", got "${heroH1}"`);
      errors++;
    } else {
      console.log(`✓ Main heading matches "Case Studies".`);
    }

    // 2. Verify all 5 story headings
    const storyHeadings = await page.$$eval('.case-study-header h2', els => els.map(el => el.textContent.trim()));
    console.log(`[verify-casestudies] Found story headings:`, storyHeadings);

    for (const exp of EXPECTED_STORIES) {
      if (storyHeadings.includes(exp)) {
        console.log(`✓ Story verified: "${exp}"`);
      } else {
        console.error(`FAIL: Missing expected story: "${exp}"`);
        errors++;
      }
    }

    if (storyHeadings.length !== 5) {
      console.error(`FAIL: Expected 5 stories, found ${storyHeadings.length}`);
      errors++;
    }

    // 3. Verify back navigation to ClockIt
    const backLink = await page.$eval('.case-studies-back-link', el => ({
      href: el.getAttribute('href'),
      text: el.textContent.trim(),
    }));
    console.log(`[verify-casestudies] Detected back link: href="${backLink.href}", text="${backLink.text}"`);
    if (backLink.href !== '/') {
      console.error(`FAIL: Expected back link href "/", got "${backLink.href}"`);
      errors++;
    } else {
      console.log(`✓ Back link points to root "/".`);
    }

    // 4. Test Viewports for horizontal overflow
    console.log('\n--- Auditing Viewports for Overflow & Visuals ---');
    for (const vp of VIEWPORTS) {
      await page.setViewport(vp);
      await new Promise(r => setTimeout(r, 400));

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const maxScroll = Math.max(docWidth, bodyWidth);
        return {
          winWidth,
          maxScroll,
          overflow: maxScroll > winWidth,
        };
      });

      const shotPath = path.join(SCREENSHOT_DIR, `casestudies-${vp.width}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      if (overflow.overflow) {
        console.error(`❌ @ ${vp.width}px: OVERFLOW DETECTED! maxScroll=${overflow.maxScroll}px > viewport=${overflow.winWidth}px`);
        errors++;
      } else {
        console.log(`✓ @ ${vp.width}px: Clean layout (scrollWidth=${overflow.maxScroll}px). Screenshot: ${shotPath}`);
      }
    }

  } catch (err) {
    console.error('Fatal execution error:', err);
    errors++;
  } finally {
    await browser.close();
  }

  if (errors > 0) {
    console.error(`\n[verify-casestudies] Completed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`\n[verify-casestudies] SUCCESS: All checks passed with zero overflow! ✓`);
    process.exit(0);
  }
}

run();
