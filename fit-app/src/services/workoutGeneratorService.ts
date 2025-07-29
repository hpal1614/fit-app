// AI-Powered Workout Generator Service
export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'compound' | 'isolation';
  instructions: string[];
  tips: string[];
  sets?: number;
  reps?: string;
  rest?: number;
  tempo?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  goal: WorkoutGoal;
  duration: number;
  difficulty: ExperienceLevel;
  equipment: string[];
  exercises: Exercise[];
  warmup: string[];
  cooldown: string[];
  notes: string;
  createdAt: Date;
}

export type WorkoutGoal = 'strength' | 'hypertrophy' | 'endurance' | 'fat_loss' | 'athletic';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentType = 'none' | 'dumbbells' | 'barbell' | 'resistance_bands' | 'machines' | 'cables';

// Exercise database
const EXERCISE_DATABASE: Exercise[] = [
  // Compound Exercises
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    type: 'compound',
    instructions: [
      'Position bar on upper back',
      'Feet shoulder-width apart',
      'Lower until thighs parallel to ground',
      'Drive through heels to stand'
    ],
    tips: ['Keep chest up', 'Knees track over toes', 'Maintain neutral spine']
  },
  {
    id: 'bench_press',
    name: 'Barbell Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    type: 'compound',
    instructions: [
      'Lie on bench, eyes under bar',
      'Grip slightly wider than shoulders',
      'Lower bar to chest',
      'Press up to full extension'
    ],
    tips: ['Keep feet flat', 'Maintain arch', 'Control the descent']
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    muscleGroups: ['hamstrings', 'glutes', 'back', 'traps'],
    equipment: 'barbell',
    difficulty: 'advanced',
    type: 'compound',
    instructions: [
      'Stand with feet hip-width apart',
      'Bend at hips, grip bar',
      'Keep back straight, chest up',
      'Stand up by extending hips and knees'
    ],
    tips: ['Engage lats', 'Keep bar close to body', 'Lock out hips and knees together']
  },
  {
    id: 'pullup',
    name: 'Pull-ups',
    muscleGroups: ['back', 'biceps', 'core'],
    equipment: 'none',
    difficulty: 'intermediate',
    type: 'compound',
    instructions: [
      'Hang from bar with overhand grip',
      'Pull body up until chin over bar',
      'Lower with control'
    ],
    tips: ['Full range of motion', 'Engage core', 'Avoid swinging']
  },
  {
    id: 'pushup',
    name: 'Push-ups',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: 'none',
    difficulty: 'beginner',
    type: 'compound',
    instructions: [
      'Start in plank position',
      'Lower chest to ground',
      'Push back to start'
    ],
    tips: ['Keep body straight', 'Full range of motion', 'Breathe properly']
  },
  {
    id: 'db_lunges',
    name: 'Dumbbell Lunges',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'dumbbells',
    difficulty: 'beginner',
    type: 'compound',
    instructions: [
      'Hold dumbbells at sides',
      'Step forward into lunge',
      'Lower back knee toward ground',
      'Push back to start'
    ],
    tips: ['Keep torso upright', '90-degree angles', 'Control the movement']
  },
  {
    id: 'db_row',
    name: 'Dumbbell Row',
    muscleGroups: ['back', 'biceps'],
    equipment: 'dumbbells',
    difficulty: 'beginner',
    type: 'compound',
    instructions: [
      'Hinge at hips, support with one hand',
      'Row dumbbell to hip',
      'Lower with control'
    ],
    tips: ['Keep back neutral', 'Pull elbow back', 'Squeeze at top']
  },
  // Isolation Exercises
  {
    id: 'bicep_curl',
    name: 'Dumbbell Bicep Curl',
    muscleGroups: ['biceps'],
    equipment: 'dumbbells',
    difficulty: 'beginner',
    type: 'isolation',
    instructions: [
      'Hold dumbbells at sides',
      'Curl weights to shoulders',
      'Lower with control'
    ],
    tips: ['Keep elbows stationary', 'Full range of motion', 'Control tempo']
  },
  {
    id: 'tricep_ext',
    name: 'Overhead Tricep Extension',
    muscleGroups: ['triceps'],
    equipment: 'dumbbells',
    difficulty: 'beginner',
    type: 'isolation',
    instructions: [
      'Hold dumbbell overhead',
      'Lower behind head',
      'Extend back to start'
    ],
    tips: ['Keep elbows close', 'Control the weight', 'Full extension']
  },
  {
    id: 'lateral_raise',
    name: 'Lateral Raises',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbells',
    difficulty: 'beginner',
    type: 'isolation',
    instructions: [
      'Hold dumbbells at sides',
      'Raise arms to parallel',
      'Lower with control'
    ],
    tips: ['Lead with elbows', 'Slight bend in arms', 'Control tempo']
  },
  {
    id: 'plank',
    name: 'Plank',
    muscleGroups: ['core'],
    equipment: 'none',
    difficulty: 'beginner',
    type: 'isolation',
    instructions: [
      'Forearms on ground',
      'Body in straight line',
      'Hold position'
    ],
    tips: ['Engage core', 'Breathe normally', 'Keep hips level']
  },
  {
    id: 'band_pull_apart',
    name: 'Band Pull-Aparts',
    muscleGroups: ['back', 'shoulders'],
    equipment: 'resistance_bands',
    difficulty: 'beginner',
    type: 'isolation',
    instructions: [
      'Hold band at shoulder height',
      'Pull band apart',
      'Control return'
    ],
    tips: ['Squeeze shoulder blades', 'Keep arms straight', 'Control tempo']
  }
];

