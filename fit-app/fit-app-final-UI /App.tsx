
import React, { useState } from 'react';

import Header from './components/Header';
import DateSelector from './components/DateSelector';
import WorkoutCalendar from './components/WorkoutCalendar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NutritionMacros from './components/NutritionMacros';
import NutritionWater from './components/NutritionWater';
import GymCrowdMeter from './components/GymCrowdMeter';
import ClassEnrollment from './components/ClassEnrollment';
import WorkoutDetailsModal from './components/WorkoutDetailsModal';
import SwapWorkoutModal from './components/SwapWorkoutModal';
import LogFoodModal from './components/LogFoodModal';

import { user, workoutWeek, dailyNutritionData as initialDailyNutritionData, analyticsData, gymStatus, upcomingClasses } from './data';
import { Workout, WorkoutDay, WorkoutStatus, NutritionData } from './types';

const App: React.FC = () => {
  const [weekData, setWeekData] = useState<WorkoutDay[]>(workoutWeek);
  const [dailyNutritionData, setDailyNutritionData] = useState<NutritionData[]>(initialDailyNutritionData);
  
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
  const selectedNutrition = dailyNutritionData[selectedDayIndex];

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
    const newNutritionData = [...dailyNutritionData];
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
      <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
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
                <NutritionWater initialData={dailyNutritionData[todayIndex].water} />
                <GymCrowdMeter status={gymStatus} />
              </div>
              <ClassEnrollment classes={upcomingClasses} />
            </div>

          </main>
        </div>
      </div>
      
      {isDetailsModalOpen && selectedDay.workout && (
        <WorkoutDetailsModal workout={selectedDay.workout} onClose={() => setIsDetailsModalOpen(false)} />
      )}

      {isSwapModalOpen && (
        <SwapWorkoutModal
            workouts={weekData.filter(d => d.status === WorkoutStatus.Upcoming && d.workout !== null && weekData.indexOf(d) !== todayIndex).map(d => d.workout!)}
            onClose={() => setIsSwapModalOpen(false)}
            onSwap={handleSwapWorkout}
        />
      )}

      {isLogFoodModalOpen && (
        <LogFoodModal
          meal={mealToLog}
          onClose={() => setIsLogFoodModalOpen(false)}
          onLog={handleLogFood}
        />
      )}
    </>
  );
};

export default App;