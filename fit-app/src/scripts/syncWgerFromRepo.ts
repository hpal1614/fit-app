/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const REPO_DIR = path.resolve(ROOT, 'data-sources/wger-repo');
const OUT_DIR = path.resolve(ROOT, 'data-sources/wger');

function ensureRepo() {
  fs.mkdirSync(path.dirname(REPO_DIR), { recursive: true });
  if (!fs.existsSync(REPO_DIR)) {
    execSync(`git clone --depth 1 https://github.com/wger-project/wger.git ${REPO_DIR}`, { stdio: 'inherit' });
  } else {
    execSync(`git -C ${REPO_DIR} fetch --depth 1 origin`, { stdio: 'inherit' });
    execSync(`git -C ${REPO_DIR} reset --hard origin/master`, { stdio: 'inherit' });
  }
}

function findFiles(root: string, fileNames: string[]): Record<string, string> {
  const found: Record<string, string> = {};
  const targets = new Set(fileNames);
  const stack = [root];
  while (stack.length && targets.size) {
    const dir = stack.pop()!;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile() && targets.has(e.name)) {
        found[e.name] = full;
        targets.delete(e.name);
      }
    }
  }
  return found;
}

function main() {
  ensureRepo();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const wanted = ['exercises.json', 'equipment.json', 'muscles.json'];
  const found = findFiles(REPO_DIR, wanted);
  for (const name of wanted) {
    const src = found[name];
    if (!src) {
      console.warn('Not found in repo:', name);
      continue;
    }
    const dest = path.resolve(OUT_DIR, name);
    fs.copyFileSync(src, dest);
    console.log('Copied', src, '->', dest);
  }
}

main();