export class WorkoutGeneratorService {
  // Generate workout based on parameters
  generateWorkout(params: {
    goal: WorkoutGoal;
    experience: ExperienceLevel;
    duration: number;
    equipment: EquipmentType[];
  }): WorkoutPlan {
    const availableExercises = this.filterExercises(params.equipment, params.experience);
    const selectedExercises = this.selectExercises(
      availableExercises,
      params.goal,
      params.duration
    );
    
    // Apply sets, reps, and rest based on goal
    const programmedExercises = this.applyProgramming(selectedExercises, params.goal);
    
    return {
      id: `workout-${Date.now()}`,
      name: this.generateWorkoutName(params.goal, params.experience),
      goal: params.goal,
      duration: params.duration,
      difficulty: params.experience,
      equipment: params.equipment,
      exercises: programmedExercises,
      warmup: this.generateWarmup(params.goal),
      cooldown: this.generateCooldown(),
      notes: this.generateNotes(params.goal, params.experience),
      createdAt: new Date()
    };
  }

  // Filter exercises based on available equipment and experience
  private filterExercises(equipment: EquipmentType[], experience: ExperienceLevel): Exercise[] {
    return EXERCISE_DATABASE.filter(exercise => {
      // Check equipment compatibility
      const hasEquipment = equipment.includes('none') || 
        equipment.some(eq => exercise.equipment === eq || exercise.equipment === 'none');
      
      // Check difficulty compatibility
      const difficultyMatch = this.isDifficultyAppropriate(exercise.difficulty, experience);
      
      return hasEquipment && difficultyMatch;
    });
  }

  // Select exercises based on goal and duration
  private selectExercises(
    exercises: Exercise[], 
    goal: WorkoutGoal, 
    duration: number
  ): Exercise[] {
    const exerciseCount = this.getExerciseCount(duration);
    const selected: Exercise[] = [];
    
    // Prioritize compound movements
    const compounds = exercises.filter(e => e.type === 'compound');
    const isolations = exercises.filter(e => e.type === 'isolation');
    
    // Select compounds first (60-70% of workout)
    const compoundCount = Math.ceil(exerciseCount * 0.7);
    const selectedCompounds = this.selectByMuscleGroups(compounds, compoundCount, goal);
    selected.push(...selectedCompounds);
    
    // Fill remaining with isolation exercises
    const remainingSlots = exerciseCount - selected.length;
    const selectedIsolations = this.selectByMuscleGroups(isolations, remainingSlots, goal);
    selected.push(...selectedIsolations);
    
    return selected;
  }

  // Apply sets, reps, and rest based on training goal
  private applyProgramming(exercises: Exercise[], goal: WorkoutGoal): Exercise[] {
    const programming = this.getProgramming(goal);
    
    return exercises.map(exercise => ({
      ...exercise,
      sets: programming.sets,
      reps: programming.reps,
      rest: programming.rest,
      tempo: programming.tempo
    }));
  }

