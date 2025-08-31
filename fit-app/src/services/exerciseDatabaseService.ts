import Dexie, { type Table } from 'dexie';
import type {
  ExerciseRecord,
  ExerciseDatabaseMeta,
  MediaCacheRecord
} from '../types/exerciseDatabase';

const DATASET_VERSION = 1;
const DATASET_PATH = '/data/exercises.v1.json';

export class ExerciseHybridDB extends Dexie {
  exercises!: Table<ExerciseRecord>;
  media!: Table<MediaCacheRecord>;
  meta!: Table<ExerciseDatabaseMeta>;

  constructor() {
    super('ExerciseHybridDB');
    this.version(1).stores({
      // MultiEntry indexes (*) enable fast lookups for arrays
      exercises: 'id, name, searchName, category, aiEnhanced, primaryMuscles*, secondaryMuscles*, equipment*, searchAliases*',
      media: 'id, exerciseId, type, updatedAt',
      meta: 'id, version, seededAt'
    });
  }
}

export class ExerciseDatabaseService {
  private static instance: ExerciseDatabaseService;
  private db: ExerciseHybridDB;
  private initialized = false;

  private constructor() {
    this.db = new ExerciseHybridDB();
  }

  static getInstance(): ExerciseDatabaseService {
    if (!ExerciseDatabaseService.instance) {
      ExerciseDatabaseService.instance = new ExerciseDatabaseService();
    }
    return ExerciseDatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.db.open();

    const meta = await this.db.meta.get('meta');
    if (!meta || meta.version < DATASET_VERSION) {
      await this.seedFromDataset();
    }
    this.initialized = true;
  }

  private normalizeExercise(ex: ExerciseRecord): ExerciseRecord {
    return {
      ...ex,
      id: ex.id,
      name: ex.name.trim(),
      aliases: ex.aliases?.map(a => a.trim()) || [],
      searchName: ex.name.toLowerCase(),
      primaryMuscles: ex.primaryMuscles.map(m => m.toLowerCase()),
      secondaryMuscles: ex.secondaryMuscles.map(m => m.toLowerCase()),
      equipment: ex.equipment.map(e => e.toLowerCase()),
      searchAliases: (ex.aliases || []).map(a => a.toLowerCase()),
      metadata: {
        ...(ex.metadata || {}),
        lastUpdated: new Date().toISOString(),
        version: DATASET_VERSION
      }
    };
  }

  private async seedFromDataset(): Promise<void> {
    try {
      // Try primary path, then fallbacks for different hosting roots
      const paths = [
        DATASET_PATH,
        '/fit-app/public/data/exercises.v1.json',
        '/fit-app/fit-app/public/data/exercises.v1.json'
      ];
      let payload: ExerciseRecord[] | null = null;
      for (const path of paths) {
        try {
          const r = await fetch(path, { cache: 'no-cache' });
          if (r.ok) {
            payload = await r.json();
            break;
          }
        } catch {}
      }
      if (!payload) throw new Error('Failed to fetch dataset from all known paths');

      const normalized = payload.map(ex => this.normalizeExercise(ex));

      await this.db.transaction('rw', this.db.exercises, this.db.meta, async () => {
        await this.db.exercises.clear();
        await this.db.exercises.bulkPut(normalized);
        await this.db.meta.put({ id: 'meta', version: DATASET_VERSION, seededAt: new Date().toISOString(), datasetUrl: DATASET_PATH });
      });
    } catch (error) {
      console.error('ExerciseDatabaseService.seedFromDataset error', error);
    }
  }

  // Search APIs
  async searchByName(query: string, limit: number = 50): Promise<ExerciseRecord[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Prefer indexed search for speed
    const nameMatches = await this.db.exercises.where('searchName').startsWith(q).limit(limit).toArray();
    if (nameMatches.length >= limit) {
      return nameMatches.sort((a, b) => Number(!!b.gifUrl) - Number(!!a.gifUrl));
    }
    const aliasMatches = await this.db.exercises.where('searchAliases').startsWith(q).limit(limit - nameMatches.length).toArray();
    const merged = [...nameMatches, ...aliasMatches];
    // Fallback: partial include filter if still few results
    if (merged.length < 10) {
      const more = await this.db.exercises
        .filter(e => e.searchName?.includes(q) || (e.searchAliases || []).some(a => a.includes(q)))
        .limit(limit)
        .toArray();
      for (const m of more) if (!merged.find(x => x.id === m.id)) merged.push(m);
    }
    const unique = Array.from(new Map(merged.map(x => [x.id, x])).values());
    const results = unique.slice(0, limit);
    // Prioritize exercises with GIFs
    return results.sort((a, b) => Number(!!b.gifUrl) - Number(!!a.gifUrl));
  }

