import React, { useState } from 'react';
import { BottomNavigation } from '../BottomNavigation';
import { Header } from './Header';
import { WorkoutTab } from '../tabs/WorkoutTab';
import { NutritionTab } from '../tabs/NutritionTab';
import { AICoachTab } from '../tabs/AICoachTab';
import { ProfileTab } from '../tabs/ProfileTab';
import { useWorkout } from '../../hooks/useWorkout';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import '../../styles/theme.css';

export type TabId = 'workout' | 'nutrition' | 'ai-coach' | 'profile';

export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('workout');
  const workoutContext = useWorkout();
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'workout':
        return (
          <ErrorBoundary>
            <WorkoutTab context={workoutContext} />
          </ErrorBoundary>
        );
      case 'nutrition':
        return (
          <ErrorBoundary>
            <NutritionTab />
          </ErrorBoundary>
        );
      case 'ai-coach':
        return (
          <ErrorBoundary>
            <AICoachTab workoutContext={workoutContext} />
          </ErrorBoundary>
        );
      case 'profile':
        return (
          <ErrorBoundary>
            <ProfileTab />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <WorkoutTab context={workoutContext} />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black pointer-events-none" />
      
      {/* Header */}
      <Header activeTab={activeTab} />
      
      {/* Main Content */}
      <main className="relative z-10 pt-16 pb-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="animate-fade-in">
          {renderTabContent()}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        workoutActive={workoutContext.isActive}
      />
    </div>
  );
};