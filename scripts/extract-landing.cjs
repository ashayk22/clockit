/**
 * One-off extraction: pull the original public landing-page markup out of the
 * pre-React monolithic page (index.html.bak) and scope the legacy stylesheet
 * (src/style.css) under a .clockit-landing wrapper so it can live safely inside
 * the React app without leaking into the authenticated dashboard.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const bak = fs.readFileSync(path.join(root, 'index.html.bak'), 'utf8');
const lines = bak.split(/\r?\n/);

// Landing markup: breadcrumbs + nav + hero + sections + footer (1-indexed 77..1181)
const landingLines = lines.slice(76, 1181);
// Global toast element (1-indexed 2743..2747)
const toastLines = lines.slice(2742, 2747);

const landingHtml =
  '<!-- ClockIt public landing page (restored from the pre-React build; markup preserved verbatim) -->\n' +
  landingLines.join('\n') +
  '\n\n  ' +
  toastLines.join('\n') +
  '\n';

const outDir = path.join(root, 'src', 'landing');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'landing.html'), landingHtml, 'utf8');
console.log('landing.html written:', landingHtml.length, 'chars');

// ---------------------------------------------------------------------------
// Stylesheet scoping
// ---------------------------------------------------------------------------
let css = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');
// Strip comments so brace/semicolon scanning is safe.
css = css.replace(/\/\*[\s\S]*?\*\//g, '');

function prefixOne(sel) {
  const s = sel.trim();
  if (!s) return s;
  if (s === ':root' || s === 'html' || s === 'body') return '.clockit-landing';
  if (s === 'html.dark') return 'html.dark .clockit-landing';
  if (s === 'html.dark body') return 'html.dark .clockit-landing';
  if (s.startsWith('html.dark ')) return 'html.dark .clockit-landing ' + s.slice(10);
  if (s.startsWith('html ')) return '.clockit-landing ' + s.slice(5);
  if (s === '*') return '.clockit-landing *';
  if (s.startsWith('*::')) return '.clockit-landing ' + s;
  if (s.startsWith('.clockit-landing')) return s;
  return '.clockit-landing ' + s;
}

function findBlockEnd(str, openIdx) {
  let depth = 0;
  for (let k = openIdx; k < str.length; k++) {
    if (str[k] === '{') depth++;
    else if (str[k] === '}') {
      depth--;
      if (depth === 0) return k;
    }
  }
  return str.length - 1;
}

function transform(str) {
  let out = '';
  let i = 0;
  while (i < str.length) {
    let j = i;
    while (j < str.length && str[j] !== '{' && str[j] !== '}' && str[j] !== ';') j++;
    const prelude = str.slice(i, j);
    if (j >= str.length) { out += prelude; break; }
    if (str[j] === '}') { out += prelude + '}'; i = j + 1; continue; }
    if (str[j] === ';') { out += prelude + ';'; i = j + 1; continue; }

    const trimmed = prelude.trim();
    const end = findBlockEnd(str, j);

    if (trimmed.startsWith('@')) {
      const atName = trimmed.slice(1).split(/[\s{]/)[0].toLowerCase();
      const opaque = /keyframes$/.test(atName) || atName === 'font-face' ||
        atName === 'page' || atName === 'property' || atName === 'counter-style' ||
        atName === 'charset' || atName === 'import' || atName === 'namespace';
      if (opaque) {
        out += str.slice(i, end + 1);
      } else {
        const inner = str.slice(j + 1, end);
        out += prelude + '{' + transform(inner) + '}';
      }
      i = end + 1;
      continue;
    }

    const body = str.slice(j + 1, end);
    const sels = trimmed.split(',').map(prefixOne).join(', ');
    out += sels + '{' + body + '}';
    i = end + 1;
  }
  return out;
}

const scoped = transform(css);
const banner =
  '/* ==========================================================================\n' +
  '   ClockIt Landing (scoped)\n' +
  '   Auto-extracted from the legacy stylesheet and namespaced under\n' +
  '   .clockit-landing so it never leaks into the authenticated dashboard.\n' +
  '   ========================================================================== */\n\n';
fs.writeFileSync(path.join(root, 'src', 'styles', 'landing.css'), banner + scoped, 'utf8');
console.log('landing.css written:', scoped.length, 'chars');
