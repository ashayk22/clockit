const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

console.log('=== SECTION & VIEW HEADERS IN index.html ===');
lines.forEach((l, i) => {
  if (l.includes('<!-- ===') || (l.includes('id=') && (l.includes('section') || l.includes('view') || l.includes('view-') || l.includes('tab-')))) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
