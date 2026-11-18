const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'tmp', 'screenshots', 'homepage');

const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

async function run() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`FATAL: Chrome not found at ${CHROME_PATH}`);
    process.exit(1);
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log(`[verify-homepage] Launching Chrome at ${CHROME_PATH}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  let errors = 0;

  try {
    console.log(`[verify-homepage] Navigating to ${APP_URL}/...`);
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle2', timeout: 20000 });

    // 1. Verify headline
    const headline = await page.$eval('h1', el => el.textContent.trim());
    console.log(`[verify-homepage] Detected headline: "${headline}"`);
    const expectedHeadline = 'Make room for what matters.';
    if (headline !== expectedHeadline) {
      console.error(`FAIL: Expected headline "${expectedHeadline}", got "${headline}"`);
      errors++;
    } else {
      console.log(`✓ Headline matches: "${headline}"`);
    }

    // 2. Verify supporting description
    const desc = await page.$eval('.public-hero-description', el => el.textContent.trim());
    console.log(`[verify-homepage] Detected hero description: "${desc.substring(0, 50)}..."`);
    const expectedDesc = 'Your day, your ideas, your routines — all in one place. ClockIt brings focus, planning and personal organization into a workspace that moves at your pace.';
    if (desc !== expectedDesc) {
      console.error(`FAIL: Hero description mismatch!`);
      errors++;
    } else {
      console.log(`✓ Hero description matches expected brand copy.`);
    }

    // 3. Verify /case-studies link
    const caseStudiesLinks = await page.$$eval('a[href="/case-studies"]', links => links.length);
    console.log(`[verify-homepage] Found ${caseStudiesLinks} link(s) to "/case-studies"`);
    if (caseStudiesLinks === 0) {
      console.error(`FAIL: No link pointing to "/case-studies" found in DOM!`);
      errors++;
    } else {
      console.log(`✓ Link to /case-studies present in DOM.`);
    }

    // 4. Verify 10 sections exist
    const sectionsCount = await page.$$eval('main > section', secs => secs.length);
    console.log(`[verify-homepage] Detected ${sectionsCount} sections inside <main>`);
    if (sectionsCount !== 10) {
      console.error(`FAIL: Expected 10 sections inside <main>, got ${sectionsCount}`);
      errors++;
    } else {
      console.log(`✓ Exactly 10 sections verified in specified hierarchy.`);
    }

    // 5. Audit viewports for horizontal overflow
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

      const shotPath = path.join(SCREENSHOT_DIR, `home-${vp.width}.png`);
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
    console.error(`\n[verify-homepage] Completed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`\n[verify-homepage] SUCCESS: All checks passed with zero overflow! ✓`);
    process.exit(0);
  }
}

run();
