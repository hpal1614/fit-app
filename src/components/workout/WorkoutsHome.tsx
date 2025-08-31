import React, { useEffect, useMemo, useState } from 'react';
import TemplateSelector from '../finalUI/TemplateSelector';
import { BeautifulWorkoutCard } from '../finalUI/BeautifulWorkoutCard';
import { getWorkoutService } from '../../services/workoutService';
import { PDFWorkoutUploader } from './PDFWorkoutUploader';

// Lightweight prop interfaces aligned with FinalUI to reuse existing hooks/services
interface WorkoutLogger {
  isWorkoutActive: boolean;
  workoutDurationFormatted: string;
  currentExercise: any;
  startWorkout: (templateId?: string) => Promise<any>;
  endWorkout: () => Promise<any>;
  isResting: boolean;
  stopRestTimer: () => void;
  startRestTimer: () => void;
  getWorkoutTemplates: () => Promise<any[]>;
}

interface VoiceRecognition {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  toggleListening: () => void;
  speak: (text: string) => void;
}

interface AICoach {
  getMotivation: (context: any) => Promise<any>;
}

interface WorkoutsHomeProps {
  workoutLogger: WorkoutLogger;
  voiceRecognition: VoiceRecognition;
  aiCoach: AICoach;
}

export const WorkoutsHome: React.FC<WorkoutsHomeProps> = ({ workoutLogger, voiceRecognition, aiCoach }) => {
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [showBeautifulWorkoutCard, setShowBeautifulWorkoutCard] = useState(false);

  // Sub-tabs within Workouts
  type SubTab = 'start' | 'history' | 'stats' | 'prs';
  const [subTab, setSubTab] = useState<SubTab>('start');

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [totalWorkoutSets, setTotalWorkoutSets] = useState(0);
  const [completedWorkoutSets, setCompletedWorkoutSets] = useState(0);
  const [completedSetsPerExercise, setCompletedSetsPerExercise] = useState<{ [exerciseId: string]: number }>({});

  // History and Stats state
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [prQuery, setPrQuery] = useState('');
  const [prResults, setPrResults] = useState<any[]>([]);
  const [selectedExerciseForPR, setSelectedExerciseForPR] = useState<any | null>(null);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  // Inline template library state
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [favoriteTemplateIds, setFavoriteTemplateIds] = useState<string[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState<any | null>(null);

  // Inline AI builder state
  const [aiName, setAiName] = useState('Custom Program');
  const [aiDifficulty, setAiDifficulty] = useState<'beginner'|'intermediate'|'advanced'>('intermediate');
  const [aiGoal, setAiGoal] = useState<'build-muscle'|'lose-weight'|'increase-strength'|'general-fitness'>('build-muscle');
  const [aiEquipment, setAiEquipment] = useState<'gym'|'home'|'mixed'>('gym');
  const [aiDays, setAiDays] = useState(4);
  const [aiTimePerSession, setAiTimePerSession] = useState(60);

  // Load templates on mount
  useEffect(() => {
    const load = async () => {
      setIsLoadingTemplates(true);
      try {
        const svc = getWorkoutService();
        await svc.initializeDefaultTemplates();
        const list = await svc.getWorkoutTemplates();
        setTemplates(list);
        // Load favorites
        const fav = localStorage.getItem('favoriteTemplateIds');
        if (fav) setFavoriteTemplateIds(JSON.parse(fav));
        // Load overview metrics
        const m = await svc.getProgressMetrics();
        setOverviewMetrics(m);
        // Load recent history (for "recently used")
        const h = await svc.getWorkoutHistory(10);
        setHistory(h);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    load();
  }, []);

  // Load history/metrics when switching tabs
  useEffect(() => {
    const svc = getWorkoutService();
    if (subTab === 'history') {
      svc.getWorkoutHistory(100).then(setHistory).catch(console.error);
    } else if (subTab === 'stats') {
      svc.getProgressMetrics().then(setMetrics).catch(console.error);
    }
  }, [subTab]);

  // Search exercises for PRs
  useEffect(() => {
    const svc = getWorkoutService();
    if (subTab === 'prs' && prQuery.trim().length > 1) {
      svc.searchExercises(prQuery).then(setPrResults).catch(console.error);
    } else if (subTab === 'prs') {
      setPrResults([]);
    }
  }, [subTab, prQuery]);

  // Build a friendly status text
  const workoutStatusText = useMemo(() => {
    if (workoutLogger.isWorkoutActive) return `Workout in progress · ${workoutLogger.workoutDurationFormatted}`;
    return 'No active workout';
  }, [workoutLogger.isWorkoutActive, workoutLogger.workoutDurationFormatted]);

  const mapTemplateExercises = (template: any) => {
    const exercises = (template?.exercises || []).map((ex: any, index: number) => ({
      id: ex.exerciseId || `exercise-${index}`,
      name: ex.exercise?.name || ex.exerciseId || `Exercise ${index + 1}`,
      sets: ex.targetSets || 3,
      reps: ex.targetReps || 10,
      restTime: ex.restTime || 90,
      notes: ex.notes || '',
      targetSets: ex.targetSets || 3,
      targetReps: ex.targetReps || 10
    }));

    setWorkoutExercises(exercises);
    const totalSets = exercises.reduce((total: number, ex: any) => total + (ex.targetSets || ex.sets || 3), 0);
    setTotalWorkoutSets(totalSets);
    setCompletedWorkoutSets(0);
    setCompletedSetsPerExercise({});

    if (exercises.length > 0) {
      const first = exercises[0];
      setCurrentExercise({
        id: first.id,
        name: first.name,
        sets: first.sets || first.targetSets || 3,
        reps: first.reps || first.targetReps || 10,
        restTime: first.restTime || 90,
        notes: first.notes || ''
      });
      setCurrentExerciseIndex(0);
      setShowBeautifulWorkoutCard(true);
    }
  };

  const handleTemplateSelect = async (template: any) => {
    try {
      await workoutLogger.startWorkout(template?.id);
      mapTemplateExercises(template);
      setIsTemplateSelectorOpen(false);
      if (voiceRecognition?.speak) voiceRecognition.speak(`Starting ${template?.name || 'workout'}! Let's go!`);
    } catch (err) {
      console.error('Failed to start workout from template:', err);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const completed = await workoutLogger.endWorkout();
      if (completed && voiceRecognition?.speak) voiceRecognition.speak('Great workout! Nice job finishing.');
      setShowBeautifulWorkoutCard(false);
    } catch (err) {
      console.error('Failed to complete workout:', err);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      const next = workoutExercises[nextIndex];
      setCurrentExercise({
        id: next.id,
        name: next.name,
        sets: next.sets || next.targetSets || 3,
        reps: next.reps || next.targetReps || 10,
        restTime: next.restTime || 90,
        notes: next.notes || ''
      });
      setCurrentExerciseIndex(nextIndex);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1;
      const prev = workoutExercises[prevIndex];
      setCurrentExercise({
        id: prev.id,
        name: prev.name,
        sets: prev.sets || prev.targetSets || 3,
        reps: prev.reps || prev.targetReps || 10,
        restTime: prev.restTime || 90,
        notes: prev.notes || ''
      });
      setCurrentExerciseIndex(prevIndex);
    }
  };

  const handleSetCompleted = (exerciseId: string, completedSets: number) => {
    setCompletedSetsPerExercise(prev => {
      const updated = { ...prev, [exerciseId]: completedSets };
      const totalCompleted = Object.values(updated).reduce((sum, count) => sum + count, 0);
      setCompletedWorkoutSets(totalCompleted);
      return updated;
    });
  };

  const toggleFavorite = (templateId: string) => {
    setFavoriteTemplateIds(prev => {
      const next = prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      localStorage.setItem('favoriteTemplateIds', JSON.stringify(next));
      return next;
    });
  };

  const favoriteTemplates = templates.filter(t => favoriteTemplateIds.includes(t.id));
  const recentTemplateIds = Array.from(new Set((history || [])
    .map((w: any) => w.workoutTemplateId)
    .filter(Boolean)));
  const recentTemplates = templates.filter(t => recentTemplateIds.includes(t.id)).slice(0, 6);
  const weeklyTarget = 3;
  const workoutsPerWeek = overviewMetrics?.frequencyMetrics?.workoutsPerWeek ?? 0;
  const weeklyProgressPct = Math.min(100, Math.round((workoutsPerWeek / weeklyTarget) * 100));

  const reloadTemplates = async () => {
    try {
      const svc = getWorkoutService();
      const list = await svc.getWorkoutTemplates();
      setTemplates(list);
    } catch (e) {
      console.error(e);
    }
  };

  const createAiTemplate = async (startNow: boolean) => {
    const template: any = {
      id: `ai-${Date.now()}`,
      name: aiName || 'Custom Program',
      description: `${aiDays} day program focused on ${aiGoal}. ${aiDifficulty} level, ${aiTimePerSession} min sessions.`,
      category: aiGoal === 'build-muscle' ? 'strength' : aiGoal === 'lose-weight' ? 'weight-loss' : aiGoal === 'increase-strength' ? 'strength' : 'general-fitness',
      difficulty: aiDifficulty,
      estimatedDuration: aiTimePerSession,
      type: 'ai',
      exercises: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const svc = getWorkoutService();
    await svc.saveWorkoutTemplate(template);
    await reloadTemplates();
    if (startNow) {
      mapTemplateExercises(template);
      try { await workoutLogger.startWorkout(template.id); } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Workouts</h2>
          <p className="text-sm text-gray-400 mt-1">{workoutStatusText}</p>
        </div>
        <div className="flex items-center gap-2">
          {workoutLogger.isWorkoutActive ? (
            <>
              <button
                onClick={handleCompleteWorkout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                End Workout
              </button>
              {workoutLogger.isResting ? (
                <button
                  onClick={workoutLogger.stopRestTimer}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Stop Timer
                </button>
              ) : (
                <button
                  onClick={workoutLogger.startRestTimer}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Start Rest
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Sub-tab selector */}
      <div className="mt-6 flex gap-2 overflow-auto">
        {([
          { k: 'start', label: 'Start' },
          { k: 'history', label: 'History' },
          { k: 'stats', label: 'Stats' },
          { k: 'prs', label: 'PRs' },
        ] as { k: SubTab; label: string }[]).map(t => (
          <button
            key={t.k}
            onClick={() => setSubTab(t.k)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              subTab === t.k ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-800/60 border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === 'start' && (
        <>
          {/* Hero */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-lime-600/20 via-lime-500/10 to-transparent border border-white/10 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-lime-300">Weekly Goal</div>
                  <div className="mt-1 text-2xl font-bold text-white">{workoutsPerWeek}/{weeklyTarget} sessions</div>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/10 grid place-items-center">
                  <div className="text-lime-300 text-sm font-semibold">{weeklyProgressPct}%</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-300">Keep the streak alive. A quick session counts.</div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setIsTemplateSelectorOpen(true)}
                  className="px-4 py-2 bg-lime-500 text-black rounded-lg text-sm font-semibold hover:bg-lime-400"
                >
                  Start a Quick Workout
                </button>
                <button
                  onClick={async () => {
                    const tip = await aiCoach.getMotivation(workoutLogger.getWorkoutContext());
                    if (tip && voiceRecognition?.speak) voiceRecognition.speak(tip);
                  }}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium border border-white/10 hover:bg-white/20"
                >
                  Ask Coach
                </button>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-gray-800/60 border border-white/10">
              <div className="text-sm text-gray-300">Last Workout</div>
              <div className="mt-1 text-white font-semibold">{history?.[0]?.name || '—'}</div>
              <div className="text-xs text-gray-400 mt-1">{history?.[0]?.date ? new Date(history[0].date).toLocaleString() : 'No sessions yet'}</div>
              {history?.[0]?.workoutTemplateId && (
                <button
                  onClick={() => handleTemplateSelect(templates.find(t => t.id === history[0].workoutTemplateId))}
                  className="mt-3 px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs border border-white/10 hover:bg-white/20"
                >
                  Repeat Last
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[{ label: 'Full Body 45', id: 'quick-full-body' }, { label: 'Upper Strength', id: 'quick-upper' }, { label: 'Lower Strength', id: 'quick-lower' }, { label: 'Push Day', id: 'quick-push' }].map((q) => (
              <button
                key={q.id}
                onClick={() => setIsTemplateSelectorOpen(true)}
                className="p-4 rounded-xl bg-gray-800/60 border border-white/10 text-left hover:bg-gray-700/60 transition-all"
              >
                <div className="text-sm text-gray-300">Suggested</div>
                <div className="text-white font-semibold">{q.label}</div>
              </button>
            ))}
          </div>

          {/* Inline AI Builder */}
          <div className="mt-6 p-4 rounded-xl bg-gray-800/60 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Build with AI</div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Goal</label>
                <select value={aiGoal} onChange={(e) => setAiGoal(e.target.value as any)} className="w-full px-3 py-2 bg-gray-900/60 border border-white/10 rounded-lg text-white text-sm">
                  <option value="build-muscle">Build Muscle</option>
                  <option value="increase-strength">Increase Strength</option>
                  <option value="lose-weight">Lose Weight</option>
                  <option value="general-fitness">General Fitness</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as any)} className="w-full px-3 py-2 bg-gray-900/60 border border-white/10 rounded-lg text-white text-sm">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Equipment</label>
                <select value={aiEquipment} onChange={(e) => setAiEquipment(e.target.value as any)} className="w-full px-3 py-2 bg-gray-900/60 border border-white/10 rounded-lg text-white text-sm">
                  <option value="gym">Gym</option>
                  <option value="home">Home</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Days / Week</label>
                <input type="number" min={1} max={7} value={aiDays} onChange={(e) => setAiDays(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-gray-900/60 border border-white/10 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Time / Session (min)</label>
                <select value={aiTimePerSession} onChange={(e) => setAiTimePerSession(parseInt(e.target.value))} className="w-full px-3 py-2 bg-gray-900/60 border border-white/10 rounded-lg text-white text-sm">
                  {[30,45,60,75,90].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Program Name</label>
                <input value={aiName} onChange={(e) => setAiName(e.target.value)} placeholder="e.g., Strong in 6 Weeks" className="w-full px-3 py-2 bg-gray-900/60 border border-white/10 rounded-lg text-white text-sm" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => createAiTemplate(false)} className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm border border-white/10 hover:bg-white/20">Create Program</button>
              <button onClick={() => createAiTemplate(true)} className="px-4 py-2 bg-lime-500 text-black rounded-lg text-sm font-semibold hover:bg-lime-400">Create & Start</button>
            </div>
          </div>

          {/* Inline PDF Upload */}
          <div className="mt-4 p-4 rounded-xl bg-gray-800/60 border border-white/10">
            <div className="text-sm text-gray-300 mb-2">Upload Workout PDF</div>
            <PDFWorkoutUploader
              onUpload={async (stored: any) => {
                const mapped: any = {
                  id: stored.id || `tpl-${Date.now()}`,
                  name: stored.name || 'Imported Plan',
                  description: stored.description || '',
                  category: stored.category || 'strength',
                  difficulty: stored.difficulty || 'intermediate',
                  estimatedTime: stored.estimatedTime || 45,
                  exercises: stored.exercises || []
                };
                try {
                  const svc = getWorkoutService();
                  await svc.saveWorkoutTemplate({ ...mapped, estimatedDuration: mapped.estimatedTime, type: 'uploaded', createdAt: new Date(), updatedAt: new Date() });
                  await reloadTemplates();
                } catch (e) { console.error(e); }
                mapTemplateExercises(mapped);
                try { await workoutLogger.startWorkout(mapped.id); } catch (e) { console.error(e); }
              }}
              onBack={() => {}}
              aiService={{ getCoachingResponse: async () => ({ content: '' }) }}
            />
          </div>

          {/* Favorites */}
          {favoriteTemplates.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-300 mb-2">Favorites</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteTemplates.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-gray-800/60 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="text-white font-semibold">{t.name}</div>
                      <button onClick={() => toggleFavorite(t.id)} className="text-yellow-400">★</button>
                    </div>
                    {t.description && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">{t.description}</div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-300">
                      <div>Duration: {t.estimatedDuration || t.estimatedTime || 45}m</div>
                      <div>Exercises: {t.exercises?.length || 0}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={async () => { mapTemplateExercises(t); try { await workoutLogger.startWorkout(t.id); } catch (e) { console.error(e); } }}
                        className="px-3 py-1.5 bg-lime-500 text-black rounded-lg text-xs font-semibold hover:bg-lime-400"
                      >Start</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Used */}
          {recentTemplates.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-300 mb-2">Recently Used</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {recentTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={async () => { mapTemplateExercises(t); try { await workoutLogger.startWorkout(t.id); } catch (e) { console.error(e); } }}
                    className="p-4 rounded-xl bg-gray-800/60 border border-white/10 text-left hover:bg-gray-700/60"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-white font-semibold line-clamp-1">{t.name}</div>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-200 capitalize">{t.type || 'prebuilt'}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">{t.estimatedDuration || t.estimatedTime || 45}m • {t.exercises?.length || 0} ex</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inline Template Library */}
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <input
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates..."
                className="flex-1 px-3 py-2 bg-gray-800/60 border border-white/10 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            <div className="mt-3">
              {isLoadingTemplates ? (
                <div className="text-gray-400 text-sm">Loading templates...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates
                    .filter((t) =>
                      templateSearch
                        ? (t.name?.toLowerCase().includes(templateSearch.toLowerCase()) ||
                           t.description?.toLowerCase().includes(templateSearch.toLowerCase()) ||
                           t.category?.toLowerCase().includes(templateSearch.toLowerCase()))
                        : true
                    )
                    .map((t) => (
                      <div key={t.id} className="p-4 rounded-xl bg-gray-800/60 border border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="text-white font-semibold line-clamp-1">{t.name}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleFavorite(t.id)} className={favoriteTemplateIds.includes(t.id) ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}>★</button>
                            {t.type && (
                              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-200 capitalize">{t.type}</span>
                            )}
                          </div>
                        </div>
                        {t.description && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-2">{t.description}</div>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-300">
                          <div>Duration: {t.estimatedDuration || t.estimatedTime || 45}m</div>
                          <div>Exercises: {t.exercises?.length || 0}</div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={async () => { mapTemplateExercises(t); try { await workoutLogger.startWorkout(t.id); } catch (e) { console.error(e); } }}
                            className="px-3 py-1.5 bg-lime-500 text-black rounded-lg text-xs font-semibold hover:bg-lime-400"
                          >Start</button>
                          <button
                            onClick={() => setIsTemplateSelectorOpen(true)}
                            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs border border-white/10 hover:bg-white/20"
                          >Edit</button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Highlights: PRs */}
          {overviewMetrics?.strengthProgress && overviewMetrics.strengthProgress.length > 0 && (
            <div className="mt-8">
              <div className="text-sm text-gray-300 mb-2">Recent Strength Highlights</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overviewMetrics.strengthProgress.slice(0, 4).map((sp: any) => (
                  <div key={sp.exerciseId} className="p-4 rounded-xl bg-gray-800/60 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold text-sm">{sp.exercise?.name || sp.exerciseId}</div>
                      <div className="text-xs text-gray-400 mt-1">Max {sp.maxWeight}</div>
                    </div>
                    <div className="text-lime-400 text-sm font-semibold">{Math.round(sp.improvement || 0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {subTab === 'history' && (
        <div className="mt-6 space-y-3">
          {history.length === 0 ? (
            <div className="text-gray-400">No workouts yet.</div>
          ) : (
            history.map((w) => (
              <div key={w.id} className="p-4 rounded-xl bg-gray-800/60 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{w.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(w.date).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-200">{w.duration || 0} min</div>
                  <div className="text-xs text-gray-400">Volume: {Math.round(w.totalVolume || 0)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {subTab === 'stats' && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-gray-800/60 border border-white/10">
            <div className="text-xs text-gray-400">Workouts/Week</div>
            <div className="text-2xl font-bold text-white">{metrics?.frequencyMetrics?.workoutsPerWeek ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/60 border border-white/10">
            <div className="text-xs text-gray-400">Avg Session</div>
            <div className="text-2xl font-bold text-white">{Math.round(metrics?.frequencyMetrics?.averageSessionDuration ?? 0)}m</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/60 border border-white/10">
            <div className="text-xs text-gray-400">Set Completion</div>
            <div className="text-2xl font-bold text-white">{Math.round(metrics?.performanceMetrics?.setCompletionRate ?? 0)}%</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/60 border border-white/10">
            <div className="text-xs text-gray-400">Consistency</div>
            <div className="text-2xl font-bold text-white">{Math.round(metrics?.frequencyMetrics?.consistency ?? 0)}%</div>
          </div>
          <div className="md:col-span-4 p-4 rounded-xl bg-gray-800/60 border border-white/10 mt-2">
            <div className="text-sm text-gray-300 mb-2">Strength Progress</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(metrics?.strengthProgress ?? []).slice(0, 6).map((sp: any) => (
                <div key={sp.exerciseId} className="p-3 rounded-lg bg-gray-900/40 border border-white/10 flex items-center justify-between">
                  <div className="text-white text-sm font-medium">{sp.exercise?.name || sp.exerciseId}</div>
                  <div className="text-lime-400 text-sm font-semibold">{sp.maxWeight} • {Math.round(sp.improvement || 0)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'prs' && (
        <div className="mt-6">
          <div className="flex gap-2">
            <input
              value={prQuery}
              onChange={(e) => setPrQuery(e.target.value)}
              placeholder="Search an exercise (e.g., Bench Press)"
              className="flex-1 px-3 py-2 bg-gray-800/60 border border-white/10 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          {prResults.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
              {prResults.slice(0, 9).map((ex: any) => (
                <button
                  key={ex.id}
                  onClick={async () => {
                    setSelectedExerciseForPR(ex);
                    const svc = getWorkoutService();
                    const prs = await svc.getPersonalRecords(ex.id);
                    setPersonalRecords(prs);
                  }}
                  className="p-3 rounded-lg bg-gray-800/60 border border-white/10 text-left hover:bg-gray-700/60"
                >
                  <div className="text-white text-sm font-medium">{ex.name}</div>
                  <div className="text-xs text-gray-400 mt-1 capitalize">{ex.category}</div>
                </button>
              ))}
            </div>
          )}
          {selectedExerciseForPR && (
            <div className="mt-4 p-4 rounded-xl bg-gray-800/60 border border-white/10">
              <div className="text-sm text-gray-300 mb-2">Personal Records · {selectedExerciseForPR.name}</div>
              {personalRecords.length === 0 ? (
                <div className="text-gray-400 text-sm">No PRs yet.</div>
              ) : (
                <div className="space-y-2">
                  {personalRecords.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/40 border border-white/10">
                      <div className="text-white text-sm font-medium capitalize">{r.type.replace('_', ' ')}</div>
                      <div className="text-lime-400 text-sm font-semibold">{r.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Template selector modal */}
      <TemplateSelector
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        getWorkoutTemplates={workoutLogger.getWorkoutTemplates}
      />

      {/* Active session card overlay */}
      {showBeautifulWorkoutCard && currentExercise && (
        <BeautifulWorkoutCard
          exercise={currentExercise}
          onUpdateExercise={setCurrentExercise}
          onSwapExercise={() => {}}
          onSave={() => setShowBeautifulWorkoutCard(false)}
          onClose={() => setShowBeautifulWorkoutCard(false)}
          currentExerciseIndex={currentExerciseIndex}
          totalExercises={workoutExercises.length}
          onNextExercise={handleNextExercise}
          onPreviousExercise={handlePreviousExercise}
          workoutExercises={workoutExercises}
          onSupersetExerciseSelected={() => {}}
          totalWorkoutSets={totalWorkoutSets}
          completedWorkoutSets={completedWorkoutSets}
          onSetCompleted={handleSetCompleted}
        />
      )}
    </div>
  );
};

export default WorkoutsHome;


