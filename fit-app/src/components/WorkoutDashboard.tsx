import React, { useState } from 'react';
import { Play, Pause, Square, Timer, MessageCircle, BarChart3 } from 'lucide-react';
import { StrongInspiredLogger } from './workout/StrongInspiredLogger';
import { LadderStatCard, LadderActionCard } from './interface/LadderInspiredCards';
import { useWorkout } from '../hooks/useWorkout';
import { useVoice } from '../hooks/useVoice';

export const WorkoutDashboard: React.FC = () => {
  const [showLogger, setShowLogger] = useState(false);
  const { isWorkoutActive, currentWorkout, startWorkout, endWorkout } = useWorkout();
  const { speak } = useVoice();

  const handleStartWorkout = async () => {
    try {
      await startWorkout();
      await speak('Workout started! Let\'s crush this session.');
      setShowLogger(true);
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  };

  const handleEndWorkout = async () => {
    try {
      await endWorkout();
      await speak('Great workout! You crushed it today.');
      setShowLogger(false);
    } catch (error) {
      console.error('Failed to end workout:', error);
    }
  };

  if (showLogger || isWorkoutActive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Workout Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentWorkout?.name || 'Current Workout'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLogger(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Minimize
              </button>
              <button
                onClick={handleEndWorkout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                End Workout
              </button>
            </div>
          </div>
        </div>
        
        <StrongInspiredLogger />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ready to Train?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Start your workout or review your progress
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LadderStatCard
          title="This Week"
          value="3"
          subtitle="workouts completed"
          color="blue"
          trend={{ direction: 'up', value: '+2' }}
        />
        <LadderStatCard
          title="Total Volume"
          value="2.1k"
          subtitle="lbs lifted today"
          color="green"
          trend={{ direction: 'up', value: '+15%' }}
        />
        <LadderStatCard
          title="Personal Records"
          value="2"
          subtitle="this month"
          color="purple"
        />
        <LadderStatCard
          title="Streak"
          value="5"
          subtitle="days"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <LadderActionCard
          title="Start Workout"
          description="Begin your training session with our smart logging system"
          icon={<Play size={24} />}
          action="Start Training"
          color="blue"
          onClick={handleStartWorkout}
        />
        
        <LadderActionCard
          title="AI Coach"
          description="Get personalized guidance and motivation from your AI trainer"
          icon={<MessageCircle size={24} />}
          action="Chat with Coach"
          color="green"
          onClick={() => {
            // Navigate to AI coach
            console.log('Navigate to AI coach');
          }}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {[
            { exercise: 'Bench Press', sets: '3 sets', weight: '185 lbs', date: 'Today' },
            { exercise: 'Squat', sets: '4 sets', weight: '225 lbs', date: 'Yesterday' },
            { exercise: 'Deadlift', sets: '3 sets', weight: '275 lbs', date: '2 days ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{activity.exercise}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{activity.sets} • {activity.weight}</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{activity.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDashboard;