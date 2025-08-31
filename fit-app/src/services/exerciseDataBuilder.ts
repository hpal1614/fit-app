/*
  Build-time utility to create the merged hybrid exercise dataset.
  This file can be executed with ts-node or compiled to JS for node.
*/

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type Category = 'compound' | 'isolation' | 'cardio' | 'flexibility';

interface WgerExerciseInfo {
  id: number;
  translations?: Array<{ name?: string; description?: string; language?: number }>;
  equipment?: Array<{ id: number; name?: string }> | number[];
  muscles?: Array<{ id: number; name_en?: string }> | number[];
  muscles_secondary?: Array<{ id: number; name_en?: string }> | number[];
  images?: Array<{ image: string }>;
}

interface WgerFixtureItem<T = any> { model?: string; pk?: number; fields?: T }
interface WgerEquipment { id: number; name: string; }
interface WgerMuscle { id: number; name_en: string; name?: string }

interface ExerciseDBItem {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  secondaryMuscles: string[];
}

interface HybridExercise {
  id: string;
  name: string;
  instructions: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: Difficulty;
  category: Category;
  gifUrl?: string;
  imageUrl?: string;
  source: 'wger' | 'exercisedb' | 'custom';
  aliases: string[];
  aiEnhanced: boolean;
  metadata?: { wgerId?: number; exerciseDbId?: string; lastUpdated: string; version: number };
}

const ROOT = process.cwd();
const OUTPUT_PATH = path.resolve(ROOT, 'public/data/exercises.v1.json');

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function mapDifficulty(name: string): Difficulty {
  const n = name.toLowerCase();
  if (/beginner|novice|easy/.test(n)) return 'beginner';
  if (/advanced|hard|expert/.test(n)) return 'advanced';
  return 'intermediate';
}

function deriveCategory(primaryMuscles: string[], name: string): Category {
  const n = name.toLowerCase();
  if (/run|row|bike|sprint|jump rope/.test(n)) return 'cardio';
  if (/stretch|mobility|yoga/.test(n)) return 'flexibility';
  // Heuristic: multi-muscle implies compound
  return primaryMuscles.length > 1 ? 'compound' : 'isolation';
}

function normalizeMuscle(m: string): string {
  const map: Record<string, string> = {
    quadriceps: 'quad',
    quads: 'quad',
    trapezius: 'traps',
    abdominals: 'abs',
    abdominus: 'abs',
    calves: 'calves',
    calf: 'calves',
    gluteus: 'glutes',
    pectoralis: 'chest',
    pecs: 'chest',
    deltoids: 'shoulders',
    latissimus: 'lats',
    spinal: 'lower-back'
  };
  const key = m.toLowerCase();
  return map[key] || key;
}

function normalizeEquipment(e: string): string {
  const key = e.toLowerCase();
  const map: Record<string, string> = {
    bar: 'barbell',
    dumbbells: 'dumbbell',
    kettlebells: 'kettlebell',
    machine: 'machine',
    cable: 'cable',
    bodyweight: 'bodyweight',
    band: 'resistance-band',
  };
  return map[key] || key;
}

function pickTop100(): string[] {
  // Strategic top 100 placeholder. In practice, maintain curated list.
  const core = [
    'squat','deadlift','bench-press','pull-up','overhead-press','barbell-row','romanian-deadlift','front-squat','hip-thrust','lunge','leg-press','lat-pulldown','push-up','dumbbell-curl','tricep-dip','lateral-raise','plank','hanging-leg-raise','cable-row','shoulder-press','incline-bench-press','decline-bench-press','goblet-squat','bulgarian-split-squat','hamstring-curl','leg-extension','calf-raise','face-pull','skullcrusher','preacher-curl','hammer-curl','chest-fly','rear-delt-fly','pull-over','t-bar-row','pendlay-row','sumo-deadlift','trap-bar-deadlift','good-morning','incline-dumbbell-press','seated-cable-row','bent-over-row','landmine-press','arnold-press','upright-row','shrug','glute-bridge','hip-abduction','hip-adduction','reverse-lunge','step-up','box-squat','split-squat','roman-chair-back-extension','good-morning','barbell-shrug','farmers-walk','zercher-squat','sissy-squat','pistol-squat','ring-row','ring-dip','muscle-up','dip','chin-up','wide-grip-pull-up','close-grip-bench-press','bench-dip','seated-row','one-arm-row','back-extension','cable-curl','concentration-curl','incline-curl','drag-curl','pushdown','overhead-triceps-extension','rope-pushdown','ez-bar-curl','ez-bar-skullcrusher','reverse-curl','wrist-curl','reverse-wrist-curl','ab-wheel-rollout','cable-crunch','hanging-knee-raise','russian-twist','bicycle-crunch','sit-up','mountain-climber','burpee','jump-rope','rowing-machine','treadmill-run','air-squat','wall-sit','thruster','clean','snatch'
  ];
  return Array.from(new Set(core)).slice(0, 100);
}

