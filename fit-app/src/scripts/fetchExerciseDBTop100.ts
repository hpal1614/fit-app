/*
  Optional: fetch ExerciseDB top 100 exercises and store locally.
  Requires RapidAPI key in env: EXERCISEDB_RAPIDAPI_KEY
*/

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT = path.resolve(ROOT, 'data-sources/exercisedb/top100.json');
const KEY = process.env.EXERCISEDB_RAPIDAPI_KEY;

async function getTargets(): Promise<string[]> {
  const res = await fetch('https://exercisedb.p.rapidapi.com/exercises/targetList', {
    headers: {
      'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
      'x-rapidapi-key': KEY || ''
    }
  });
  if (!res.ok) throw new Error(`targetList ${res.status}`);
  return res.json();
}

async function searchByName(name: string) {
  const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
      'x-rapidapi-key': KEY || ''
    }
  });
  if (!res.ok) throw new Error(`name search ${res.status}`);
  return res.json();
}

function top100List(): string[] {
  return [
    'squat', 'deadlift', 'bench press', 'pull up', 'overhead press', 'barbell row', 'romanian deadlift', 'front squat', 'hip thrust', 'lunge', 'leg press', 'lat pulldown', 'push up', 'dumbbell curl', 'tricep dip', 'lateral raise', 'plank', 'hanging leg raise', 'seated cable row', 'shoulder press', 'incline bench press', 'decline bench press', 'goblet squat', 'bulgarian split squat', 'hamstring curl', 'leg extension', 'calf raise', 'face pull', 'skullcrusher', 'preacher curl', 'hammer curl', 'chest fly', 'rear delt fly', 'pull over', 't bar row', 'pendlay row', 'sumo deadlift', 'trap bar deadlift', 'good morning', 'incline dumbbell press', 'landmine press', 'arnold press', 'upright row', 'shrug', 'glute bridge', 'hip abduction', 'hip adduction', 'reverse lunge', 'step up', 'box squat', 'split squat', 'roman chair back extension', 'barbell shrug', 'farmer walk', 'zercher squat', 'sissy squat', 'pistol squat', 'ring row', 'ring dip', 'muscle up', 'dip', 'chin up', 'wide grip pull up', 'close grip bench press', 'bench dip', 'seated row', 'one arm row', 'back extension', 'cable curl', 'concentration curl', 'incline curl', 'drag curl', 'pushdown', 'overhead triceps extension', 'rope pushdown', 'ez bar curl', 'ez bar skullcrusher', 'reverse curl', 'wrist curl', 'reverse wrist curl', 'ab wheel rollout', 'cable crunch', 'hanging knee raise', 'russian twist', 'bicycle crunch', 'sit up', 'mountain climber', 'burpee', 'jump rope', 'rowing machine', 'treadmill run', 'air squat', 'wall sit', 'thruster', 'clean', 'snatch'
  ];
}

async function main() {
  if (!KEY) {
    console.error('Missing EXERCISEDB_RAPIDAPI_KEY; skipping fetch.');
    process.exit(0);
  }

  const names = top100List();
  const out: any[] = [];
  for (const name of names) {
    try {
      const res = await searchByName(name);
      if (Array.isArray(res) && res.length > 0) {
        // Pick the best match
        const match = res[0];
        out.push({
          id: match.id,
          name: match.name,
          equipment: match.equipment,
          gifUrl: match.gifUrl,
          target: match.target,
          secondaryMuscles: match.secondaryMuscles || []
        });
        console.log('Fetched', match.name);
      } else {
        console.warn('No match for', name);
      }
    } catch (e) {
      console.warn('Failed', name, e);
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('Wrote', OUT);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});





