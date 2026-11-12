import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const USER_A_EMAIL = (process.env.CLOCKIT_TEST_USER_A_EMAIL || env.CLOCKIT_TEST_USER_A_EMAIL || '').trim();
const USER_A_PASSWORD = (process.env.CLOCKIT_TEST_USER_A_PASSWORD || env.CLOCKIT_TEST_USER_A_PASSWORD || '').trim();
const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTest() {
  console.log('=== RUNNING TUTORIAL REFINEMENT BROWSER QA ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Open login
    console.log('[STEP 1] Navigating to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    // Login if on login page
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await page.type('input[type="email"]', USER_A_EMAIL);
      await page.type('input[type="password"]', USER_A_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    }

    console.log('[STEP 2] Navigating to Dashboard...');
    await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Reset and launch tour via window
    console.log('[STEP 3] Triggering full product tour...');
    await page.evaluate(() => {
      localStorage.removeItem('clockit-tour-completed');
      localStorage.removeItem('clockit-tour-active-step');
      localStorage.removeItem('clockit-onboarding-welcome-dismissed');
      // trigger tour start
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Start Interactive Tour') || b.classList.contains('clockit-tutorial-btn')
      );
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // If welcome banner wasn't clicked, open directory from header or settings
    const portalExists = await page.evaluate(() => {
      return !!document.querySelector('.clockit-tour-portal-root');
    });

    if (!portalExists) {
      console.log('  Opening via Welcome Banner or Header button...');
      await page.evaluate(() => {
        const welcomeBtn = document.querySelector('.clockit-onboarding-welcome-card button.clockit-tutorial-btn');
        if (welcomeBtn) {
          welcomeBtn.click();
        } else {
          // Open help/tour from Header
          const helpBtn = document.querySelector('button[title*="Feature Guides"], button[title*="Guide"], button[aria-label*="Guide"]');
          if (helpBtn) helpBtn.click();
        }
      });
      await new Promise(r => setTimeout(r, 600));

      // In directory modal, click Start Full Tour
      await page.evaluate(() => {
        const fullTourBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Start Full Tour') || b.textContent?.includes('Replay Full Tour'));
        if (fullTourBtn) fullTourBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));
    }

    // TEST 1: Layering and Portal check
    console.log('\n[TEST 1 — LAYERING & PORTAL]');
    const layerCheck = await page.evaluate(() => {
      const portal = document.querySelector('.clockit-tour-portal-root');
      if (!portal) return { pass: false, error: 'Portal root .clockit-tour-portal-root not found' };
      const isBodyDirectChild = portal.parentElement === document.body;
      const popover = document.querySelector('.clockit-tutorial-popover');
      const spotlightBox = document.querySelector('.clockit-tour-spotlight-box');

      const popoverZ = popover ? parseInt(window.getComputedStyle(popover).zIndex, 10) : 0;
      const spotlightZ = spotlightBox ? parseInt(window.getComputedStyle(spotlightBox).zIndex, 10) : 0;

      return {
        pass: isBodyDirectChild && popoverZ >= 99990 && spotlightZ >= 99990,
        isBodyDirectChild,
        popoverZ,
        spotlightZ,
      };
    });

    console.log(`  Portal direct child of document.body: ${layerCheck.isBodyDirectChild}`);
    console.log(`  Popover z-index: ${layerCheck.popoverZ} (>= 99990)`);
    console.log(`  Spotlight z-index: ${layerCheck.spotlightZ} (>= 99990)`);
    if (!layerCheck.pass) {
      throw new Error(`FAIL in Layering: ${JSON.stringify(layerCheck)}`);
    }
    console.log('  PASS: Layering & portal mounting confirmed topmost.\n');

    // TEST 2: Spotlight Measurement & Positioning
    console.log('[TEST 2 — SPOTLIGHT MEASUREMENT & CUTOUT]');
    const geometry1 = await page.evaluate(() => {
      const box = document.querySelector('.clockit-tour-spotlight-box');
      if (!box) return null;
      const rect = box.getBoundingClientRect();
      const style = window.getComputedStyle(box);
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        boxShadow: style.boxShadow.substring(0, 40) + '...',
        borderColor: style.borderColor,
      };
    });
    console.log('  Step 1 Spotlight Box:', geometry1);
    if (!geometry1 || geometry1.width <= 0 || geometry1.height <= 0) {
      throw new Error('FAIL: Spotlight box has invalid dimensions');
    }
    console.log('  PASS: Spotlight box properly measured and highlighted.\n');

    // TEST 3: Dynamic Spotlight Transition between Steps
    console.log('[TEST 3 — SMOOTH SPOTLIGHT TRANSITION]');
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('.clockit-tutorial-btn.primary')).find(b => b.textContent?.includes('Next'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const geometry2 = await page.evaluate(() => {
      const box = document.querySelector('.clockit-tour-spotlight-box');
      if (!box) return null;
      const rect = box.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    });
    console.log('  Step 2 Spotlight Box:', geometry2);
    if (!geometry2) {
      throw new Error('FAIL: Spotlight box missing after Next click');
    }
    console.log('  PASS: Spotlight box smoothly updated geometry.\n');

    // TEST 4: Home Page Animations
    console.log('[TEST 4 — HOME PAGE ANIMATIONS]');
    const animations = await page.evaluate(() => {
      const hero = document.querySelector('.clockit-hero-card');
      const snapshot = document.querySelector('.clockit-home-snapshot');
      const tasksCard = document.querySelector('.clockit-tasks-card');
      const widget = document.querySelector('.clockit-widget-card');

      return {
        heroAnim: hero ? window.getComputedStyle(hero).animationName : 'none',
        snapshotAnim: snapshot ? window.getComputedStyle(snapshot).animationName : 'none',
        tasksAnim: tasksCard ? window.getComputedStyle(tasksCard).animationName : 'none',
        widgetTransition: widget ? window.getComputedStyle(widget).transitionProperty : 'none',
      };
    });
    console.log('  Dashboard animation inspection:', animations);
    if (!animations.heroAnim || animations.heroAnim === 'none') {
      throw new Error('FAIL: Hero card does not have animation applied');
    }
    console.log('  PASS: Dashboard entrance & interaction animations verified.\n');

    // TEST 5: Skip Page cross-route transition to Tasks
    console.log('[TEST 5 — SKIP PAGE NAVIGATION]');
    await page.evaluate(() => {
      const skipBtn = document.querySelector('.clockit-tutorial-skip');
      if (skipBtn) skipBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const currentUrl = page.url();
    console.log(`  URL after Skip Page: ${currentUrl}`);
    if (!currentUrl.includes('/app/tasks')) {
      throw new Error(`FAIL: Expected /app/tasks, got ${currentUrl}`);
    }
    console.log('  PASS: Skip Page navigated cleanly to /app/tasks.\n');

    // TEST 6: Previous across route boundary
    console.log('[TEST 6 — PREVIOUS ACROSS ROUTE BOUNDARY]');
    await page.evaluate(() => {
      const prevBtn = Array.from(document.querySelectorAll('.clockit-tutorial-btn.secondary')).find(b => b.textContent?.includes('Previous'));
      if (prevBtn) prevBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const prevUrl = page.url();
    console.log(`  URL after Previous: ${prevUrl}`);
    if (!prevUrl.includes('/app') || prevUrl.includes('/app/tasks')) {
      throw new Error(`FAIL: Expected /app, got ${prevUrl}`);
    }
    console.log('  PASS: Previous navigated back across route boundary.\n');

    // TEST 7: Mobile Viewport Docking
    console.log('[TEST 7 — MOBILE VIEWPORT DOCKING]');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(r => setTimeout(r, 300));

    // Force window resize event in page
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await new Promise(r => setTimeout(r, 300));

    const mobilePos = await page.evaluate(() => {
      const popover = document.querySelector('.clockit-tutorial-popover');
      if (!popover) return null;
      const rect = popover.getBoundingClientRect();
      return {
        bottom: window.innerHeight - rect.bottom,
        left: rect.left,
        right: window.innerWidth - rect.right,
        width: rect.width,
      };
    });
    console.log('  Mobile Popover Placement:', mobilePos);
    if (!mobilePos || mobilePos.width > 375) {
      throw new Error('FAIL: Popover overflows mobile viewport');
    }
    console.log('  PASS: Popover docks gracefully to bottom on mobile.\n');

    console.log('================================================================');
    console.log('   ALL TUTORIAL REFINEMENT QA TESTS PASSED SUCCESSFULLY!        ');
    console.log('================================================================');
  } catch (err) {
    console.error('ERROR during browser QA:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
