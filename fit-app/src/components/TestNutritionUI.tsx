import React from 'react';

export const TestNutritionUI: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 p-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Very Obvious Header */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 mb-8 border-4 border-white/30">
          <h1 className="text-6xl font-bold text-white mb-4">🎉 NEW UI IS WORKING! 🎉</h1>
          <p className="text-2xl text-white/90 mb-4">This is the ENHANCED Nutrition Tracker</p>
          <p className="text-xl text-white/80">If you can see this, the new UI is successfully loaded!</p>
        </div>

        {/* Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">🍎 Nutrition</h2>
            <p className="text-lg">Enhanced tracking with beautiful gradients</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">💧 Water</h2>
            <p className="text-lg">Smart hydration monitoring</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">🎯 Goals</h2>
            <p className="text-lg">AI-powered insights and suggestions</p>
          </div>
        </div>

        {/* Feature List */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 border-4 border-white/30">
          <h2 className="text-4xl font-bold text-white mb-6">✨ New Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-2">🎨 Modern Design</h3>
              <p className="text-white/90">Beautiful gradients and glass morphism effects</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-2">📱 Responsive</h3>
              <p className="text-white/90">Optimized for mobile and desktop</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-2">🤖 AI Insights</h3>
              <p className="text-white/90">Smart recommendations and progress tracking</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-2">🎯 Multiple Inputs</h3>
              <p className="text-white/90">Search, scan, voice, and quick add options</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-8 mt-8 border-4 border-white/30">
          <h2 className="text-4xl font-bold text-white mb-4">✅ SUCCESS!</h2>
          <p className="text-2xl text-white/90">The enhanced nutrition UI is now active!</p>
          <p className="text-xl text-white/80 mt-2">You should see beautiful gradients, modern design, and enhanced functionality.</p>
        </div>
      </div>
    </div>
  );
};
