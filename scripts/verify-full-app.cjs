const fs = require('fs');
const http = require('http');

console.log('--- 1. Checking CSS bundle ---');
const distFiles = fs.readdirSync('dist/assets');
const cssFile = distFiles.find(f => f.endsWith('.css'));
if (!cssFile) {
  console.error('ERROR: No CSS file generated in dist/assets!');
  process.exit(1);
}
const cssContent = fs.readFileSync(`dist/assets/${cssFile}`, 'utf8');

const requiredCssSelectors = [
  '*,*::before,*::after',
  'box-sizing:border-box',
  '.clockit-home-columns',
  '.clockit-tasks-columns',
  '.clockit-calendar-main-grid',
  '.clockit-month-calendar-table',
  '.clockit-cal-event-chip',
  '.clockit-focus-dial-container',
  '.clockit-focus-dial-stage',
  '.clockit-task-row',
  '.clockit-task-deadline',
  '.clockit-task-workspace-tag',
  '.clockit-filter-pill',
  '.clockit-primary-btn',
  '.clockit-icon-action-btn'
];

let allFound = true;
requiredCssSelectors.forEach(sel => {
  // strip spaces for minified comparison
  const strippedSel = sel.replace(/\s+/g, '');
  const strippedCss = cssContent.replace(/\s+/g, '');
  if (!strippedCss.includes(strippedSel)) {
    console.warn(`WARNING: Missing in built CSS: ${sel}`);
    allFound = false;
  } else {
    console.log(`✓ Found: ${sel}`);
  }
});

if (allFound) {
  console.log('All essential layout and styling rules verified in production CSS bundle!');
}

console.log('\n--- 2. Checking Dev Server HTTP Status ---');
const req = http.get('http://localhost:5173/', (res) => {
  console.log(`Dev server response status: ${res.statusCode} ${res.statusMessage}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (body.includes('<div id="root"></div>') && body.includes('/src/main.tsx')) {
      console.log('✓ HTML correctly serves the ClockIt React application root and main.tsx entrypoint');
    } else {
      console.warn('HTML output does not match expected root container');
    }
  });
});
req.on('error', (err) => {
  console.error('Dev server connection error:', err.message);
});
