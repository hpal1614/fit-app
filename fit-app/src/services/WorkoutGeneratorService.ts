// AI-powered workout generation based on goals, equipment, and progress
export interface WorkoutGoal {
  type: 'strength' | 'hypertrophy' | 'endurance' | 'weight-loss' | 'general-fitness';
  timeline: 'short-term' | 'medium-term' | 'long-term';
  experience: 'beginner' | 'intermediate' | 'advanced';
}

export interface AvailableEquipment {
  freeWeights: boolean;
  machines: boolean;
  cardioEquipment: boolean;
  bodyweightOnly: boolean;
  resistanceBands: boolean;
  kettlebells: boolean;
}

export interface GeneratedWorkout {
  id: string;
  name: string;
  goal: WorkoutGoal;
  estimatedDuration: number; // minutes
  exercises: WorkoutExercise[];
  restPeriods: number[];
  notes: string[];
  progressionStrategy: string;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string; // Can be "AMRAP", "8-12", etc.
  weight?: string;
  restBetweenSets: number;
  rpe?: number; // Rate of Perceived Exertion 1-10
  notes?: string;
  primaryMuscles: string[];
  equipment: string[];
}

export class WorkoutGeneratorService {
  private exerciseDatabase: WorkoutExercise[] = [
    // Bodyweight exercises
    {
      name: 'Push-ups',
      sets: 3,
      reps: '8-15',
      restBetweenSets: 60,
      primaryMuscles: ['chest', 'triceps', 'shoulders'],
      equipment: ['bodyweight'],
      notes: 'Maintain straight line from head to heels'
    },
    {
      name: 'Bodyweight Squats',
      sets: 3,
      reps: '12-20',
      restBetweenSets: 60,
      primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: ['bodyweight'],
      notes: 'Descend until thighs parallel to floor'
    },
    {
      name: 'Plank',
      sets: 3,
      reps: '30-60 seconds',
      restBetweenSets: 60,
      primaryMuscles: ['core', 'shoulders'],
      equipment: ['bodyweight'],
      notes: 'Keep body in straight line'
    },
    // Free weight exercises
    {
      name: 'Barbell Back Squat',
      sets: 4,
      reps: '6-8',
      restBetweenSets: 180,
      primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: ['barbell', 'squat-rack'],
      notes: 'Keep chest up and knees tracking over toes'
    },
    {
      name: 'Deadlift',
      sets: 4,
      reps: '5-6',
      restBetweenSets: 180,
      primaryMuscles: ['hamstrings', 'glutes', 'erector-spinae'],
      equipment: ['barbell'],
      notes: 'Keep bar close to body throughout movement'
    },
    {
      name: 'Bench Press',
      sets: 4,
      reps: '6-8',
      restBetweenSets: 180,
      primaryMuscles: ['chest', 'triceps', 'shoulders'],
      equipment: ['barbell', 'bench'],
      notes: 'Control the descent and drive through chest'
    },
    {
      name: 'Dumbbell Row',
      sets: 3,
      reps: '8-12',
      restBetweenSets: 90,
      primaryMuscles: ['lats', 'rhomboids', 'biceps'],
      equipment: ['dumbbell', 'bench'],
      notes: 'Squeeze shoulder blades together at top'
    },
    // Machine exercises
    {
      name: 'Lat Pulldown',
      sets: 3,
      reps: '8-12',
      restBetweenSets: 90,
      primaryMuscles: ['lats', 'rhomboids', 'biceps'],
      equipment: ['cable-machine'],
      notes: 'Pull to upper chest, squeeze lats'
    },
    {
      name: 'Leg Press',
      sets: 3,
      reps: '10-15',
      restBetweenSets: 120,
      primaryMuscles: ['quadriceps', 'glutes'],
      equipment: ['leg-press-machine'],
      notes: 'Control the descent, full range of motion'
    }
  ];

