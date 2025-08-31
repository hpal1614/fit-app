import React, { useState } from 'react';
import Card, { CardHeader, CardContent } from './Card';
import { GlassWaterIcon, PlusIcon, MinusIcon } from './Icons';

interface NutritionWaterProps {
  initialData: { current: number; goal: number };
}

const NutritionWater: React.FC<NutritionWaterProps> = ({ initialData }) => {
  const [waterData, setWaterData] = useState(initialData);
  const percentage = Math.min(100, Math.round((waterData.current / waterData.goal) * 100));

  const addWater = (amount: number) => {
    setWaterData(prev => ({
      ...prev,
      current: Math.min(prev.goal, prev.current + amount)
    }));
  };

  const removeWater = (amount: number) => {
    setWaterData(prev => ({
      ...prev,
      current: Math.max(0, prev.current - amount)
    }));
  };

  return (
    <Card>
      <CardHeader title="Hydration" />
      <CardContent className="text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 mx-auto relative">
            <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center">
              <GlassWaterIcon className="w-12 h-12 text-blue-400" />
            </div>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-blue-400 rounded-b-full transition-all duration-500"
              style={{ height: `${percentage}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{percentage}%</span>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-2xl font-bold text-white">{waterData.current}ml</p>
          <p className="text-sm text-gray-400">of {waterData.goal}ml goal</p>
        </div>

        <div className="flex justify-center space-x-2">
          <button
            onClick={() => removeWater(250)}
            className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => addWater(250)}
            className="p-2 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionWater;


