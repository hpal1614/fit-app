/*
  Fetch Wger API datasets (free, no key): exercises (EN), equipment, muscles
*/

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT_DIR = path.resolve(ROOT, 'data-sources/wger');

async function fetchAll<T = any>(url: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = url;
  while (next) {
    const res = await fetch(next);
    if (!res.ok) throw new Error(`${next} -> ${res.status}`);
    const json: any = await res.json();
    if (Array.isArray(json)) {
      out.push(...json);
      break;
    }
    if (json.results) out.push(...json.results);
    next = json.next;
  }
  return out;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // English language id in wger is 2. Use exerciseinfo for translated names/desc
  const exUrl = 'https://wger.de/api/v2/exerciseinfo/?language=2&limit=200';
  const eqUrl = 'https://wger.de/api/v2/equipment/?limit=200';
  const muUrl = 'https://wger.de/api/v2/muscle/?limit=200';

  const [exercises, equipment, muscles] = await Promise.all([
    fetchAll(exUrl),
    fetchAll(eqUrl),
    fetchAll(muUrl)
  ]);

  fs.writeFileSync(path.resolve(OUT_DIR, 'exercises-api.json'), JSON.stringify(exercises, null, 2));
  fs.writeFileSync(path.resolve(OUT_DIR, 'equipment-api.json'), JSON.stringify(equipment, null, 2));
  fs.writeFileSync(path.resolve(OUT_DIR, 'muscles-api.json'), JSON.stringify(muscles, null, 2));
  console.log('Saved exercises-api.json', exercises.length);
  console.log('Saved equipment-api.json', equipment.length);
  console.log('Saved muscles-api.json', muscles.length);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


