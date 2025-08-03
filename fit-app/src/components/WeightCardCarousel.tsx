import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Mic } from 'lucide-react';
import type { WorkoutExercise } from '../types/workout';

interface WeightCardCarouselProps {
  workout: {
    exercises: WorkoutExercise[];
  };
  currentExerciseIndex: number;
  onExerciseSelect: (exerciseId: string) => void;
  className?: string;
}

export const WeightCardCarousel: React.FC<WeightCardCarouselProps> = ({
  workout,
  currentExerciseIndex,
  onExerciseSelect,
  className = ''
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentWeight, setCurrentWeight] = useState(190);
  const [currentReps, setCurrentReps] = useState(8);
  const [currentRPE, setCurrentRPE] = useState(3);
  const [completedSets, setCompletedSets] = useState(2);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('🎤 "190 for 8, felt perfect"');
  const [previousSet, setPreviousSet] = useState('175 kg × 8 reps • RPE 7/10');
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [tableSettings, setTableSettings] = useState({
    showWeight: true,
    showReps: true,
    showRPE: true,
    showPrevious: true
  });

  // Scroll to current exercise
  useEffect(() => {
    if (scrollContainerRef.current && workout.exercises[currentExerciseIndex]) {
      const currentExercise = workout.exercises[currentExerciseIndex];
      const cardElement = document.getElementById(`weight-card-${currentExercise.id}`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentExerciseIndex, workout.exercises]);

  const adjustWeight = (amount: number) => {
    setCurrentWeight(prev => Math.max(0, prev + amount));
  };

  const adjustReps = (amount: number) => {
    setCurrentReps(prev => Math.max(1, prev + amount));
  };

  const setRPE = (rpe: number) => {
    setCurrentRPE(rpe);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    setVoiceText(isListening ? '🎤 "190 for 8, felt perfect"' : '🎤 Listening...');
  };

  const logSet = () => {
    setCompletedSets(prev => prev + 1);
    setVoiceText('🎤 "Set logged successfully!"');
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Carousel Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-6 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {workout.exercises.map((exercise, index) => {
          const isCurrent = index === currentExerciseIndex;

          return (
            <div
              key={exercise.id}
              id={`weight-card-${exercise.id}`}
              className={`
                flex-shrink-0 w-full bg-gray-900 rounded-xl shadow-lg border-2 transition-all duration-300
                ${isCurrent ? 'border-fitness-blue scale-105' : 'border-gray-700'}
                scroll-snap-align-center
              `}
              style={{ scrollSnapAlign: 'center', minWidth: '100%' }}
            >
              {/* Copy the EXACT weight card UI from EnhancedWorkoutLogger */}
              <div className="card card-elevated">
                {/* Smart Header with Context */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-1">Previous Set</div>
                      <div className="text-sm font-medium text-white">{previousSet}</div>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">190 lbs</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-1">Set Progress</div>
                    <div className="text-sm font-medium text-green-400">Set {completedSets + 1} of 4</div>
                  </div>
                </div>

                {/* Workout History Section */}
                <div className="mb-4">
                  {/* History Table */}
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 font-medium text-sm">Last Workout</span>
                      <span className="text-gray-400 text-xs">Monday, 15 Jul</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-400 font-medium">Last Workout - {exercise.exercise.name}:</div>
                        <button
                          onClick={() => setShowTableSettings(!showTableSettings)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                        >
                          ⚙️ Settings
                        </button>
                      </div>
                      
                      {/* Table Settings */}
                      {showTableSettings && (
                        <div className="p-3 bg-gray-800/30 rounded-lg mb-3 animate-fade-in">
                          <div className="text-xs text-gray-400 font-medium mb-2">Show/Hide Columns:</div>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(tableSettings).map(([key, value]) => (
                              <label key={key} className="flex items-center gap-2 text-xs text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => setTableSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                                  className="w-3 h-3 text-blue-500 bg-gray-700 border-gray-600 rounded"
                                />
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Table Header */}
                      <div className="grid grid-cols-6 gap-1 text-xs text-gray-400 font-medium px-1">
                        <div className="text-center">Set</div>
                        {tableSettings.showPrevious && <div className="text-center">Previous</div>}
                        {tableSettings.showWeight && <div className="text-center">Weight</div>}
                        {tableSettings.showReps && <div className="text-center">Reps</div>}
                        {tableSettings.showRPE && <div className="text-center">RPE</div>}
                        <div className="text-center">Action</div>
                      </div>
                      
                      {/* Table Rows */}
                      {[1, 2, 3].map((setIndex) => (
                        <div key={setIndex} className="space-y-2">
                          {/* Main Set Row */}
                          <div className={`grid gap-1 items-center p-2 rounded-lg transition-colors ${
                            setIndex <= completedSets 
                              ? 'bg-green-500/20 border border-green-500/30' 
                              : 'bg-gray-800/30'
                          }`} style={{
                            gridTemplateColumns: `auto ${tableSettings.showPrevious ? '1fr' : ''} ${tableSettings.showWeight ? '1fr' : ''} ${tableSettings.showReps ? '1fr' : ''} ${tableSettings.showRPE ? '1fr' : ''} auto`
                          }}>
                            <div className="text-gray-400 text-xs text-center">Set {setIndex}</div>
                            
                            {tableSettings.showPrevious && (
                              <div className="text-white text-xs text-center">
                                {setIndex === 1 ? '195 × 8' : setIndex === 2 ? '190 × 8' : '185 × 8'}
                                <div className="text-gray-500 text-xs">RPE {setIndex === 1 ? '4' : setIndex === 2 ? '3' : '2'}</div>
                              </div>
                            )}
                            
                            {tableSettings.showWeight && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => adjustWeight(-5)}
                                  className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                  -
                                </button>
                                <div className="flex-1 text-center py-1 px-1 bg-gray-700 rounded text-blue-300 text-xs cursor-pointer hover:bg-gray-600 transition-colors">
                                  {setIndex <= completedSets ? currentWeight : (setIndex === 1 ? '190' : setIndex === 2 ? '190' : '185')}
                                </div>
                                <button
                                  onClick={() => adjustWeight(5)}
                                  className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            
                            {tableSettings.showReps && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => adjustReps(-1)}
                                  className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                  -
                                </button>
                                <div className="flex-1 text-center py-1 px-1 bg-gray-700 rounded text-blue-300 text-xs cursor-pointer hover:bg-gray-600 transition-colors">
                                  {setIndex <= completedSets ? currentReps : 8}
                                </div>
                                <button
                                  onClick={() => adjustReps(1)}
                                  className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            
                            {tableSettings.showRPE && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setRPE(Math.max(1, currentRPE - 1))}
                                  className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                  -
                                </button>
                                <div className="flex-1 text-center py-1 px-1 bg-gray-700 rounded text-blue-300 text-xs">
                                  {setIndex <= completedSets ? currentRPE : (setIndex === 1 ? '4' : setIndex === 2 ? '3' : '2')}
                                </div>
                                <button
                                  onClick={() => setRPE(Math.min(10, currentRPE + 1))}
                                  className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => {
                                  if (setIndex <= completedSets) {
                                    setCompletedSets(prev => prev - 1);
                                  } else {
                                    setCompletedSets(prev => prev + 1);
                                  }
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                                  setIndex <= completedSets 
                                    ? 'bg-red-500 text-white hover:bg-red-600' 
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                              >
                                {setIndex <= completedSets ? '↺' : '▶'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Expanded Set Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCompletedSets(prev => prev + 1);
                              }}
                              className="flex-1 py-2 bg-red-500/20 text-red-300 rounded text-xs font-medium hover:bg-red-500/30 transition-colors"
                            >
                              ❌ Mark Failed
                            </button>
                            <button
                              className="flex-1 py-2 bg-purple-500/20 text-purple-300 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors"
                            >
                              🔽 Drop Set
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Quick Load Last Set */}
                <div className="mt-3 pt-3 border-t border-gray-700/30">
                  <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">Smart Default:</span>
                      <span className="text-white text-sm">185 lbs × 8 reps</span>
                      <span className="text-gray-500 text-xs">RPE 2</span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentWeight(185);
                        setCurrentReps(8);
                        setRPE(2);
                      }}
                      className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded hover:bg-green-500/30 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Voice Input */}
              <div className="card card-elevated">
                <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-4">Voice Notes</div>
                <div className="p-4 glass-strong border border-green-500/20 rounded-lg mb-4 min-h-[56px] flex items-center justify-center">
                  <div className="text-sm text-green-400 font-medium">{voiceText}</div>
                </div>
                
                <button 
                  onClick={toggleVoice}
                  className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl transition-modern ${
                    isListening 
                      ? 'bg-green-500 text-black animate-pulse' 
                      : 'bg-gradient-to-br from-green-500 to-green-400 text-black hover:scale-105'
                  }`}
                >
                  <Mic className="w-6 h-6" />
                </button>

                {/* Main Log Button */}
                <button 
                  onClick={logSet}
                  className="w-full h-14 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-modern"
                >
                  Log Set
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => {
            const prevIndex = Math.max(0, currentExerciseIndex - 1);
            onExerciseSelect(workout.exercises[prevIndex].id);
          }}
          disabled={currentExerciseIndex === 0}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center space-x-2">
          {workout.exercises.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentExerciseIndex 
                  ? 'bg-fitness-blue' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={() => {
            const nextIndex = Math.min(workout.exercises.length - 1, currentExerciseIndex + 1);
            onExerciseSelect(workout.exercises[nextIndex].id);
          }}
          disabled={currentExerciseIndex === workout.exercises.length - 1}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default WeightCardCarousel; 