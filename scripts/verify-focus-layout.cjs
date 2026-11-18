const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.CLOCKIT_TEST_URL || 'http://localhost:5173';
const VIEWPORTS = [320, 360, 375, 393, 430, 768, 1024, 1280, 1440];

async function run() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`FATAL: Chrome executable not found at: ${CHROME_PATH}`);
    process.exit(1);
  }

  const screenshotsDir = path.join(__dirname, '..', 'tmp', 'screenshots', 'focus');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clockit-focus-test-'));

  let browser;
  try {
    console.log(`[verify-focus] Launching browser with executable: ${CHROME_PATH}`);
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      userDataDir: tempProfileDir,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    // Sign into Demo mode to test authenticated /app/focus route
    console.log(`[verify-focus] Navigating to ${BASE_URL}/login to enter Demo Mode...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 15000 });

    const demoBtn = await page.waitForSelector('.clockit-auth-demo', { timeout: 8000 });
    if (!demoBtn) {
      throw new Error('Could not find .clockit-auth-demo button on /login');
    }
    await demoBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});

    // Ensure we are inside /app
    console.log(`[verify-focus] Navigating to ${BASE_URL}/app/focus...`);
    await page.goto(`${BASE_URL}/app/focus`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('.focus-workspace', { timeout: 8000 });
    await page.waitForSelector('.clockit-editor-toolbar', { timeout: 10000 });

    const errors = [];
    const results = [];

    for (const width of VIEWPORTS) {
      const height = width < 768 ? 850 : 900;
      await page.setViewport({ width, height });
      // Small pause for layout reflow and font settle
      await new Promise((resolve) => setTimeout(resolve, 400));

      const screenshotPath = path.join(screenshotsDir, `focus-${width}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const metrics = await page.evaluate((w) => {
        const bodyScrollW = document.body.scrollWidth;
        const docScrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        const hasOverflow = bodyScrollW > innerW || docScrollW > innerW;

        const mainElem = document.querySelector('.focus-workspace-main');
        const clockPane = document.querySelector('.focus-clock-workspace-pane');
        const notesPanel = document.querySelector('.focus-notes-panel');
        const editorWrap = document.querySelector('.focus-notes-editor-wrap');
        const toolbar = document.querySelector('.clockit-editor-toolbar');
        const controls = document.querySelector('.focus-playback-controls');

        const mainRect = mainElem ? mainElem.getBoundingClientRect() : null;
        const clockRect = clockPane ? clockPane.getBoundingClientRect() : null;
        const notesRect = notesPanel ? notesPanel.getBoundingClientRect() : null;
        const toolbarRect = toolbar ? toolbar.getBoundingClientRect() : null;
        const controlsRect = controls ? controls.getBoundingClientRect() : null;

        // Check side-by-side vs stacked:
        // side-by-side if notesPanel left is to the right of clockPane left (i.e. horizontal offset)
        const isSideBySide = Boolean(
          clockRect && notesRect && Math.abs(clockRect.top - notesRect.top) < 160 && notesRect.left > clockRect.left + 50
        );

        // Check if toolbar wraps awkwardly or overflows notes panel
        const toolbarOverflows = Boolean(
          toolbarRect && notesRect && (toolbarRect.right > notesRect.right + 2 || toolbarRect.left < notesRect.left - 2)
        );

        // Check if controls are within viewport
        const controlsVisible = Boolean(
          controlsRect && controlsRect.bottom <= window.innerHeight + 100 && controlsRect.width > 0
        );

        // Find elements that bleed past innerW
        let offendingTags = [];
        if (hasOverflow) {
          const all = document.querySelectorAll('*');
          for (const el of all) {
            const r = el.getBoundingClientRect();
            if (r.right > innerW + 1) {
              const id = el.id ? `#${el.id}` : '';
              const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
              offendingTags.push(`${el.tagName.toLowerCase()}${id}${cls} (right: ${Math.round(r.right)}px > ${innerW}px)`);
            }
          }
        }

        return {
          width: w,
          innerW,
          bodyScrollW,
          docScrollW,
          hasOverflow,
          isSideBySide,
          toolbarOverflows,
          controlsVisible,
          notesPanelHeight: notesRect ? Math.round(notesRect.height) : 0,
          editorWrapHeight: editorWrap ? Math.round(editorWrap.getBoundingClientRect().height) : 0,
          offendingTags: offendingTags.slice(0, 5),
        };
      }, width);

      results.push(metrics);

      if (metrics.hasOverflow) {
        errors.push(
          `[FAIL] ${width}px: Horizontal overflow detected (doc: ${metrics.docScrollW}px, body: ${metrics.bodyScrollW}px, inner: ${metrics.innerW}px). Offending: ${metrics.offendingTags.join(', ')}`
        );
      } else {
        console.log(`[PASS] ${width}px: No horizontal overflow (scrollWidth=${metrics.docScrollW}px). Side-by-side: ${metrics.isSideBySide}. Notes panel height: ${metrics.notesPanelHeight}px.`);
      }

      // Check desktop side-by-side expectation (>=1024px)
      if (width >= 1024 && !metrics.isSideBySide) {
        errors.push(`[FAIL] ${width}px: Expected clock and notes side-by-side on desktop, but they are stacked.`);
      }

      // Check mobile stacked expectation (<768px)
      if (width < 768 && metrics.isSideBySide) {
        errors.push(`[FAIL] ${width}px: Expected clock and notes stacked vertically on mobile, but they are side-by-side.`);
      }

      if (metrics.toolbarOverflows) {
        errors.push(`[FAIL] ${width}px: Notes toolbar overflows notes panel.`);
      }
    }

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log(`Tested ${VIEWPORTS.length} viewports: ${VIEWPORTS.join(', ')}px.`);
    console.log(`Screenshots saved to: ${screenshotsDir}`);

    if (errors.length > 0) {
      console.error('\nFAILURES ENCOUNTERED:');
      for (const err of errors) {
        console.error(`- ${err}`);
      }
      process.exit(1);
    } else {
      console.log('\nALL VIEWPORTS PASSED SUCCESSFULLY! Zero horizontal overflow, correct layout modes.');
      process.exit(0);
    }
  } catch (err) {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }
}

run();
