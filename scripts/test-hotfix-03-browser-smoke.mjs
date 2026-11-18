import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = process.env.CLOCKIT_TEST_URL || 'http://127.0.0.1:5174';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'clockit-hotfix03-browser-'));
let browser;

try {
  browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    userDataDir: profile,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  for (const width of [320, 360, 375, 393, 430, 768, 1280]) {
    await page.setViewport({ width, height: 900 });
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 15000 });
    const result = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      title: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim(),
      body: document.body.innerText,
    }));
    if (!result.title?.includes('Your time.')) throw new Error(`Homepage did not render at ${width}px`);
    if (result.scrollWidth > result.clientWidth) throw new Error(`Horizontal overflow at ${width}px: ${result.scrollWidth}px`);
    if (/SOC 2|GDPR|Sprint velocity|Datadog|Monzo|Jira|Linear/i.test(result.body)) {
      throw new Error(`Unsupported enterprise copy found at ${width}px`);
    }
  }
  console.log('PASS: public homepage content and overflow checks at 320, 360, 375, 393, 430, 768, and 1280px.');
} catch (error) {
  console.error('BLOCKED/FAILED: isolated Puppeteer homepage smoke test did not complete.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
}
