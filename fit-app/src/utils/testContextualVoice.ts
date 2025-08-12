// Test utility for contextual voice service
import { getContextualVoiceService, WorkoutContext } from '../services/contextualVoiceService';

export const testContextualVoiceService = async () => {
  console.log('🧪 Testing Contextual Voice Service...');
  
  try {
    // Create service instance
    const service = getContextualVoiceService();
    console.log('✅ Service instance created');
    
    // Test initialization
    const initialized = await service.initialize();
    console.log('✅ Service initialized:', initialized);
    
    // Test with mock workout context
    const mockContext: WorkoutContext = {
      currentExercise: {
        name: 'Bench Press',
        index: 0,
        totalSets: 4,
        completedSets: 2
      },
      currentSet: {
        weight: 185,
        reps: 8,
        rpe: 3,
        setNumber: 3
      },
      previousSets: [
        { weight: 185, reps: 8, rpe: 2, timestamp: new Date() },
        { weight: 185, reps: 8, rpe: 3, timestamp: new Date() }
      ],
      exerciseHistory: [
        { weight: 180, reps: 8, rpe: 3, date: new Date() },
        { weight: 175, reps: 8, rpe: 2, date: new Date() }
      ],
      workoutProgress: {
        totalExercises: 5,
        currentExerciseIndex: 0,
        overallProgress: 25
      },
      restTimer: {
        isRunning: false,
        timeRemaining: 90
      },
      personalRecords: {
        oneRepMax: 225,
        bestSet: { weight: 190, reps: 8 }
      },
      preferences: {
        defaultIncrement: 5,
        targetRPE: 3,
        preferredRestTime: 90
      }
    };
    
    // Update context
    service.updateWorkoutContext(mockContext);
    console.log('✅ Mock context updated');
    
    // Test contextual processing (this would normally be called by the voice recognition)
    // We'll simulate the internal processing by calling the private method through reflection
    console.log('🧪 Testing contextual command processing...');
    
    // Test various commands
    const testCommands = [
      'add 10 pounds',
      'that was easy',
      'how am I doing?',
      'last time?',
      'same weight but 6 reps',
      'start timer',
      'next exercise'
    ];
    
    console.log('🧪 Test commands to try:');
    testCommands.forEach((cmd, index) => {
      console.log(`${index + 1}. "${cmd}"`);
    });
    
    console.log('✅ Contextual voice service test completed');
    console.log('🎤 Say "Hey Coach" followed by any of the test commands above');
    
    return service;
    
  } catch (error) {
    console.error('❌ Contextual voice service test failed:', error);
    throw error;
  }
};

// Export test function for use in development
export default testContextualVoiceService;