  // Get programming parameters based on goal
  private getProgramming(goal: WorkoutGoal) {
    const programs = {
      strength: {
        sets: 5,
        reps: '3-5',
        rest: 180,
        tempo: '2-1-2'
      },
      hypertrophy: {
        sets: 4,
        reps: '8-12',
        rest: 90,
        tempo: '3-1-2'
      },
      endurance: {
        sets: 3,
        reps: '15-20',
        rest: 45,
        tempo: '2-1-2'
      },
      fat_loss: {
        sets: 3,
        reps: '12-15',
        rest: 60,
        tempo: '2-1-2'
      },
      athletic: {
        sets: 4,
        reps: '6-8',
        rest: 120,
        tempo: '1-0-1'
      }
    };
    
    return programs[goal];
  }

  // Helper methods
  private isDifficultyAppropriate(
    exerciseDifficulty: string, 
    userExperience: ExperienceLevel
  ): boolean {
    const levels = { beginner: 1, intermediate: 2, advanced: 3 };
    return levels[exerciseDifficulty] <= levels[userExperience];
  }

  private getExerciseCount(duration: number): number {
    if (duration <= 30) return 4;
    if (duration <= 45) return 5;
    if (duration <= 60) return 6;
    return 8;
  }

  private selectByMuscleGroups(
    exercises: Exercise[], 
    count: number, 
    goal: WorkoutGoal
  ): Exercise[] {
    // Ensure variety of muscle groups
    const selected: Exercise[] = [];
    const usedMuscleGroups = new Set<string>();
    
    // Shuffle exercises
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    
    for (const exercise of shuffled) {
      if (selected.length >= count) break;
      
      // Check if we've already hit this muscle group heavily
      const primaryMuscle = exercise.muscleGroups[0];
      if (!usedMuscleGroups.has(primaryMuscle)) {
        selected.push(exercise);
        usedMuscleGroups.add(primaryMuscle);
      }
    }
    
    // Fill remaining slots if needed
    while (selected.length < count && selected.length < exercises.length) {
      const remaining = shuffled.find(e => !selected.includes(e));
      if (remaining) selected.push(remaining);
      else break;
    }
    
    return selected;
  }

  private generateWorkoutName(goal: WorkoutGoal, experience: ExperienceLevel): string {
    const goalNames = {
      strength: 'Strength Builder',
      hypertrophy: 'Muscle Growth',
      endurance: 'Endurance Boost',
      fat_loss: 'Fat Burner',
      athletic: 'Athletic Power'
    };
    
    return `${goalNames[goal]} - ${experience.charAt(0).toUpperCase() + experience.slice(1)}`;
  }

  private generateWarmup(goal: WorkoutGoal): string[] {
    const baseWarmup = [
      '5 minutes light cardio (jog, bike, or row)',
      'Dynamic stretching (leg swings, arm circles)',
      'Activation exercises (band work)'
    ];
    
    if (goal === 'strength' || goal === 'athletic') {
      baseWarmup.push('Progressive warm-up sets with lighter weights');
    }
    
    return baseWarmup;
  }

  private generateCooldown(): string[] {
    return [
      '5 minutes light cardio',
      'Static stretching (hold 30 seconds each)',
      'Foam rolling major muscle groups',
      'Deep breathing exercises'
    ];
  }

  private generateNotes(goal: WorkoutGoal, experience: ExperienceLevel): string {
    const notes: { [key: string]: string } = {
      strength: 'Focus on progressive overload. Increase weight when you can complete all sets with good form.',
      hypertrophy: 'Control the tempo and focus on muscle connection. Increase weight when you exceed rep ranges.',
      endurance: 'Minimize rest between sets. Focus on maintaining form as fatigue sets in.',
      fat_loss: 'Keep intensity high. Consider circuit training or supersets to maximize calorie burn.',
      athletic: 'Focus on explosive movements and power development. Quality over quantity.'
    };
    
    let note = notes[goal];
    
    if (experience === 'beginner') {
      note += ' As a beginner, prioritize learning proper form over heavy weights.';
    }
    
    return note;
  }

  // Get quick workout templates
  getQuickWorkouts(): { name: string; duration: number; type: string }[] {
    return [
      { name: 'Full Body Blast', duration: 30, type: 'full_body' },
      { name: 'Upper Body Pump', duration: 45, type: 'upper' },
      { name: 'Lower Body Power', duration: 45, type: 'lower' },
      { name: 'Core Crusher', duration: 20, type: 'core' },
      { name: 'HIIT Circuit', duration: 30, type: 'hiit' }
    ];
  }
}

// Export singleton instance
export const workoutGeneratorService = new WorkoutGeneratorService();