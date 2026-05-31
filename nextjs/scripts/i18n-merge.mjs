// Deep-merges a patch ({ en:{...}, ru:{...}, az:{...} }) into the three locale
// message files, keeping all three perfectly in sync. Usage:
//   node scripts/i18n-merge.mjs path/to/patch.json
import fs from 'node:fs';
import path from 'node:path';

const LOCALES = ['en', 'ru', 'az'];
const msgDir = path.join(process.cwd(), 'messages');

function deepMerge(target, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
      target[k] = deepMerge(target[k] && typeof target[k] === 'object' ? target[k] : {}, src[k]);
    } else {
      target[k] = src[k];
    }
  }
  return target;
}

const patchPath = process.argv[2];
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));

for (const loc of LOCALES) {
  const file = path.join(msgDir, `${loc}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  deepMerge(data, patch[loc] || {});
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// Report leaf-key counts so sync can be verified at a glance.
const count = (x) => Object.values(x).reduce((a, v) => a + (v && typeof v === 'object' ? count(v) : 1), 0);
const counts = LOCALES.map((l) => count(JSON.parse(fs.readFileSync(path.join(msgDir, `${l}.json`), 'utf8'))));
console.log('leaf-key counts:', LOCALES.map((l, i) => `${l}=${counts[i]}`).join(' '));
