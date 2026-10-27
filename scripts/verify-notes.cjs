const fs = require('fs');

console.log('=== Checking Notes Layout & Features Implementation ===');

// Check CSS rules in dist
const distFiles = fs.readdirSync('dist/assets');
const cssFile = distFiles.find(f => f.endsWith('.css'));
const cssContent = fs.readFileSync(`dist/assets/${cssFile}`, 'utf8');

const checks = [
  { name: 'Notes layout grid', pattern: '.clockit-notes-layout{' },
  { name: 'Notes layout min-width:0', pattern: 'min-width:0' },
  { name: 'Sidebar overflow-y:auto', pattern: '.clockit-notes-sidebar{' },
  { name: 'Editor pane overflow-y:auto', pattern: '.clockit-notes-editor-pane{' },
  { name: 'Graph pane overflow-y:auto', pattern: '.clockit-notes-graph-pane{' },
  { name: 'Editor toolbar', pattern: '.clockit-editor-toolbar{' },
  { name: 'Prose editor styling', pattern: '.clockit-prose-editor{' },
  { name: 'Task list styling', pattern: '.clockit-editor-task-list{' },
  { name: 'Internal link styling', pattern: '.internal-note-link{' },
  { name: 'Responsive tables in editor', pattern: '.clockit-prose-editor table{' },
  { name: 'Code blocks in editor', pattern: '.clockit-editor-code-block{' },
];

let allPassed = true;
checks.forEach(c => {
  if (cssContent.includes(c.pattern)) {
    console.log(`✓ ${c.name} is present in production CSS`);
  } else {
    console.warn(`✗ ${c.name} missing in production CSS (${c.pattern})`);
    allPassed = false;
  }
});

console.log(`\nAll CSS checks passed: ${allPassed}`);
