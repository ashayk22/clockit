import puppeteer from 'puppeteer-core';

const viewports = [320, 360, 375, 393, 430];
const routes = [
  '/app/habits',
  '/app/analytics',
  '/app',
  '/app/tasks',
  '/app/calendar',
  '/app/notes',
  '/app/focus',
  '/app/settings'
];
const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function audit() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage();

  // Login demo
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.clockit-auth-demo');
  await page.click('.clockit-auth-demo');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});

  const issues = [];

  for (const w of viewports) {
    await page.setViewport({ width: w, height: 750 });
    for (const r of routes) {
      await page.goto(`${BASE_URL}${r}`, { waitUntil: 'networkidle0' });
      await new Promise((res) => setTimeout(res, 300));

      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.offsetWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bodyScrollW = document.body.scrollWidth;
        const hasHorizontalScroll = scrollW > docW || bodyScrollW > docW;

        let offending = [];
        if (hasHorizontalScroll) {
          const all = document.querySelectorAll('*');
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > docW + 1) {
              offending.push({
                tag: el.tagName,
                cls: typeof el.className === 'string' ? el.className : '',
                id: el.id,
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
            }
          }
        }
        return {
          docW,
          scrollW,
          bodyScrollW,
          hasHorizontalScroll,
          offending: offending.slice(0, 8)
        };
      });

      if (overflow.hasHorizontalScroll) {
        issues.push({
          viewport: w,
          route: r,
          docW: overflow.docW,
          scrollW: Math.max(overflow.scrollW, overflow.bodyScrollW),
          offending: overflow.offending
        });
      }
    }
  }

  console.log('=== OVERFLOW SUMMARY ===');
  console.log(`Total overflowing views: ${issues.length}`);
  for (const iss of issues) {
    console.log(`[${iss.viewport}px] ${iss.route}: scrollW=${iss.scrollW} > docW=${iss.docW}`);
    for (const off of iss.offending) {
      console.log(`   -> <${off.tag} class='${off.cls}'> width=${off.width} right=${off.right}`);
    }
  }
  await browser.close();
}

audit().catch(console.error);