  // Generate personalized workout
  public generateWorkout(
    goal: WorkoutGoal,
    equipment: AvailableEquipment,
    timeAvailable: number = 60,
    userProgress: any = {}
  ): GeneratedWorkout {
    
    // 1. Filter exercises by available equipment
    const availableExercises = this.filterByEquipment(equipment);
    
    // 2. Select exercises based on goal and experience
    const selectedExercises = this.selectExercisesForGoal(availableExercises, goal, timeAvailable);
    
    // 3. Adjust training variables based on goal
    const adjustedExercises = this.adjustTrainingVariables(selectedExercises, goal);
    
    // 4. Generate workout details
    const workout: GeneratedWorkout = {
      id: `workout-${Date.now()}`,
      name: this.generateWorkoutName(goal),
      goal,
      estimatedDuration: timeAvailable,
      exercises: adjustedExercises,
      restPeriods: this.calculateRestPeriods(goal),
      notes: this.generateWorkoutNotes(goal, equipment),
      progressionStrategy: this.generateProgressionStrategy(goal)
    };

    return workout;
  }

  private filterByEquipment(equipment: AvailableEquipment): WorkoutExercise[] {
    return this.exerciseDatabase.filter(exercise => {
      if (equipment.bodyweightOnly && exercise.equipment.includes('bodyweight')) return true;
      if (equipment.freeWeights && (
        exercise.equipment.includes('barbell') || 
        exercise.equipment.includes('dumbbell')
      )) return true;
      if (equipment.machines && (
        exercise.equipment.includes('cable-machine') || 
        exercise.equipment.includes('leg-press-machine')
      )) return true;
      return false;
    });
  }

  private selectExercisesForGoal(
    exercises: WorkoutExercise[],
    goal: WorkoutGoal,
    timeAvailable: number
  ): WorkoutExercise[] {
    const exerciseCount = Math.floor(timeAvailable / 12); // ~12 minutes per exercise
    
    // Prioritize compound movements for strength
    if (goal.type === 'strength') {
      const compounds = exercises.filter(ex => ex.primaryMuscles.length >= 2);
      return compounds.slice(0, Math.min(exerciseCount, 6));
    }

    // More exercises for hypertrophy
    if (goal.type === 'hypertrophy') {
      const balanced = this.balanceByMuscleGroup(exercises);
      return balanced.slice(0, Math.min(exerciseCount, 8));
    }

    // Higher rep, circuit-style for weight loss
    if (goal.type === 'weight-loss') {
      const fullBody = exercises.filter(ex => 
        ex.primaryMuscles.some(muscle => 
          ['quadriceps', 'chest', 'lats', 'shoulders'].includes(muscle)
        )
      );
      return fullBody.slice(0, Math.min(exerciseCount, 6));
    }

    // Balanced selection for general fitness
    return this.balanceByMuscleGroup(exercises).slice(0, Math.min(exerciseCount, 6));
  }

  private balanceByMuscleGroup(exercises: WorkoutExercise[]): WorkoutExercise[] {
    const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
    const balanced: WorkoutExercise[] = [];
    
    muscleGroups.forEach(group => {
      const exercisesForGroup = exercises.filter(ex => 
        ex.primaryMuscles.some(muscle => muscle.includes(group.substring(0, 4)))
      );
      if (exercisesForGroup.length > 0) {
        balanced.push(exercisesForGroup[0]);
      }
    });
    
    return balanced;
  }

  private adjustTrainingVariables(
    exercises: WorkoutExercise[],
    goal: WorkoutGoal
  ): WorkoutExercise[] {
    
    const adjustments = {
      strength: { sets: [3, 5], reps: '3-6', rest: 180, rpe: 8 },
      hypertrophy: { sets: [3, 4], reps: '8-12', rest: 90, rpe: 7 },
      endurance: { sets: [2, 3], reps: '15-20', rest: 60, rpe: 6 },
      'weight-loss': { sets: [3, 4], reps: '12-15', rest: 45, rpe: 7 },
      'general-fitness': { sets: [2, 3], reps: '10-15', rest: 60, rpe: 6 }
    };

    const params = adjustments[goal.type];

    return exercises.map(exercise => ({
      ...exercise,
      sets: this.randomInRange(params.sets[0], params.sets[1]),
      reps: params.reps,
      restBetweenSets: params.rest,
      rpe: params.rpe,
      weight: goal.experience === 'beginner' ? 'Light to moderate' : 
              goal.experience === 'intermediate' ? 'Moderate to heavy' : 'Heavy'
    }));
  }

