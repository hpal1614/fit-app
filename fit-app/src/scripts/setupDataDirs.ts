import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const dirs = [
  path.resolve(ROOT, 'data-sources/wger'),
  path.resolve(ROOT, 'data-sources/exercisedb')
];

for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
  // eslint-disable-next-line no-console
  console.log('Ensured directory:', dir);
}





