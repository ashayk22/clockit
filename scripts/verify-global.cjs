const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.CLOCKIT_TEST_URL || 'http://localhost:5173';
const VIEWPORTS = [320, 360, 375, 393, 430, 768, 1024, 1280, 1440];
const ROUTES = [
  '/app',
  '/app/focus',
  '/app/tasks',
  '/app/notes',
  '/app/habits',
  '/app/calendar',
  '/app/analytics',
  '/app/settings',
];

async function run() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`FATAL: Chrome executable not found at: ${CHROME_PATH}`);
    process.exit(1);
  }

  const screenshotsDir = path.join(__dirname, '..', 'tmp', 'screenshots', 'global');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clockit-global-test-'));

  let browser;
  try {
    console.log(`[verify-global] Launching browser with executable: ${CHROME_PATH}`);
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      userDataDir: tempProfileDir,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    // Authenticate via Demo Mode
    console.log(`[verify-global] Logging into Demo Mode via ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 15000 });
    const demoBtn = await page.waitForSelector('.clockit-auth-demo', { timeout: 8000 });
    if (!demoBtn) throw new Error('Could not find .clockit-auth-demo on /login');
    await demoBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});

    // Verify session
    if (page.url().includes('/login')) {
      throw new Error('Failed to authenticate: redirected back to /login');
    }

    const errors = [];
    const auditLog = [];

    for (const route of ROUTES) {
      console.log(`\n--- Auditing Route: ${route} ---`);
      const routeSlug = route.replace(/\//g, '_').replace(/^_/, '');

      for (const width of VIEWPORTS) {
        const height = width < 768 ? 850 : 900;
        await page.setViewport({ width, height });
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle0', timeout: 15000 });

        // Guard against login redirect
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          errors.push(`[FAIL] ${route} @ ${width}px redirected to login; not tested.`);
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 350));

        // Save screenshot
        const screenshotPath = path.join(screenshotsDir, `${routeSlug}-${width}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        const metrics = await page.evaluate((w) => {
          const bodyScrollW = document.body.scrollWidth;
          const docScrollW = document.documentElement.scrollWidth;
          const innerW = window.innerWidth;
          const hasOverflow = bodyScrollW > innerW + 1 || docScrollW > innerW + 1;

          // Find offending elements bleeding past viewport
          let offending = [];
          if (hasOverflow) {
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > innerW + 1) {
                const id = el.id ? `#${el.id}` : '';
                const cls = el.className && typeof el.className === 'string'
                  ? `.${el.className.trim().split(/\s+/).join('.')}`
                  : '';
                offending.push(`${el.tagName.toLowerCase()}${id}${cls} (right: ${Math.round(r.right)}px > ${innerW}px)`);
              }
            }
          }

          // Check mobile nav & header touch targets (when on mobile viewports <=768px)
          let smallTouchTargets = [];
          if (w <= 768) {
            const mobileNavItems = document.querySelectorAll('.clockit-mobile-nav-item');
            for (const item of mobileNavItems) {
              const r = item.getBoundingClientRect();
              if (r.height < 44 || r.width < 44) {
                smallTouchTargets.push(`MobileNavItem "${item.textContent?.trim()}" (${Math.round(r.width)}x${Math.round(r.height)}px)`);
              }
            }

            // Check mobile header buttons
            const headerButtons = document.querySelectorAll('.clockit-topbar .clockit-icon-action-btn, .clockit-nav-trigger');
            for (const btn of headerButtons) {
              const r = btn.getBoundingClientRect();
              if (r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44)) {
                smallTouchTargets.push(`HeaderBtn "${btn.getAttribute('aria-label') || 'unnamed'}" (${Math.round(r.width)}x${Math.round(r.height)}px)`);
              }
            }
          }

          // Check for content covered by fixed mobile nav
          let isContentCovered = false;
          if (w <= 768) {
            const mainViewport = document.querySelector('.clockit-main-viewport');
            const mobileNav = document.querySelector('.clockit-mobile-nav');
            if (mainViewport && mobileNav) {
              const mainPaddingBottom = parseInt(window.getComputedStyle(mainViewport).paddingBottom, 10);
              const navHeight = mobileNav.getBoundingClientRect().height;
              if (mainPaddingBottom < navHeight - 5) {
                isContentCovered = true;
              }
            }
          }

          return {
            innerW,
            docScrollW,
            bodyScrollW,
            hasOverflow,
            offending: offending.slice(0, 4),
            smallTouchTargets,
            isContentCovered,
          };
        }, width);

        if (metrics.hasOverflow) {
          const failMsg = `[OVERFLOW] ${route} @ ${width}px: scrollWidth=${metrics.docScrollW}px > ${metrics.innerW}px. Offending: ${metrics.offending.join('; ')}`;
          errors.push(failMsg);
          console.error(`   ✗ ${failMsg}`);
          auditLog.push(failMsg);
        } else {
          console.log(`   ✓ ${route} @ ${width}px: Clean layout (scrollWidth=${metrics.docScrollW}px).`);
        }

        if (metrics.smallTouchTargets.length > 0) {
          const warnMsg = `[TOUCH_TARGET] ${route} @ ${width}px: Touch target < 44px: ${metrics.smallTouchTargets.join(', ')}`;
          errors.push(warnMsg);
          console.error(`   ✗ ${warnMsg}`);
          auditLog.push(warnMsg);
        }

        if (metrics.isContentCovered) {
          const coverMsg = `[CONTENT_COVERED] ${route} @ ${width}px: .clockit-main-viewport padding-bottom is less than mobile nav height!`;
          errors.push(coverMsg);
          console.error(`   ✗ ${coverMsg}`);
          auditLog.push(coverMsg);
        }
      }
    }

    // Write audit log to tmp/layout-audit.md
    const auditPath = path.join(__dirname, '..', 'tmp', 'layout-audit.md');
    fs.mkdirSync(path.dirname(auditPath), { recursive: true });
    fs.writeFileSync(
      auditPath,
      `# Global Layout Audit Report\n\nGenerated: ${new Date().toISOString()}\n\n` +
      `Tested Routes: ${ROUTES.join(', ')}\nViewports: ${VIEWPORTS.join(', ')}px\n\n` +
      `## Issues Detected (${errors.length})\n\n` +
      (errors.length > 0 ? errors.map((e) => `- ${e}`).join('\n') : 'No layout overflow or touch-target issues detected across all routes!') +
      '\n'
    );
    console.log(`\nAudit report written to: ${auditPath}`);

    if (errors.length > 0) {
      console.error(`\nFAILED: Encountered ${errors.length} layout/responsiveness issues.`);
      process.exit(1);
    } else {
      console.log('\nSUCCESS: All routes passed at all viewports with zero overflow and compliant touch targets! ✓');
      process.exit(0);
    }
  } catch (err) {
    console.error('FATAL TEST ERROR in verify-global:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close().catch(() => {});
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }
}

run();
