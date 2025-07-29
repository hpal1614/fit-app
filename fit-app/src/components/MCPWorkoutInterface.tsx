import React, { useState, useEffect, useCallback } from 'react';
import { 
  useMCPWorkoutGeneration, 
  useMCPFormAnalysis, 
  useMCPBiometrics,
  useMCPVoiceCoaching,
  useMCPProgress 
} from '../hooks/useMCP';
import { useWorkout } from '../hooks/useWorkout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Loader, Activity, TrendingUp, Heart, Mic } from 'lucide-react';

interface MCPWorkoutInterfaceProps {
  onClose?: () => void;
}

export const MCPWorkoutInterface: React.FC<MCPWorkoutInterfaceProps> = ({ onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'generate' | 'monitor' | 'analyze' | 'progress'>('generate');
  const [workoutParams, setWorkoutParams] = useState({
    fitnessLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    goals: ['strength'],
    duration: 45,
    equipment: ['dumbbell', 'barbell']
  });

  // MCP Hooks
  const { generateWorkout, isProcessing: isGenerating } = useMCPWorkoutGeneration();
  const { analyzeForm, isProcessing: isAnalyzing } = useMCPFormAnalysis();
  const { monitorBiometrics, isProcessing: isMonitoring } = useMCPBiometrics();
  const { getVoiceCoaching, isProcessing: isCoaching } = useMCPVoiceCoaching();
  const { trackProgress, isProcessing: isTracking } = useMCPProgress();

  // Workout Hook
  const workout = useWorkout();

  const handleGenerateWorkout = async () => {
    try {
      const result = await generateWorkout(workoutParams);
      
      if (result.success && result.data) {
        // Start the generated workout
        await workout.startWorkout(undefined, result.data.exercises);
        
        // Get voice coaching for warmup
        const coachingResult = await getVoiceCoaching(
          result.data.exercises[0]?.name || 'General Warmup',
          'warmup'
        );

        if (coachingResult.success && coachingResult.data) {
          // Would integrate with voice synthesis here
          console.log('Voice coaching:', coachingResult.data);
        }
      }
    } catch (error) {
      console.error('Failed to generate workout:', error);
    }
  };

  const handleMonitorBiometrics = async () => {
    try {
      const result = await monitorBiometrics(['heart_rate', 'recovery']);
      
      if (result.success && result.data) {
        console.log('Biometric data:', result.data);
        // Update UI with biometric data
      }
    } catch (error) {
      console.error('Failed to monitor biometrics:', error);
    }
  };

  const handleTrackProgress = async (metric: 'strength' | 'endurance' | 'weight' | 'measurements') => {
    try {
      const result = await trackProgress(metric, 'month');
      
      if (result.success && result.data) {
        console.log('Progress data:', result.data);
        // Display progress visualization
      }
    } catch (error) {
      console.error('Failed to track progress:', error);
    }
  };

  useEffect(() => {
    // Start biometric monitoring when workout starts
    if (workout.isActive) {
      handleMonitorBiometrics();
      
      // Set up periodic monitoring
      const interval = setInterval(handleMonitorBiometrics, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [workout.isActive]);

  const renderContent = () => {
    switch (selectedTab) {
      case 'generate':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fitness Level</label>
              <select
                value={workoutParams.fitnessLevel}
                onChange={(e) => setWorkoutParams({
                  ...workoutParams,
                  fitnessLevel: e.target.value as any
                })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Goals</label>
              <div className="flex flex-wrap gap-2">
                {['strength', 'muscle', 'endurance', 'weight loss'].map(goal => (
                  <button
                    key={goal}
                    onClick={() => {
                      const goals = workoutParams.goals.includes(goal)
                        ? workoutParams.goals.filter(g => g !== goal)
                        : [...workoutParams.goals, goal];
                      setWorkoutParams({ ...workoutParams, goals });
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      workoutParams.goals.includes(goal)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration: {workoutParams.duration} minutes
              </label>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={workoutParams.duration}
                onChange={(e) => setWorkoutParams({
                  ...workoutParams,
                  duration: parseInt(e.target.value)
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Equipment</label>
              <div className="flex flex-wrap gap-2">
                {['none', 'dumbbell', 'barbell', 'kettlebell', 'bands'].map(equip => (
                  <button
                    key={equip}
                    onClick={() => {
                      const equipment = workoutParams.equipment.includes(equip)
                        ? workoutParams.equipment.filter(e => e !== equip)
                        : [...workoutParams.equipment, equip];
                      setWorkoutParams({ ...workoutParams, equipment });
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      workoutParams.equipment.includes(equip)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {equip}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateWorkout}
              disabled={isGenerating || workoutParams.goals.length === 0}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating Workout...
                </>
              ) : (
                'Generate AI Workout'
              )}
            </Button>
          </div>
        );

      case 'monitor':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Heart className="h-8 w-8 text-red-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">72</p>
                      <p className="text-sm text-gray-500">BPM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Activity className="h-8 w-8 text-green-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">78%</p>
                      <p className="text-sm text-gray-500">Recovery</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={handleMonitorBiometrics}
              disabled={isMonitoring}
              className="w-full"
            >
              {isMonitoring ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating Metrics...
                </>
              ) : (
                'Refresh Biometrics'
              )}
            </Button>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">AI Recommendations</h4>
              <ul className="text-sm space-y-1">
                <li>• Your recovery is good - ready for intense training</li>
                <li>• Heart rate variability indicates low stress</li>
                <li>• Consider focusing on strength today</li>
              </ul>
            </div>
          </div>
        );

      case 'analyze':
        return (
          <div className="space-y-4 text-center">
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Mic className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Form analysis requires camera access</p>
              <Button className="mt-4" variant="outline">
                Enable Camera
              </Button>
            </div>
            
            <div className="text-left">
              <h4 className="font-semibold mb-2">How it works:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>1. Position camera to see your full body</li>
                <li>2. Select the exercise you're performing</li>
                <li>3. Get real-time form corrections</li>
                <li>4. Review detailed analysis after each set</li>
              </ul>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(['strength', 'endurance', 'weight', 'measurements'] as const).map(metric => (
                <Button
                  key={metric}
                  variant="outline"
                  onClick={() => handleTrackProgress(metric)}
                  disabled={isTracking}
                  className="capitalize"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {metric}
                </Button>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Recent Achievements</h4>
              <ul className="text-sm space-y-1">
                <li>• Bench Press PR: 225 lbs x 5 reps</li>
                <li>• Consistency: 12 workouts this month</li>
                <li>• Total Volume: Up 15% from last month</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>MCP Intelligent Workout</span>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex space-x-1 mb-6">
          {(['generate', 'monitor', 'analyze', 'progress'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg capitalize transition-colors ${
                selectedTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {renderContent()}

        {workout.isActive && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Workout Active</span>
              <span className="text-sm text-gray-600">
                {Math.floor(workout.elapsed / 60)}:{(workout.elapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};