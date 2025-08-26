import React, { useState, useEffect } from 'react';
import Header from './Header';
import DateSelector from './DateSelector';
import WorkoutCalendar from './WorkoutCalendar';
import AnalyticsDashboard from './AnalyticsDashboard';
import NutritionMacros from './NutritionMacros';
import NutritionWater from './NutritionWater';
import GymCrowdMeter from './GymCrowdMeter';
import ClassEnrollment from './ClassEnrollment';
import TemplateSelector from './TemplateSelector';
import { useCalendar } from '../../hooks/useCalendar';
import { user, analyticsData, gymStatus, upcomingClasses } from '../../data/finalUIData';
import type { WorkoutTemplate } from '../../types/workout';
import { PDFWorkoutUploader } from '../workout/PDFWorkoutUploader';

// Import workout system types - using any for now to avoid type conflicts
interface WorkoutLogger {
  isWorkoutActive: boolean;
  workoutDurationFormatted: string;
  currentExercise: any;
  exerciseProgress: string;
  startWorkout: (templateId?: string) => Promise<any>;
  endWorkout: () => Promise<any>;
  stopRestTimer: () => void;
  isResting: boolean;
  getWorkoutTemplates: () => Promise<any[]>;
  getWorkoutContext: () => any;
}

interface VoiceRecognition {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  toggleListening: () => void;
  speak: (text: string) => void;
}

interface AICoach {
  getMotivation: (context: any) => Promise<any>;
  getNutritionAdvice: (text: string, context: any) => Promise<any>;
}

interface FinalUIProps {
  workoutLogger: WorkoutLogger;
  voiceRecognition: VoiceRecognition;
  aiCoach: AICoach;
  showChat: boolean;
  onToggleChat: () => void;
}

