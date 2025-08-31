import React, { useState } from 'react';
import type { MacroNutrients, NutritionData, MealMacros } from '../../types/finalUI';
import Card, { CardHeader, CardContent } from './Card';
import CircularProgress from './CircularProgress';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface NutritionMacrosProps {
  nutrition: NutritionData;
  onLogFoodClick: (meal: string) => void;
}

const MacroCircle: React.FC<{ label: string, color: string, current: number, goal: number }> = ({ label, color, current, goal }) => {
    const percentage = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
    return (
        <div className="flex flex-col items-center text-center">
            <CircularProgress progress={percentage} size={60} strokeWidth={5} color={color} trailColor="rgba(255, 255, 255, 0.08)">
                <span className="font-bold text-sm text-white">{percentage}%</span>
            </CircularProgress>
            <p className="mt-2 text-sm font-semibold">{label}</p>
            <p className="text-xs text-gray-400 font-mono">{current}/{goal}g</p>
        </div>
    )
};

const NutritionMacros: React.FC<NutritionMacrosProps> = ({ nutrition, onLogFoodClick }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const slides = ['overview', 'log'];
    const { macros, meals } = nutrition;

    const totalCalorieGoal = (macros.protein.goal * 4) + (macros.carbs.goal * 4) + (macros.fats.goal * 9);
    const mealCalorieGoal = totalCalorieGoal > 0 ? totalCalorieGoal / 4 : 1;

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % slides.length);
    };
    
    const MealCircle: React.FC<{ label: string, mealMacros: MealMacros }> = ({ label, mealMacros }) => {
        const currentCalories = (mealMacros.protein * 4) + (mealMacros.carbs * 4) + (mealMacros.fats * 9);
        const percentage = Math.min(100, Math.round((currentCalories / mealCalorieGoal) * 100));
        
        const colors: {[key: string]: string} = {
            'Breakfast': '#f97316', // orange
            'Lunch': '#3b82f6',     // blue
            'Dinner': '#a855f7',    // purple
            'Snack': '#22c55e'      // green
        };

        return (
            <div 
                className="flex flex-col items-center text-center cursor-pointer p-1 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => onLogFoodClick(label)}
                role="button"
                aria-label={`Log ${label}`}
            >
                <CircularProgress progress={percentage} size={60} strokeWidth={5} color={colors[label]} trailColor="rgba(255, 255, 255, 0.08)">
                    <span className="font-bold text-sm text-white">{percentage}%</span>
                </CircularProgress>
                <p className="mt-1.5 text-xs font-semibold">{label}</p>
                <p className="text-[10px] text-gray-400 font-mono">{Math.round(currentCalories)} kcal</p>
                <p className="text-[8px] text-gray-500 font-mono leading-tight">
                    {mealMacros.protein}g/{mealMacros.carbs}g/{mealMacros.fats}g
                </p>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader title="Macronutrients">
                <div className="flex items-center space-x-1">
                    <button onClick={handlePrev} className="p-1.5 rounded-full hover:bg-white/10 transition-colors" aria-label="Previous slide">
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleNext} className="p-1.5 rounded-full hover:bg-white/10 transition-colors" aria-label="Next slide">
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-hidden">
                    <div
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                    >
                        {/* Slide 1: Overview */}
                        <div className="w-full flex-shrink-0">
                            <div className="flex justify-around items-center gap-2 sm:gap-4">
                                <MacroCircle label="Protein" color="#3b82f6" current={macros.protein.current} goal={macros.protein.goal} />
                                <MacroCircle label="Carbs" color="#f97316" current={macros.carbs.current} goal={macros.carbs.goal} />
                                <MacroCircle label="Fats" color="#a855f7" current={macros.fats.current} goal={macros.fats.goal} />
                            </div>
                        </div>

                        {/* Slide 2: Log Food */}
                        <div className="w-full flex-shrink-0">
                             {meals ? (
                                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                                    <MealCircle label="Breakfast" mealMacros={meals.breakfast} />
                                    <MealCircle label="Lunch" mealMacros={meals.lunch} />
                                    <MealCircle label="Dinner" mealMacros={meals.dinner} />
                                    <MealCircle label="Snack" mealMacros={meals.snack} />
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">Meal tracking not available.</div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default NutritionMacros;
