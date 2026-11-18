const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';
const SHOT_DIR = path.resolve(__dirname, '..', 'tmp', 'screenshots', 'restored_home');

async function run() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`FATAL: Chrome not found at ${CHROME_PATH}`);
    process.exit(1);
  }

  fs.mkdirSync(SHOT_DIR, { recursive: true });

  console.log(`[verify-restored-home] Launching Chrome...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  let errors = 0;

  try {
    await page.setViewport({ width: 1440, height: 900 });
    console.log(`[verify-restored-home] Navigating to ${APP_URL}/...`);
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle2', timeout: 20000 });

    // 1. Verify hero headline exists
    const headline = await page.$eval('.hero-headline', el => el.textContent.replace(/\s+/g, ' ').trim());
    console.log(`[verify-restored-home] Detected headline: "${headline}"`);
    if (!headline.includes('Make room for what matters.')) {
      console.error(`FAIL: Expected scrolling headline with ClockIt copy, got: "${headline}"`);
      errors++;
    } else {
      console.log(`✓ Restored ClockIt hero headline verified.`);
    }

    // 2. Verify Case Studies button replaced Try interactive demo
    const caseStudiesBtn = await page.$('#hero-case-studies-btn');
    if (!caseStudiesBtn) {
      console.error(`FAIL: #hero-case-studies-btn not found!`);
      errors++;
    } else {
      const btnText = await page.evaluate(el => el.textContent.trim(), caseStudiesBtn);
      const btnHref = await page.evaluate(el => el.getAttribute('href'), caseStudiesBtn);
      console.log(`[verify-restored-home] Button text: "${btnText}", href: "${btnHref}"`);
      if (btnText !== 'Case Studies' || btnHref !== '/case-studies') {
        console.error(`FAIL: Expected text 'Case Studies' & href '/case-studies', got text '${btnText}' & href '${btnHref}'`);
        errors++;
      } else {
        console.log(`✓ Button text and href verified.`);
      }
    }

    // 3. Verify floating preview dashboard cards exist
    const cards = await page.$$eval('.floating-artifact', els => els.length);
    console.log(`[verify-restored-home] Detected ${cards} hero preview cards.`);
    if (cards < 4) {
      console.error(`FAIL: Expected at least 4 hero cards in dashboard composition, found ${cards}`);
      errors++;
    } else {
      console.log(`✓ Dashboard composition cards verified.`);
    }

    // 4. Capture screenshot of hero
    const desktopShot = path.join(SHOT_DIR, 'restored-home-desktop.png');
    await page.screenshot({ path: desktopShot });
    console.log(`✓ Screenshot captured: ${desktopShot}`);

    // 5. Test clicking the Case Studies button navigates to /case-studies
    console.log(`[verify-restored-home] Testing Case Studies button navigation...`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#hero-case-studies-btn'),
    ]);

    const currentUrl = page.url();
    console.log(`[verify-restored-home] Landed URL: ${currentUrl}`);
    if (!currentUrl.endsWith('/case-studies')) {
      console.error(`FAIL: Navigation did not land on /case-studies! Current URL: ${currentUrl}`);
      errors++;
    } else {
      console.log(`✓ Successfully navigated to /case-studies upon click!`);
    }

  } catch (err) {
    console.error(`Fatal test error:`, err);
    errors++;
  } finally {
    await browser.close();
  }

  if (errors > 0) {
    console.error(`\n[verify-restored-home] Completed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`\n[verify-restored-home] SUCCESS: Restored home page verified! ✓`);
    process.exit(0);
  }
}

run();