  private generateWorkoutName(goal: WorkoutGoal): string {
    const names = {
      strength: ['Power Session', 'Strength Builder', 'Heavy Day', 'Max Effort'],
      hypertrophy: ['Muscle Builder', 'Growth Session', 'Volume Day', 'Pump Training'],
      endurance: ['Endurance Challenge', 'Stamina Builder', 'High Volume', 'Conditioning'],
      'weight-loss': ['Fat Burner', 'Metabolic Blast', 'Lean & Mean', 'Calorie Crusher'],
      'general-fitness': ['Full Body Flow', 'Balanced Training', 'All-Around Fitness', 'Complete Workout']
    };

    const options = names[goal.type];
    return options[Math.floor(Math.random() * options.length)];
  }

  private calculateRestPeriods(goal: WorkoutGoal): number[] {
    const restTimes = {
      strength: [180, 240],
      hypertrophy: [90, 120],
      endurance: [45, 60],
      'weight-loss': [30, 60],
      'general-fitness': [60, 90]
    };

    return restTimes[goal.type];
  }

  private generateWorkoutNotes(goal: WorkoutGoal, equipment: AvailableEquipment): string[] {
    const notes: string[] = [];

    // Goal-specific notes
    if (goal.type === 'strength') {
      notes.push('Focus on progressive overload - increase weight when you can complete all sets');
      notes.push('Rest fully between sets to maintain intensity');
    } else if (goal.type === 'hypertrophy') {
      notes.push('Focus on controlled movements and mind-muscle connection');
      notes.push('Use full range of motion for maximum muscle activation');
    }

    // Equipment-specific notes
    if (equipment.bodyweightOnly) {
      notes.push('Adjust difficulty by changing tempo or adding pauses');
      notes.push('Progress by increasing reps or adding advanced variations');
    }

    // Experience-specific notes
    if (goal.experience === 'beginner') {
      notes.push('Focus on learning proper form before increasing intensity');
      notes.push('Start with lighter weights and higher reps');
    }

    return notes;
  }

  private generateProgressionStrategy(goal: WorkoutGoal): string {
    const strategies = {
      strength: 'Increase weight by 2.5-5lbs when you can complete all sets at the prescribed reps. Focus on progressive overload each week.',
      hypertrophy: 'Add 1-2 reps per week until you reach the top of the rep range, then increase weight by 5-10%.',
      endurance: 'Increase reps by 2-3 per week or add additional sets. Focus on building work capacity.',
      'weight-loss': 'Gradually decrease rest periods or increase exercise intensity. Add cardio intervals between sets.',
      'general-fitness': 'Progress gradually across all variables - weight, reps, and sets. Aim for balanced development.'
    };

    return strategies[goal.type];
  }

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generate workout based on user preferences
  public generateQuickWorkout(
    timeAvailable: number,
    equipment: AvailableEquipment,
    focus?: 'upper' | 'lower' | 'full-body' | 'core'
  ): GeneratedWorkout {
    const quickGoal: WorkoutGoal = {
      type: 'general-fitness',
      timeline: 'short-term',
      experience: 'intermediate'
    };

    let exercises = this.filterByEquipment(equipment);

    // Filter by focus area
    if (focus === 'upper') {
      exercises = exercises.filter(ex => 
        ex.primaryMuscles.some(muscle => 
          ['chest', 'shoulders', 'lats', 'triceps', 'biceps'].includes(muscle)
        )
      );
    } else if (focus === 'lower') {
      exercises = exercises.filter(ex => 
        ex.primaryMuscles.some(muscle => 
          ['quadriceps', 'glutes', 'hamstrings', 'calves'].includes(muscle)
        )
      );
    } else if (focus === 'core') {
      exercises = exercises.filter(ex => 
        ex.primaryMuscles.includes('core')
      );
    }

    const selectedExercises = exercises.slice(0, Math.floor(timeAvailable / 10));
    const adjustedExercises = selectedExercises.map(ex => ({
      ...ex,
      sets: 3,
      reps: '10-15',
      restBetweenSets: 60
    }));

    return {
      id: `quick-workout-${Date.now()}`,
      name: `Quick ${focus ? focus.charAt(0).toUpperCase() + focus.slice(1) : 'Full Body'} Workout`,
      goal: quickGoal,
      estimatedDuration: timeAvailable,
      exercises: adjustedExercises,
      restPeriods: [45, 75],
      notes: ['Quick and efficient workout', 'Focus on good form over speed'],
      progressionStrategy: 'Increase intensity or reduce rest time as you improve'
    };
  }
}