/*
  Fetch Wger exercise fixtures JSON files directly from GitHub raw URLs.
*/

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT_DIR = path.resolve(ROOT, 'data-sources/wger');

const BASE = 'https://raw.githubusercontent.com/wger-project/wger/master/wger/exercises/fixtures/';
// Some repos moved fixtures into subfolders; attempt both roots
const CANDIDATES = [
  (file: string) => `${BASE}${file}`,
  (file: string) => `https://raw.githubusercontent.com/wger-project/wger/master/exercises/fixtures/${file}`
];

const FILES: string[] = ['exercises.json', 'equipment.json', 'muscles.json'];

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const name of FILES) {
    let lastErr: any;
    for (const builder of CANDIDATES) {
      const url = builder(name);
      try {
        const text = await fetchText(url);
        const outPath = path.resolve(OUT_DIR, name);
        fs.writeFileSync(outPath, text);
        console.log('Saved', outPath);
        lastErr = undefined;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) console.error('Failed to fetch', name, lastErr);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