const FinalUI: React.FC<FinalUIProps> = ({ 
  workoutLogger, 
  voiceRecognition, 
  aiCoach, 
  showChat, 
  onToggleChat 
}) => {
  // Use the calendar hook
  const calendar = useCalendar();
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isLogFoodModalOpen, setIsLogFoodModalOpen] = useState(false);
  const [mealToLog, setMealToLog] = useState<string | null>(null);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  const buildLocalWeek = () => {
    const base = new Date();
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(base.setDate(diff));
    weekStart.setHours(0,0,0,0);
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        id: `day-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        workout: null,
        status: 'upcoming',
        isToday: d.toDateString() === new Date().toDateString(),
      } as any;
    });
    const weekEnd = new Date(days[6].date);
    return { weekStart, weekEnd, days, currentTemplate: null } as any;
  };

  const safeSchedule = calendar.currentSchedule ?? buildLocalWeek();
  const safeSelectedDay = calendar.selectedDay ?? (safeSchedule.days.find((d: any) => d.isToday) || safeSchedule.days[0]);

  // Integrate with workout system - update workout status when workout changes
  useEffect(() => {
    if (workoutLogger.isWorkoutActive && safeSelectedDay?.isToday) {
      calendar.updateWorkoutStatus(safeSelectedDay.date, 'in-progress');
    }
  }, [workoutLogger.isWorkoutActive, safeSelectedDay?.id]);

  // Handle template selection
  const handleTemplateSelect = async (template: WorkoutTemplate) => {
    try {
      await calendar.changeWeekTemplate(template);
      if (voiceRecognition.speak) {
        voiceRecognition.speak(`Great! I've scheduled ${template.name} for your week. You're all set to start working out!`);
      }
    } catch (error) {
      console.error('Error selecting template:', error);
    }
  };

  const handleTemplateFromPDF = async (storedTemplate: any) => {
    const mapped: any = {
      id: storedTemplate.id,
      name: storedTemplate.name,
      description: storedTemplate.description,
      category: storedTemplate.category || 'strength',
      difficulty: storedTemplate.difficulty || 'intermediate',
      estimatedDuration: storedTemplate.estimatedTime || 45,
      exercises: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await handleTemplateSelect(mapped);
    setIsPDFModalOpen(false);
  };

  const handleSwapWorkout = (workoutToSwap: WorkoutTemplate) => {
    calendar.changeWeekTemplate(workoutToSwap);
    setIsSwapModalOpen(false);
  };

  const handleOpenLogFoodModal = (meal: string) => {
    setMealToLog(meal);
    setIsLogFoodModalOpen(true);
  };

  const handleLogFood = (macrosToAdd: { protein: number; carbs: number; fats: number; }) => {
    console.log('Logging food:', { meal: mealToLog, macros: macrosToAdd });
    setIsLogFoodModalOpen(false);
  };

  const handleStartWorkout = async () => {
    if (safeSelectedDay?.workout && safeSelectedDay.isToday) {
      try {
        await workoutLogger.startWorkout(safeSelectedDay.workout.id);
        calendar.updateWorkoutStatus(safeSelectedDay.date, 'in-progress');
        if (voiceRecognition.speak) {
          voiceRecognition.speak(`Starting ${safeSelectedDay.workout.name}! Let's get moving!`);
        }
      } catch (error) {
        console.error('Error starting workout:', error);
      }
    }
  };

  const handleCompleteWorkout = async () => {
    if (workoutLogger.isWorkoutActive) {
      try {
        const completedWorkout = await workoutLogger.endWorkout();
        if (completedWorkout && safeSelectedDay?.isToday) {
          calendar.updateWorkoutStatus(safeSelectedDay.date, 'completed');
          if (voiceRecognition.speak) {
            const duration = completedWorkout.duration || 0;
            const totalSets = completedWorkout.exercises?.reduce((t: number, ex: any) => t + (ex.sets?.length || 0), 0) || 0;
            voiceRecognition.speak(`Great workout! You completed ${totalSets} sets in ${duration} minutes. Well done!`);
          }
        }
      } catch (error) {
        console.error('Error completing workout:', error);
      }
    }
  };

  const handleSelectTemplateClick = () => { setIsTemplateSelectorOpen(true); };
  
  return (
    <>
      <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />
          {voiceRecognition.isActive && (
            <div className="mt-6 p-4 bg-black/20 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    voiceRecognition.isListening ? 'bg-green-400' : 
                    voiceRecognition.isSpeaking ? 'bg-blue-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-300">
                    {voiceRecognition.isListening ? 'Listening' :
                     voiceRecognition.isSpeaking ? 'Speaking' : 'Processing'}
                  </span>
                </div>
                <button onClick={voiceRecognition.toggleListening} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                  {voiceRecognition.isListening ? 'Stop' : 'Start'} Voice
                </button>
              </div>
              {voiceRecognition.transcript && (
                <p className="mt-2 text-sm text-gray-400">"{voiceRecognition.transcript}"</p>
              )}
            </div>
          )}

          {workoutLogger.isWorkoutActive && (
            <div className="mt-6 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-medium text-green-300">Workout in Progress - {workoutLogger.workoutDurationFormatted}</span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={handleCompleteWorkout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">End Workout</button>
                  {workoutLogger.isResting && (
                    <button onClick={workoutLogger.stopRestTimer} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors">Stop Timer</button>
                  )}
                </div>
              </div>
              {workoutLogger.currentExercise && (
                <div className="mt-3 pt-3 border-t border-green-500/30">
                  <p className="text-sm text-green-200">
                    Current: {workoutLogger.currentExercise.exercise?.name || 'Unknown'} - 
                    Sets: {workoutLogger.exerciseProgress}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              <DateSelector 
                days={safeSchedule.days}
                selectedDay={safeSelectedDay as any}
                onDaySelect={calendar.selectDay}
                onNextWeek={calendar.nextWeek}
                onPreviousWeek={calendar.previousWeek}
                onGoToToday={calendar.goToToday}
                isLoading={calendar.isLoading}
              />

              <WorkoutCalendar 
                day={safeSelectedDay as any}
                isToday={!!safeSelectedDay?.isToday}
                isWorkoutActive={workoutLogger.isWorkoutActive}
                onViewDetails={() => setIsDetailsModalOpen(true)}
                onSwapWorkout={() => setIsSwapModalOpen(true)}
                onStartWorkout={handleStartWorkout}
                onCompleteWorkout={handleCompleteWorkout}
                onSelectTemplate={handleSelectTemplateClick}
                // open pdf modal when plus menu -> Use Template
                onOpenPDFUploader={() => setIsPDFModalOpen(true)}
              />

              <NutritionMacros 
                nutrition={{
                  macros: { protein: { current: 0, goal: 150 }, carbs: { current: 0, goal: 250 }, fats: { current: 0, goal: 70 } },
                  water: { current: 0, goal: 3000 },
                  meals: { breakfast: { protein: 0, carbs: 0, fats: 0 }, lunch: { protein: 0, carbs: 0, fats: 0 }, dinner: { protein: 0, carbs: 0, fats: 0 }, snack: { protein: 0, carbs: 0, fats: 0 } }
                }} 
                onLogFoodClick={handleOpenLogFoodModal} 
              />
              <AnalyticsDashboard data={analyticsData} />
            </div>

            <div className="lg:col-span-1 flex flex-col gap-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <NutritionWater initialData={{ current: 0, goal: 3000 }} />
                <GymCrowdMeter status={gymStatus} />
              </div>
              <ClassEnrollment classes={upcomingClasses} />
              {showChat && (
                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-3">AI Coach</h3>
                  <button onClick={() => aiCoach.getMotivation(workoutLogger.getWorkoutContext())} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors mb-2">Get Motivation</button>
                  <button onClick={() => aiCoach.getNutritionAdvice("", workoutLogger.getWorkoutContext())} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors">Nutrition Tips</button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      
      <TemplateSelector
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        getWorkoutTemplates={workoutLogger.getWorkoutTemplates}
      />
      
      {/* Modals would go here - simplified for now */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Workout Details</h3>
            <p className="text-gray-300 mb-4">Modal content would go here</p>
            <button onClick={() => setIsDetailsModalOpen(false)} className="w-full bg-blue-600 text-white py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {isSwapModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Swap Workout</h3>
            <p className="text-gray-300 mb-4">Swap modal content would go here</p>
            <button onClick={() => setIsSwapModalOpen(false)} className="w-full bg-blue-600 text-white py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {isLogFoodModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Log Food</h3>
            <p className="text-gray-300 mb-4">Food logging modal content would go here</p>
            <button onClick={() => setIsLogFoodModalOpen(false)} className="w-full bg-blue-600 text-white py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {isPDFModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Upload Workout PDF</h3>
              <button onClick={() => setIsPDFModalOpen(false)} className="text-gray-500">✕</button>
            </div>
            <div className="bg-white">
              <PDFWorkoutUploader onUpload={handleTemplateFromPDF} onBack={() => setIsPDFModalOpen(false)} aiService={{ getCoachingResponse: async () => ({ content: '' }) }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinalUI;