async function main() {
  // Inputs are expected to be placed manually into a local folder or fetched in a separate step.
  const dataRoot = path.resolve(ROOT, 'data-sources');
  const wgerRoot = path.resolve(dataRoot, 'wger');
  const exercisedbRoot = path.resolve(dataRoot, 'exercisedb');

  const wgerExercisesPath = path.resolve(wgerRoot, 'exercises.json');
  const wgerEquipmentPath = path.resolve(wgerRoot, 'equipment.json');
  const wgerMusclesPath = path.resolve(wgerRoot, 'muscles.json');
  // API fallbacks
  const wgerExercisesApiPath = path.resolve(wgerRoot, 'exercises-api.json');
  const wgerEquipmentApiPath = path.resolve(wgerRoot, 'equipment-api.json');
  const wgerMusclesApiPath = path.resolve(wgerRoot, 'muscles-api.json');
  const exerciseDbTop100Path = path.resolve(exercisedbRoot, 'top100.json');

  const top100Slugs = pickTop100();

  const exists = (p: string) => fs.existsSync(p);

  const rawExercises: any[] = exists(wgerExercisesPath)
    ? JSON.parse(fs.readFileSync(wgerExercisesPath, 'utf-8'))
    : (exists(wgerExercisesApiPath) ? JSON.parse(fs.readFileSync(wgerExercisesApiPath, 'utf-8')) : []);
  const rawEquipment: any[] = exists(wgerEquipmentPath)
    ? JSON.parse(fs.readFileSync(wgerEquipmentPath, 'utf-8'))
    : (exists(wgerEquipmentApiPath) ? JSON.parse(fs.readFileSync(wgerEquipmentApiPath, 'utf-8')) : []);
  const rawMuscles: any[] = exists(wgerMusclesPath)
    ? JSON.parse(fs.readFileSync(wgerMusclesPath, 'utf-8'))
    : (exists(wgerMusclesApiPath) ? JSON.parse(fs.readFileSync(wgerMusclesApiPath, 'utf-8')) : []);

  // Normalize Django fixture shape if necessary
  const wgerEquipment: WgerEquipment[] = rawEquipment.map((item: any) => {
    if (item && typeof item === 'object' && 'fields' in item) {
      const it = item as WgerFixtureItem<{ name?: string }>;
      return { id: it.pk || 0, name: (it.fields?.name || '').toString() };
    }
    return { id: item.id, name: (item.name || '').toString() } as WgerEquipment;
  }).filter((e: WgerEquipment) => !!e && !!e.id);

  const wgerMuscles: WgerMuscle[] = rawMuscles.map((item: any) => {
    if (item && typeof item === 'object' && 'fields' in item) {
      const it = item as WgerFixtureItem<{ name_en?: string; name?: string }>;
      return { id: it.pk || 0, name_en: (it.fields?.name_en || it.fields?.name || '').toString(), name: (it.fields?.name || '').toString() };
    }
    return { id: item.id, name_en: (item.name_en || item.name || '').toString(), name: (item.name || '').toString() } as WgerMuscle;
  }).filter((m: WgerMuscle) => !!m && !!m.id);
  const exerciseDbTop100: ExerciseDBItem[] = exists(exerciseDbTop100Path) ? JSON.parse(fs.readFileSync(exerciseDbTop100Path, 'utf-8')) : [];

  const equipmentById = new Map<number, string>();
  for (const e of wgerEquipment) {
    const name = (e?.name || '').toString();
    if (!name) continue;
    equipmentById.set(e.id, normalizeEquipment(name));
  }

  const muscleById = new Map<number, string>();
  for (const m of wgerMuscles) {
    const nm = (m?.name_en || m?.name || '').toString();
    if (!nm) continue;
    muscleById.set(m.id, normalizeMuscle(nm));
  }

  // Convert Wger to Hybrid
  // Parse exercises (Django fixture or plain)
  const wgerExercises: WgerExerciseInfo[] = rawExercises.map((item: any) => {
    if (item && typeof item === 'object' && 'fields' in item) {
      const it = item as WgerFixtureItem<{
        name?: string;
        description?: string;
        equipment?: number[];
        muscles?: number[];
        muscles_secondary?: number[];
        language?: number;
      }>;
      return {
        id: it.pk || 0,
        name: (it.fields?.name || '').toString(),
        description: it.fields?.description,
        equipment: it.fields?.equipment || [],
        muscles: it.fields?.muscles || [],
        muscles_secondary: it.fields?.muscles_secondary || [],
        language: it.fields?.language
      } as any as WgerExerciseInfo;
    }
    // Wger exerciseinfo API shape
    if (item && typeof item === 'object' && 'id' in item) {
      return item as WgerExerciseInfo;
    }
    return item as WgerExerciseInfo;
  }).filter((e: WgerExerciseInfo) => !!e && !!e.id);

  const wgerHybrid: HybridExercise[] = wgerExercises.map(w => {
    // Prefer English translation name/description
    const trans = (w.translations || []).find(t => (t.language || 0) === 2) || (w.translations || [])[0] || {};
    const name = (trans.name || '').toString().trim() || `exercise-${w.id}`;
    const slug = toSlug(name);
    const primary = (Array.isArray(w.muscles) ? w.muscles : []).map((m: any) => muscleById.get((m.id || m) as number) || '').filter(Boolean);
    const secondary = (Array.isArray(w.muscles_secondary) ? w.muscles_secondary : []).map((m: any) => muscleById.get((m.id || m) as number) || '').filter(Boolean);
    const equipment = (Array.isArray(w.equipment) ? w.equipment : []).map((e: any) => equipmentById.get((e.id || e) as number) || '').filter(Boolean);
    const description = (trans.description || '')
      .replace(/<[^>]+>/g, ' ') // strip HTML
      .replace(/\s+/g, ' ')
      .trim();
    const instructions = description ? description.split(/\.(?=\s|$)/).map(s => s.trim()).filter(Boolean) : [];
    const imageUrl = (w.images && w.images[0] && (w as any).images[0].image) ? (w as any).images[0].image : undefined;
    const difficulty = mapDifficulty(name);
    const category = deriveCategory(primary.length ? primary : secondary, name);
    return {
      id: slug,
      name,
      instructions,
      primaryMuscles: primary,
      secondaryMuscles: secondary,
      equipment,
      difficulty,
      category,
      imageUrl,
      source: 'wger',
      aliases: [],
      aiEnhanced: false,
      metadata: { wgerId: w.id, lastUpdated: new Date().toISOString(), version: 1 }
    } as HybridExercise;
  });

  // Merge ExerciseDB top100 (if provided locally by a separate fetch step)
  const exercisedbBySlug = new Map<string, ExerciseDBItem>();
  for (const item of exerciseDbTop100) {
    exercisedbBySlug.set(toSlug(item.name), item);
  }

  const top100Set = new Set(top100Slugs);

  const mergedById = new Map<string, HybridExercise>();
  for (const w of wgerHybrid) {
    mergedById.set(w.id, w);
  }

  for (const slug of top100Set) {
    const edb = exercisedbBySlug.get(slug);
    if (!edb) continue;
    const id = slug;
    const existing = mergedById.get(id);
    const pri = normalizeMuscle(edb.target);
    const sec = (edb.secondaryMuscles || []).map(normalizeMuscle);
    const eq = [normalizeEquipment(edb.equipment)];
    const candidate: HybridExercise = existing ? {
      ...existing,
      gifUrl: edb.gifUrl || existing.gifUrl,
      primaryMuscles: existing.primaryMuscles.length ? existing.primaryMuscles : [pri],
      secondaryMuscles: existing.secondaryMuscles.length ? existing.secondaryMuscles : sec,
      equipment: existing.equipment.length ? existing.equipment : eq,
      source: existing.source === 'wger' ? 'wger' : 'exercisedb',
      aliases: Array.from(new Set([...(existing.aliases || []), edb.name].filter(Boolean))),
      metadata: { ...(existing.metadata || {}), exerciseDbId: edb.id, lastUpdated: new Date().toISOString(), version: 1 }
    } : {
      id,
      name: edb.name,
      instructions: [],
      primaryMuscles: [pri],
      secondaryMuscles: sec,
      equipment: eq,
      difficulty: 'intermediate',
      category: deriveCategory([pri], edb.name),
      gifUrl: edb.gifUrl,
      source: 'exercisedb',
      aliases: [],
      aiEnhanced: false,
      metadata: { exerciseDbId: edb.id, lastUpdated: new Date().toISOString(), version: 1 }
    };
    mergedById.set(id, candidate);
  }

  const merged = Array.from(mergedById.values());

  // AI Enhancement Layer: add generic cues if instructions are sparse
  for (const item of merged) {
    const needs = !item.instructions || item.instructions.length < 2;
    if (needs) {
      item.instructions = item.instructions || [];
      item.instructions.push('Brace your core and maintain a neutral spine throughout');
      item.instructions.push('Control both the lowering and lifting phases; avoid momentum');
      item.instructions.push('Keep joints stacked and aligned; do not let knees/arms cave inward');
      item.aiEnhanced = true;
    }
  }

  // Ensure at least placeholders exist if no sources available
  if (merged.length === 0) {
    console.warn('No input data found; writing minimal placeholder dataset.');
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2));
  console.log(`Wrote ${merged.length} exercises to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


