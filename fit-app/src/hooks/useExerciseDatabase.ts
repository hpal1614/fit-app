import { useEffect, useMemo, useState } from 'react';
import ExerciseDatabaseService, { ExerciseDatabaseService as Service } from '../services/exerciseDatabaseService';
import type { ExerciseRecord } from '../types/exerciseDatabase';

export function useExerciseDatabase() {
  const [service] = useState<Service>(() => ExerciseDatabaseService.getInstance());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    service.initialize().then(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, [service]);

  return useMemo(() => ({
    ready,
    searchByName: (q: string) => service.searchByName(q),
    searchByMuscle: (m: string) => service.searchByMuscle(m),
    searchByEquipment: (e: string) => service.searchByEquipment(e),
    getById: (id: string) => service.getExerciseById(id),
    getSimilar: (id: string) => service.getSimilarExercises(id),
    findSimilarWithGif: (id: string) => service.findSimilarExerciseWithGif(id),
    getCachedGifUrl: (id: string) => service.getCachedGifUrl(id)
  }), [ready, service]);
}

export type { ExerciseRecord };





