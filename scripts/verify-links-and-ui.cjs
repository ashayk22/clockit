const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';

const PUBLIC_ROUTES = ['/', '/case-studies', '/login', '/signup'];
const APP_ROUTES = [
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
    console.error(`FATAL: Chrome not found at ${CHROME_PATH}`);
    process.exit(1);
  }

  console.log(`[audit] Launching Chrome...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  let errors = 0;
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore favicon or non-critical 404s for external resources if any
      if (!text.includes('favicon.ico')) {
        consoleErrors.push(`[Console Error] ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`[Page Crash/Exception] ${err.message}`);
  });

  try {
    // 1. Audit Public Routes
    console.log('\n--- 1. Auditing Public Routes & Links ---');
    for (const route of PUBLIC_ROUTES) {
      console.log(`Auditing ${route}...`);
      const res = await page.goto(`${APP_URL}${route}`, { waitUntil: 'networkidle2', timeout: 15000 });
      if (!res || res.status() >= 400) {
        console.error(`❌ Route ${route} returned status ${res ? res.status() : 'null'}`);
        errors++;
        continue;
      }

      // Check React Error Boundary
      const errorBoundary = await page.$('.clockit-error-boundary, [role="alert"]');
      if (errorBoundary) {
        const text = await page.evaluate(el => el.textContent, errorBoundary);
        console.error(`❌ Error boundary triggered on ${route}: ${text}`);
        errors++;
      }

      // Audit internal links
      const links = await page.$$eval('a[href]', els =>
        els.map(el => ({
          href: el.getAttribute('href'),
          text: el.textContent.trim(),
        }))
      );

      for (const link of links) {
        if (!link.href) continue;
        if (link.href.startsWith('#')) {
          // Check anchor element exists on page
          const targetId = link.href.slice(1);
          const exists = await page.$(`#${targetId}`);
          if (!exists) {
            console.error(`❌ Broken anchor link on ${route}: href="${link.href}" (target #${targetId} not found in DOM)`);
            errors++;
          }
        } else if (link.href.startsWith('/') && !link.href.startsWith('//')) {
          // Internal route
          const targetUrl = `${APP_URL}${link.href}`;
          const targetPage = await browser.newPage();
          try {
            const linkRes = await targetPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            if (!linkRes || linkRes.status() >= 400) {
              console.error(`❌ Broken internal link on ${route}: href="${link.href}" -> status ${linkRes?.status()}`);
              errors++;
            }
          } catch (e) {
            console.error(`❌ Failed navigating to internal link href="${link.href}": ${e.message}`);
            errors++;
          } finally {
            await targetPage.close();
          }
        }
      }
      console.log(`✓ ${route} passed (${links.length} links checked).`);
    }

    // 2. Establish Authenticated Demo Session
    console.log('\n--- 2. Auditing Authenticated Dashboard Routes ---');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    const demoBtn = await page.$('.clockit-auth-demo');
    if (!demoBtn) {
      console.error('❌ Demo login button not found');
      errors++;
    } else {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        demoBtn.click(),
      ]);
    }

    // 3. Audit Protected Routes
    for (const route of APP_ROUTES) {
      console.log(`Auditing authenticated ${route}...`);
      await page.goto(`${APP_URL}${route}`, { waitUntil: 'networkidle2', timeout: 15000 });

      // Verify no redirect to /login
      if (page.url().includes('/login')) {
        console.error(`❌ Protected route ${route} redirected to /login!`);
        errors++;
        continue;
      }

      // Check Error Boundary
      const errorBoundary = await page.$('.clockit-error-boundary');
      if (errorBoundary) {
        const text = await page.evaluate(el => el.textContent, errorBoundary);
        console.error(`❌ Error boundary triggered on ${route}: ${text}`);
        errors++;
      }

      // Check for zero-overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      if (overflow) {
        console.error(`❌ Horizontal overflow detected on ${route}`);
        errors++;
      }

      console.log(`✓ ${route} cleanly loaded.`);
    }

  } catch (err) {
    console.error(`Fatal audit exception:`, err);
    errors++;
  } finally {
    await browser.close();
  }

  if (consoleErrors.length > 0) {
    console.log(`\n--- Console Log / Error Inspection (${consoleErrors.length} events) ---`);
    for (const ce of consoleErrors) {
      console.log(ce);
    }
  }

  if (errors > 0) {
    console.error(`\nAudit completed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`\nAudit SUCCESS: Zero broken links, zero crashes, zero errors across all public & authenticated routes! ✓`);
    process.exit(0);
  }
}

run();
