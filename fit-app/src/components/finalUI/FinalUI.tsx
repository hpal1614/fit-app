import React, { useState } from 'react';
import Header from './Header';
import DateSelector from './DateSelector';
import WorkoutCalendar from './WorkoutCalendar';
import AnalyticsDashboard from './AnalyticsDashboard';
import NutritionMacros from './NutritionMacros';
import NutritionWater from './NutritionWater';
import GymCrowdMeter from './GymCrowdMeter';
import ClassEnrollment from './ClassEnrollment';
import { user, workoutWeek, dailyNutritionData, analyticsData, gymStatus, upcomingClasses } from '../../data/finalUIData';
import type { Workout, WorkoutDay, WorkoutStatus, NutritionData } from '../../types/finalUI';

const FinalUI: React.FC = () => {
  const [weekData, setWeekData] = useState<WorkoutDay[]>(workoutWeek);
  const [dailyNutritionDataState, setDailyNutritionData] = useState<NutritionData[]>(dailyNutritionData);
  
  const getTodayIndex = () => {
    const today = new Date().getDate();
    // In a real app, you'd also check month and year. For this demo, date is enough.
    const todayIndex = weekData.findIndex(d => d.date === today);
    return todayIndex > -1 ? todayIndex : Math.floor(weekData.length / 2); // Default if not found
  };

  const [selectedDayIndex, setSelectedDayIndex] = useState(getTodayIndex());
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isLogFoodModalOpen, setIsLogFoodModalOpen] = useState(false);
  const [mealToLog, setMealToLog] = useState<string | null>(null);

  const todayIndex = getTodayIndex();
  const selectedDay = weekData[selectedDayIndex];
  const selectedNutrition = dailyNutritionDataState[selectedDayIndex];

  const handleSwapWorkout = (workoutToSwap: Workout) => {
    const newWeekData = [...weekData];
    const todayWorkout = newWeekData[todayIndex].workout;
    const swapWorkoutSourceIndex = newWeekData.findIndex(d => d.workout?.title === workoutToSwap.title);

    if (swapWorkoutSourceIndex > -1 && todayWorkout) {
        newWeekData[todayIndex].workout = workoutToSwap;
        newWeekData[swapWorkoutSourceIndex].workout = todayWorkout;
        setWeekData(newWeekData);
    }
    setIsSwapModalOpen(false);
  };

  const handleOpenLogFoodModal = (meal: string) => {
    setMealToLog(meal);
    setIsLogFoodModalOpen(true);
  };

  const handleLogFood = (macrosToAdd: { protein: number; carbs: number; fats: number; }) => {
    if (!mealToLog) return;
    
    const mealKey = mealToLog.toLowerCase() as keyof NutritionData['meals'];
    const newNutritionData = [...dailyNutritionDataState];
    const dayData = newNutritionData[selectedDayIndex];

    if (!dayData.meals || !(mealKey in dayData.meals)) {
      console.error(`Invalid meal: ${mealKey}`);
      return;
    }

    // Update total macros
    dayData.macros.protein.current = Math.min(dayData.macros.protein.goal, dayData.macros.protein.current + macrosToAdd.protein);
    dayData.macros.carbs.current = Math.min(dayData.macros.carbs.goal, dayData.macros.carbs.current + macrosToAdd.carbs);
    dayData.macros.fats.current = Math.min(dayData.macros.fats.goal, dayData.macros.fats.current + macrosToAdd.fats);

    // Update meal-specific macros
    dayData.meals[mealKey].protein += macrosToAdd.protein;
    dayData.meals[mealKey].carbs += macrosToAdd.carbs;
    dayData.meals[mealKey].fats += macrosToAdd.fats;

    setDailyNutritionData(newNutritionData);
  };
  
  return (
    <>
      <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />
          
          <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Column */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <DateSelector 
                week={weekData}
                selectedDayIndex={selectedDayIndex}
                onDaySelect={setSelectedDayIndex}
              />
              <WorkoutCalendar 
                day={selectedDay}
                isToday={selectedDayIndex === todayIndex}
                onViewDetails={() => setIsDetailsModalOpen(true)}
                onSwapWorkout={() => setIsSwapModalOpen(true)}
              />
              <NutritionMacros nutrition={selectedNutrition} onLogFoodClick={handleOpenLogFoodModal} />
              <AnalyticsDashboard data={analyticsData} />
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <NutritionWater initialData={dailyNutritionDataState[todayIndex].water} />
                <GymCrowdMeter status={gymStatus} />
              </div>
              <ClassEnrollment classes={upcomingClasses} />
            </div>

          </main>
        </div>
      </div>
      
      {/* Modals would go here - simplified for now */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Workout Details</h3>
            <p className="text-gray-300 mb-4">Modal content would go here</p>
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isSwapModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Swap Workout</h3>
            <p className="text-gray-300 mb-4">Swap modal content would go here</p>
            <button 
              onClick={() => setIsSwapModalOpen(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isLogFoodModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Log Food</h3>
            <p className="text-gray-300 mb-4">Food logging modal content would go here</p>
            <button 
              onClick={() => setIsLogFoodModalOpen(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FinalUI;