  async searchByMuscle(muscle: string, limit: number = 100): Promise<ExerciseRecord[]> {
    const m = muscle.toLowerCase();
    // Use multiEntry indexes
    const primary = await this.db.exercises.where('primaryMuscles').equals(m).limit(limit).toArray();
    if (primary.length >= limit) return primary.sort((a, b) => Number(!!b.gifUrl) - Number(!!a.gifUrl));
    const secondary = await this.db.exercises.where('secondaryMuscles').equals(m).limit(limit - primary.length).toArray();
    const merged = [...primary, ...secondary];
    const unique = Array.from(new Map(merged.map(x => [x.id, x])).values());
    const results = unique.slice(0, limit);
    return results.sort((a, b) => Number(!!b.gifUrl) - Number(!!a.gifUrl));
  }

  async searchByEquipment(equipment: string, limit: number = 100): Promise<ExerciseRecord[]> {
    const eq = equipment.toLowerCase();
    const results = await this.db.exercises.where('equipment').equals(eq).limit(limit).toArray();
    return results.sort((a, b) => Number(!!b.gifUrl) - Number(!!a.gifUrl));
  }

  async getExerciseById(id: string): Promise<ExerciseRecord | undefined> {
    return await this.db.exercises.get(id);
  }

  async getSimilarExercises(exerciseId: string, limit: number = 10): Promise<ExerciseRecord[]> {
    const base = await this.getExerciseById(exerciseId);
    if (!base) return [];
    const primary = new Set(base.primaryMuscles.map(m => m.toLowerCase()));
    const secondary = new Set(base.secondaryMuscles.map(m => m.toLowerCase()));
    const equip = new Set(base.equipment.map(e => e.toLowerCase()));

    const results = await this.db.exercises
      .filter(e => {
        if (e.id === base.id) return false;
        const sharedMuscles = e.primaryMuscles.some(m => primary.has(m.toLowerCase())) || e.secondaryMuscles.some(m => secondary.has(m.toLowerCase()));
        const sharedEquip = e.equipment.some(eq => equip.has(eq.toLowerCase()));
        return sharedMuscles || sharedEquip;
      })
      .limit(100)
      .toArray();

    // Rank: GIF first, then primary muscle overlap, then equipment overlap
    return results
      .map(e => ({
        ex: e,
        score:
          (e.gifUrl ? 3 : 0) +
          e.primaryMuscles.filter(m => primary.has(m.toLowerCase())).length * 2 +
          e.secondaryMuscles.filter(m => secondary.has(m.toLowerCase())).length +
          (e.equipment.some(eq => equip.has(eq.toLowerCase())) ? 1 : 0)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.ex);
  }

  async findSimilarExerciseWithGif(exerciseId: string): Promise<ExerciseRecord | undefined> {
    const base = await this.getExerciseById(exerciseId);
    if (!base) return undefined;
    if (base.gifUrl) return base;
    const sims = await this.getSimilarExercises(exerciseId, 20);
    return sims.find(e => !!e.gifUrl);
  }

  // Media cache APIs for offline GIF access
  async cacheGif(exerciseId: string, url: string): Promise<void> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`GIF fetch failed ${res.status}`);
      const contentType = res.headers.get('content-type') || 'image/gif';
      const blob = await res.blob();
      const rec: MediaCacheRecord = {
        id: `${exerciseId}:gif`,
        exerciseId,
        type: 'gif',
        mimeType: contentType,
        blob,
        updatedAt: new Date().toISOString()
      };
      await this.db.media.put(rec);
    } catch (err) {
      console.warn('cacheGif failed', err);
    }
  }

  async getCachedGifUrl(exerciseId: string): Promise<string | undefined> {
    const rec = await this.db.media.get(`${exerciseId}:gif`);
    if (!rec) return undefined;
    return URL.createObjectURL(rec.blob);
  }
}

export default ExerciseDatabaseService;


