import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Edit, Check, Play, Pause, SkipForward } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import type { Exercise, WorkoutExercise } from '../types/workout';

interface ExerciseCardFlowProps {
  workoutExercises: Array<{
    id: number;
    name: string;
    sets: number;
    reps: string;
    equipment: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
  currentExerciseIndex: number;
  completedSets: number;
  onExerciseChange: (exerciseId: number) => void;
  onSetComplete: () => void;
  onExerciseComplete: (exerciseId: number) => void;
}

interface ExerciseCardData {
  id: number;
  name: string;
  sets: number;
  reps: string;
  equipment: string;
  status: 'completed' | 'current' | 'upcoming';
  completedSets: number;
  currentWeight: number;
  currentReps: number;
  lastPerformance?: {
    weight: number;
    reps: number;
    date: string;
  };
}

export const ExerciseCardFlow: React.FC<ExerciseCardFlowProps> = ({
  workoutExercises,
  currentExerciseIndex,
  completedSets,
  onExerciseChange,
  onSetComplete,
  onExerciseComplete
}) => {
  const [exerciseCards, setExerciseCards] = useState<ExerciseCardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [pendingExerciseId, setPendingExerciseId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize exercise cards with data
  useEffect(() => {
    const cards: ExerciseCardData[] = workoutExercises.map((exercise, index) => ({
      ...exercise,
      completedSets: index === currentExerciseIndex ? completedSets : 0,
      currentWeight: 190, // Default weight, could be loaded from history
      currentReps: 8,
      lastPerformance: index === 0 ? {
        weight: 185,
        reps: 8,
        date: '2024-01-15'
      } : undefined
    }));
    setExerciseCards(cards);
  }, [workoutExercises, currentExerciseIndex, completedSets]);

  // Update current card index when exercise changes
  useEffect(() => {
    const newIndex = workoutExercises.findIndex(e => e.id === currentExerciseIndex);
    if (newIndex !== -1 && newIndex !== currentCardIndex) {
      setCurrentCardIndex(newIndex);
      scrollToCard(newIndex);
    }
  }, [currentExerciseIndex, workoutExercises]);

  // Scroll to specific card with smooth animation
  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current && cardRefs.current[index]) {
      const container = scrollContainerRef.current;
      const card = cardRefs.current[index];
      const containerWidth = container.offsetWidth;
      const cardWidth = card?.offsetWidth || 400;
      const scrollPosition = index * cardWidth - (containerWidth - cardWidth) / 2;
      
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  };

  // Handle card completion
  const handleCardComplete = (exerciseId: number) => {
    setIsTransitioning(true);
    
    // Update card status to completed
    setExerciseCards(prev => prev.map(card => 
      card.id === exerciseId 
        ? { ...card, status: 'completed' as const }
        : card
    ));

    // Find next exercise
    const currentIndex = exerciseCards.findIndex(card => card.id === exerciseId);
    const nextCard = exerciseCards[currentIndex + 1];

    if (nextCard) {
      // Update next card to current
      setExerciseCards(prev => prev.map(card => 
        card.id === nextCard.id 
          ? { ...card, status: 'current' as const }
          : card
      ));

      // Trigger exercise change
      setTimeout(() => {
        onExerciseComplete(exerciseId);
        onExerciseChange(nextCard.id);
        setCurrentCardIndex(currentIndex + 1);
        scrollToCard(currentIndex + 1);
        setIsTransitioning(false);
      }, 500);
    } else {
      // Workout completed
      setTimeout(() => {
        onExerciseComplete(exerciseId);
        setIsTransitioning(false);
      }, 500);
    }
  };

  // Handle card click to start exercise
  const handleCardClick = (exerciseId: number) => {
    const card = exerciseCards.find(c => c.id === exerciseId);
    if (card && card.status === 'upcoming') {
      setPendingExerciseId(exerciseId);
      setShowStartPrompt(true);
    }
  };

  // Confirm starting exercise
  const confirmStartExercise = () => {
    if (pendingExerciseId) {
      onExerciseChange(pendingExerciseId);
      setShowStartPrompt(false);
      setPendingExerciseId(null);
    }
  };

  // Cancel starting exercise
  const cancelStartExercise = () => {
    setShowStartPrompt(false);
    setPendingExerciseId(null);
  };

  // Handle set completion
  const handleSetComplete = () => {
    const currentCard = exerciseCards[currentCardIndex];
    if (currentCard) {
      setExerciseCards(prev => prev.map(card => 
        card.id === currentCard.id 
          ? { ...card, completedSets: card.completedSets + 1 }
          : card
      ));
      onSetComplete();
    }
  };

  // Navigate to previous card
  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      const prevIndex = currentCardIndex - 1;
      setCurrentCardIndex(prevIndex);
      scrollToCard(prevIndex);
    }
  };

  // Navigate to next card
  const goToNextCard = () => {
    if (currentCardIndex < exerciseCards.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      scrollToCard(nextIndex);
    }
  };

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
        <button
          onClick={goToPreviousCard}
          disabled={currentCardIndex === 0}
          className="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
        <button
          onClick={goToNextCard}
          disabled={currentCardIndex === exerciseCards.length - 1}
          className="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Horizontal Scrollable Cards */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {exerciseCards.map((card, index) => (
          <div
            key={card.id}
            ref={el => cardRefs.current[index] = el}
            className={`flex-shrink-0 w-96 transition-all duration-500 ${
              isTransitioning ? 'transform scale-95 opacity-75' : 'transform scale-100 opacity-100'
            }`}
            style={{ scrollSnapAlign: 'center' }}
            onClick={() => handleCardClick(card.id)}
          >
            <div className={`relative h-full ${
              card.status === 'completed' ? 'cursor-default' :
              card.status === 'current' ? 'cursor-default' :
              'cursor-pointer hover:scale-105 transition-transform'
            }`}>
              
              {/* Exercise Card */}
              <ExerciseCard
                exercise={{
                  id: card.id.toString(),
                  name: card.name,
                  category: 'strength',
                  muscleGroups: ['chest', 'triceps'],
                  equipment: [card.equipment],
                  instructions: [],
                  tips: [],
                  difficulty: 2,
                  estimatedDuration: 5
                }}
                isActive={card.status === 'current'}
                isCompleted={card.status === 'completed'}
                showProgress={true}
                showWorkoutControls={card.status === 'current'}
                className={`${
                  card.status === 'completed' ? 'ring-2 ring-green-500 bg-green-50' :
                  card.status === 'current' ? 'ring-2 ring-blue-500' :
                  'ring-2 ring-gray-300 hover:ring-blue-400'
                }`}
              />

              {/* Status Overlay */}
              {card.status === 'completed' && (
                <div className="absolute inset-0 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Check size={48} className="text-green-500 mx-auto mb-2" />
                    <div className="text-green-700 font-semibold">Completed!</div>
                    <div className="text-sm text-green-600">
                      {card.currentWeight} lbs × {card.currentReps} reps
                    </div>
                    {card.lastPerformance && (
                      <div className="text-xs text-green-500 mt-1">
                        vs {card.lastPerformance.weight} lbs × {card.lastPerformance.reps} reps
                      </div>
                    )}
                    <button className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
                      <Edit size={14} className="inline mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              )}

              {/* Start Prompt Overlay */}
              {card.status === 'upcoming' && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Play size={48} className="text-blue-500 mx-auto mb-2" />
                    <div className="text-blue-700 font-semibold">Ready to start?</div>
                    <div className="text-sm text-blue-600 mb-3">
                      {card.name}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmStartExercise();
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Start
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelStartExercise();
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Later
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="absolute top-2 right-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  card.status === 'completed' ? 'bg-green-500 text-white' :
                  card.status === 'current' ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {card.status === 'completed' ? '✓' :
                   card.status === 'current' ? card.completedSets + 1 :
                   index + 1}
                </div>
              </div>

              {/* Set Progress */}
              {card.status === 'current' && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded text-center">
                    Set {card.completedSets + 1} of {card.sets}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Start Exercise Modal */}
      {showStartPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Start Exercise?</h3>
            <p className="text-gray-600 mb-6">
              Are you ready to start {exerciseCards.find(c => c.id === pendingExerciseId)?.name}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmStartExercise}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Exercise
              </button>
              <button
                onClick={cancelStartExercise}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 