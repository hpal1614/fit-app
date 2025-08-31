import { useEffect, useMemo, useState } from 'react';
import { useExerciseDatabase, type ExerciseRecord } from '../hooks/useExerciseDatabase';

interface Props {
  onSelect?: (exercise: ExerciseRecord) => void;
}

export default function ExerciseSearch({ onSelect }: Props) {
  const { ready, searchByName } = useExerciseDatabase();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExerciseRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!ready || !query.trim()) { setResults([]); return; }
      const res = await searchByName(query);
      if (!cancelled) setResults(res);
    }
    run();
    return () => { cancelled = true; };
  }, [query, ready, searchByName]);

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={ready ? 'Search exercises…' : 'Loading database…'}
        className="border rounded px-3 py-2"
        disabled={!ready}
      />
      <div className="max-h-80 overflow-auto border rounded">
        {results.map(ex => (
          <button key={ex.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3" onClick={() => onSelect?.(ex)}>
            <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {ex.gifUrl ? (
                <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-xs text-gray-500">No GIF</span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{ex.name}</div>
              <div className="text-xs text-gray-500">{ex.primaryMuscles.join(', ')} • {ex.equipment.join(', ')}</div>
            </div>
          </button>
        ))}
        {ready && query && results.length === 0 && (
          <div className="p-3 text-sm text-gray-500">No results</div>
        )}
      </div>
    </div>
  );
}





