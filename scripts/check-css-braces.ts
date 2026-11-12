import fs from 'fs';
import path from 'path';

function checkCss(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  let open = 0;
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    for (const c of l) {
      if (c === '{') open++;
      if (c === '}') {
        open--;
        if (open < 0) {
          console.log(`Unmatched '}' in ${filePath} at line ${idx + 1}: ${l.trim()}`);
          open = 0;
        }
      }
    }
  });
  if (open !== 0) {
    console.log(`Unclosed '{' in ${filePath}: remaining = ${open}`);
  }
}

const dir = 'src/styles';
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.css')) {
    checkCss(path.join(dir, f));
  }
});
