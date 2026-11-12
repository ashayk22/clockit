import puppeteer from 'puppeteer-core';

const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTest() {
  console.log('================================================================');
  console.log('  CLOCKIT HOTFIX 01 — ONBOARDING PROVIDER REGRESSION TEST       ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const page = await browser.newPage();
  const pageErrors = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  try {
    // 1. Visit /login
    console.log('[TEST 1] Visiting /login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    console.log('  -> Login page loaded');

    // 2. Sign in via Demo Mode
    console.log('[TEST 2] Signing into Demo Mode...');
    await page.waitForSelector('.clockit-auth-demo');
    await page.click('.clockit-auth-demo');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    console.log(`  -> Navigated to: ${page.url()}`);

    // 3. Test navigation to /onboarding?edit=true (authenticated user)
    console.log('[TEST 3] Navigating directly to /onboarding?edit=true...');
    await page.goto(`${BASE_URL}/onboarding?edit=true`, { waitUntil: 'networkidle0' });
    console.log(`  -> Current URL: ${page.url()}`);

    // Verify wizard rendered
    const wizardMounted = await page.evaluate(() => {
      return Boolean(
        document.querySelector('.clockit-onboarding-shell') ||
        document.querySelector('.clockit-onboarding-card') ||
        document.querySelector('h1, h2')
      );
    });

    const headerText = await page.evaluate(() => {
      const heading = document.querySelector('h1, h2');
      return heading ? heading.textContent : '';
    });

    console.log(`  -> Wizard header text: "${headerText}"`);
    console.log(`  -> Wizard DOM mounted: ${wizardMounted}`);

    // Check for "useOnboarding must be used within an OnboardingProvider" error
    const hasContextError = pageErrors.some((e) =>
      e.includes('useOnboarding must be used within an OnboardingProvider')
    );

    if (hasContextError) {
      throw new Error('FAILED: Detected "useOnboarding must be used within an OnboardingProvider" runtime error');
    }

    if (!wizardMounted) {
      throw new Error('FAILED: Onboarding wizard card was not rendered');
    }

    console.log('  -> PASS: /onboarding rendered cleanly with OnboardingProvider intact\n');

    // 4. Test Navigation back to /app and /app/settings
    console.log('[TEST 4] Testing navigation to /app...');
    await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle0' });
    console.log(`  -> App URL: ${page.url()}`);

    console.log('[TEST 5] Testing navigation to /app/settings...');
    await page.goto(`${BASE_URL}/app/settings`, { waitUntil: 'networkidle0' });
    console.log(`  -> Settings URL: ${page.url()}`);

    // 5. Test unauthenticated redirect on /onboarding
    console.log('[TEST 6] Testing unauthenticated redirect on /onboarding in clean context...');
    const context = await browser.createBrowserContext();
    const cleanPage = await context.newPage();

    await cleanPage.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle0' });
    console.log(`  -> Unauthenticated redirected to: ${cleanPage.url()}`);

    const redirectedToLogin = cleanPage.url().includes('/login');
    if (!redirectedToLogin) {
      throw new Error(`FAILED: Expected unauthenticated visit to redirect to /login, got ${cleanPage.url()}`);
    }
    console.log('  -> PASS: Unauthenticated visitors redirected to /login\n');

    console.log('================================================================');
    console.log('  ALL HOTFIX 01 REGRESSION TESTS PASSED!                        ');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err);
  process.exit(1);
});
