import React from 'react';
import { Apple, Camera, BarChart3, Plus } from 'lucide-react';

export const NutritionTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Daily Summary Card */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Today's Nutrition</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--primary-green)' }}>
              1,850
            </div>
            <div className="text-sm" style={{ color: 'var(--gray-light)' }}>Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--primary-green)' }}>
              142g
            </div>
            <div className="text-sm" style={{ color: 'var(--gray-light)' }}>Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--primary-green)' }}>
              185g
            </div>
            <div className="text-sm" style={{ color: 'var(--gray-light)' }}>Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--primary-green)' }}>
              65g
            </div>
            <div className="text-sm" style={{ color: 'var(--gray-light)' }}>Fat</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="btn-secondary flex items-center justify-center gap-2 py-4">
          <Camera size={20} />
          Scan Food
        </button>
        <button className="btn-secondary flex items-center justify-center gap-2 py-4">
          <Plus size={20} />
          Log Meal
        </button>
      </div>

      {/* Features Coming Soon */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--primary-green)' }}
          >
            <Apple size={24} className="text-black" />
          </div>
          <h3 className="text-lg font-bold text-white">AI-Powered Features</h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg" style={{ background: 'var(--dark-bg)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Camera size={16} style={{ color: 'var(--primary-green)' }} />
              <span className="font-medium">Camera Food Recognition</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--gray-light)' }}>
              Take a photo of your meal for instant nutritional analysis
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'var(--dark-bg)' }}>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} style={{ color: 'var(--primary-green)' }} />
              <span className="font-medium">Smart Macro Tracking</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--gray-light)' }}>
              AI-powered recommendations based on your fitness goals
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'var(--dark-bg)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Apple size={16} style={{ color: 'var(--primary-green)' }} />
              <span className="font-medium">Meal Planning</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--gray-light)' }}>
              Personalized meal plans tailored to your preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};