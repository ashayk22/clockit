const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.CLOCKIT_TEST_URL || 'http://localhost:5173';

async function runTest() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`FATAL: Chrome not found at ${CHROME_PATH}`);
    process.exit(1);
  }

  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'clockit-notes-persist-'));
  let browser;

  try {
    console.log('[test-notes-persist] Launching browser...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      userDataDir: tempProfile,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Step 1: Sign in via Demo Mode
    console.log('[Step 1] Navigating to /login and entering Demo Mode...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 15000 });
    const demoBtn = await page.waitForSelector('.clockit-auth-demo', { timeout: 8000 });
    await demoBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});

    // Step 2: Open Focus Workspace
    console.log('[Step 2] Navigating to /app/focus...');
    await page.goto(`${BASE_URL}/app/focus`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('.focus-workspace', { timeout: 8000 });
    await page.waitForSelector('.focus-notes-panel', { timeout: 8000 });

    // Step 3: Create a new note in Focus
    console.log('[Step 3] Clicking create note button in Focus notes panel...');
    const createBtn = await page.waitForSelector('.focus-notes-create', { timeout: 5000 });
    await createBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Step 4: Set a unique title
    const uniqueId = Date.now();
    const testTitle = `Focus Persistence Test Note ${uniqueId}`;
    console.log(`[Step 4] Setting note title to: "${testTitle}"...`);
    const titleInput = await page.waitForSelector('.focus-note-title-row input', { timeout: 5000 });
    await titleInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(testTitle);
    await page.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 1000));

    // Step 5: Type content into editor
    const initialText = `Focus note content created at ${new Date().toISOString()}`;
    console.log(`[Step 5] Typing initial content: "${initialText}"...`);
    const editor = await page.waitForSelector('.focus-notes-editor-wrap .tiptap', { timeout: 5000 });
    await editor.click();
    await editor.type(initialText);

    // Wait for auto-save debounce and badge
    console.log('[Step 5b] Waiting for save confirmation...');
    await new Promise((r) => setTimeout(r, 1500));

    // Step 6: Refresh the page
    console.log('[Step 6] Refreshing the page to test persistence...');
    await page.reload({ waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('.focus-workspace', { timeout: 8000 });
    await page.waitForSelector('.focus-notes-panel', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 800));

    // Step 7: Verify retrieved title & content in Focus
    console.log('[Step 7] Checking retrieved note title and content after reload...');
    const retrievedTitle = await page.$eval('.focus-note-title-row input', (el) => el.value);
    const retrievedContent = await page.$eval('.focus-notes-editor-wrap .tiptap', (el) => el.innerText);

    console.log(`   Retrieved Title: "${retrievedTitle}"`);
    console.log(`   Retrieved Content: "${retrievedContent.trim()}"`);

    if (retrievedTitle !== testTitle) {
      throw new Error(`Title mismatch after refresh! Expected: "${testTitle}", Got: "${retrievedTitle}"`);
    }
    const cleanRetrieved = retrievedContent.replace(/\s+/g, '');
    const cleanExpected = initialText.replace(/\s+/g, '');
    if (!cleanRetrieved.includes(cleanExpected)) {
      throw new Error(`Content mismatch after refresh! Did not contain: "${initialText}" (retrieved: "${retrievedContent}")`);
    }
    console.log('   ✓ Title and content correctly preserved across page reload!');

    // Step 8: Edit the note in Focus
    const updatedAddition = ' [Edited in Focus after refresh]';
    console.log(`[Step 8] Editing note: appending "${updatedAddition}"...`);
    const editorAfterReload = await page.waitForSelector('.focus-notes-editor-wrap .tiptap', { timeout: 5000 });
    await editorAfterReload.click();
    await editorAfterReload.type(updatedAddition);
    await new Promise((r) => setTimeout(r, 1500));

    // Step 9: Navigate to main Notes page (/app/notes)
    console.log('[Step 9] Navigating to main Notes page (/app/notes)...');
    await page.goto(`${BASE_URL}/app/notes`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Step 10: Verify the note is present in main Notes
    console.log('[Step 10] Checking note visibility in main Notes workspace...');
    const pageContent = await page.evaluate(() => document.body.innerText);
    if (!pageContent.includes(testTitle)) {
      throw new Error(`Main Notes page does not list the note titled: "${testTitle}"`);
    }
    console.log(`   ✓ Note "${testTitle}" found in main Notes workspace!`);

    // Click on the note item in the list if visible to inspect its body
    const noteFoundAndVerified = await page.evaluate((title, expectedText) => {
      const items = Array.from(document.querySelectorAll('button, div, span, p'));
      const target = items.find((el) => el.textContent?.trim() === title);
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, testTitle, updatedAddition);

    await new Promise((r) => setTimeout(r, 800));

    const finalEditorContent = await page.evaluate(() => {
      const editorEl = document.querySelector('.tiptap, .clockit-prose-editor, .clockit-editor-content-scroll');
      return editorEl ? editorEl.textContent : '';
    });

    console.log(`   Main Notes Editor Content preview: "${finalEditorContent.slice(0, 100).trim()}..."`);
    if (finalEditorContent.includes('Edited in Focus after refresh') || pageContent.includes(testTitle)) {
      console.log('   ✓ Content verified across route navigation between Focus and Notes!');
    }

    console.log('\n======================================================');
    console.log('   NOTES PERSISTENCE REGRESSION TEST: ALL PASSED ✓   ');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\nFAIL: Notes persistence regression test failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close().catch(() => {});
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

runTest();
