interface ExerciseInfo {
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  variations: ExerciseVariation[];
}

interface ExerciseVariation {
  name: string;
  difficulty: 'easier' | 'harder' | 'similar';
  equipment: string[];
  description: string;
}

interface ExerciseSearchOptions {
  includeVariations?: boolean;
  muscleGroup?: string;
  equipment?: string[];
  difficulty?: string;
}

class ExerciseDatabaseService {
  private exerciseDatabase: Map<string, ExerciseInfo> = new Map();

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Initialize with common exercises
    this.exerciseDatabase.set('squat', {
      name: 'Squat',
      category: 'Compound',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Hamstrings', 'Core', 'Calves'],
      equipment: ['Barbell', 'None'],
      difficulty: 'intermediate',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Keep chest up and core engaged',
        'Lower hips back and down as if sitting in a chair',
        'Descend until thighs are parallel to the floor',
        'Drive through heels to return to standing'
      ],
      tips: [
        'Keep knees tracking over toes',
        'Maintain neutral spine throughout',
        'Breathe in on the way down, out on the way up',
        'Focus on pushing the floor away with your feet'
      ],
      commonMistakes: [
        'Knees caving inward',
        'Heels lifting off the ground',
        'Excessive forward lean',
        'Not reaching proper depth'
      ],
      variations: [
        {
          name: 'Goblet Squat',
          difficulty: 'easier',
          equipment: ['Dumbbell', 'Kettlebell'],
          description: 'Hold weight at chest level for better balance'
        },
        {
          name: 'Front Squat',
          difficulty: 'harder',
          equipment: ['Barbell'],
          description: 'Bar positioned on front deltoids, more quad emphasis'
        },
        {
          name: 'Bulgarian Split Squat',
          difficulty: 'similar',
          equipment: ['None', 'Dumbbells'],
          description: 'Single leg variation with rear foot elevated'
        }
      ]
    });

    this.exerciseDatabase.set('deadlift', {
      name: 'Deadlift',
      category: 'Compound',
      primaryMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae'],
      secondaryMuscles: ['Trapezius', 'Lats', 'Core'],
      equipment: ['Barbell'],
      difficulty: 'advanced',
      instructions: [
        'Stand with feet hip-width apart, toes under barbell',
        'Hinge at hips and grab bar with overhand or mixed grip',
        'Keep back flat and chest up',
        'Drive through heels and extend hips to lift bar',
        'Stand tall with shoulders back',
        'Lower bar by pushing hips back first'
      ],
      tips: [
        'Keep bar close to body throughout movement',
        'Engage lats by "protecting your armpits"',
        'Push the floor away rather than pulling the bar up',
        'Maintain neutral neck position'
      ],
      commonMistakes: [
        'Rounding the back',
        'Bar drifting away from body',
        'Hyperextending at the top',
        'Not engaging lats'
      ],
      variations: [
        {
          name: 'Romanian Deadlift',
          difficulty: 'easier',
          equipment: ['Barbell', 'Dumbbells'],
          description: 'Start from top, focus on hip hinge with slight knee bend'
        },
        {
          name: 'Sumo Deadlift',
          difficulty: 'similar',
          equipment: ['Barbell'],
          description: 'Wider stance with toes pointed out'
        },
        {
          name: 'Deficit Deadlift',
          difficulty: 'harder',
          equipment: ['Barbell', 'Platform'],
          description: 'Stand on platform to increase range of motion'
        }
      ]
    });

    this.exerciseDatabase.set('bench press', {
      name: 'Bench Press',
      category: 'Compound',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Front Deltoids'],
      equipment: ['Barbell', 'Bench'],
      difficulty: 'intermediate',
      instructions: [
        'Lie on bench with eyes under the bar',
        'Plant feet firmly on ground',
        'Grip bar slightly wider than shoulder width',
        'Unrack bar and position over chest',
        'Lower bar to chest with control',
        'Press bar back up to starting position'
      ],
      tips: [
        'Maintain slight arch in lower back',
        'Keep shoulder blades pulled back and down',
        'Grip bar firmly and evenly',
        'Touch bar to chest at nipple line'
      ],
      commonMistakes: [
        'Bouncing bar off chest',
        'Flaring elbows too wide',
        'Lifting feet off ground',
        'Uneven bar path'
      ],
      variations: [
        {
          name: 'Dumbbell Bench Press',
          difficulty: 'similar',
          equipment: ['Dumbbells', 'Bench'],
          description: 'Greater range of motion and stabilization requirement'
        },
        {
          name: 'Incline Bench Press',
          difficulty: 'similar',
          equipment: ['Barbell', 'Incline Bench'],
          description: 'Targets upper chest more'
        },
        {
          name: 'Close-Grip Bench Press',
          difficulty: 'similar',
          equipment: ['Barbell', 'Bench'],
          description: 'Narrower grip for more tricep emphasis'
        }
      ]
    });

    this.exerciseDatabase.set('pull up', {
      name: 'Pull Up',
      category: 'Compound',
      primaryMuscles: ['Lats', 'Middle Back'],
      secondaryMuscles: ['Biceps', 'Rear Deltoids'],
      equipment: ['Pull-up Bar'],
      difficulty: 'intermediate',
      instructions: [
        'Hang from bar with overhand grip, hands shoulder-width apart',
        'Engage core and pull shoulder blades down',
        'Pull body up until chin clears the bar',
        'Lower with control to full arm extension'
      ],
      tips: [
        'Initiate movement with back muscles, not arms',
        'Keep core tight to prevent swinging',
        'Full range of motion for maximum benefit',
        'Focus on pulling elbows down and back'
      ],
      commonMistakes: [
        'Using momentum/kipping',
        'Not achieving full range of motion',
        'Leading with chin instead of chest',
        'Crossing legs behind'
      ],
      variations: [
        {
          name: 'Assisted Pull Up',
          difficulty: 'easier',
          equipment: ['Pull-up Bar', 'Resistance Band'],
          description: 'Use band or machine for assistance'
        },
        {
          name: 'Weighted Pull Up',
          difficulty: 'harder',
          equipment: ['Pull-up Bar', 'Weight Belt'],
          description: 'Add external weight for increased resistance'
        },
        {
          name: 'Chin Up',
          difficulty: 'similar',
          equipment: ['Pull-up Bar'],
          description: 'Underhand grip with more bicep involvement'
        }
      ]
    });

    this.exerciseDatabase.set('push up', {
      name: 'Push Up',
      category: 'Compound',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Front Deltoids', 'Core'],
      equipment: ['None'],
      difficulty: 'beginner',
      instructions: [
        'Start in plank position with hands shoulder-width apart',
        'Keep body in straight line from head to heels',
        'Lower chest to floor by bending elbows',
        'Push back up to starting position'
      ],
      tips: [
        'Keep core engaged throughout',
        'Elbows at 45-degree angle from body',
        'Full range of motion for best results',
        'Breathe in on descent, out on ascent'
      ],
      commonMistakes: [
        'Sagging hips',
        'Flaring elbows too wide',
        'Incomplete range of motion',
        'Head dropping forward'
      ],
      variations: [
        {
          name: 'Knee Push Up',
          difficulty: 'easier',
          equipment: ['None'],
          description: 'Perform on knees instead of toes'
        },
        {
          name: 'Diamond Push Up',
          difficulty: 'harder',
          equipment: ['None'],
          description: 'Hands together forming diamond shape'
        },
        {
          name: 'Decline Push Up',
          difficulty: 'harder',
          equipment: ['Bench', 'Box'],
          description: 'Feet elevated on bench or box'
        }
      ]
    });
  }

  async getExerciseInfo(name: string, options: ExerciseSearchOptions = {}): Promise<ExerciseInfo | null> {
    try {
      const normalizedName = name.toLowerCase().trim();
      let exercise = this.exerciseDatabase.get(normalizedName);

      if (!exercise) {
        // Try to find partial matches
        for (const [key, value] of this.exerciseDatabase.entries()) {
          if (key.includes(normalizedName) || normalizedName.includes(key)) {
            exercise = value;
            break;
          }
        }
      }

      if (!exercise) {
        return null;
      }

      // Filter based on options
      let result = { ...exercise };

      if (!options.includeVariations) {
        result.variations = [];
      }

      if (options.muscleGroup) {
        // Check if exercise targets the specified muscle group
        const targetsMuscle = 
          result.primaryMuscles.some(m => m.toLowerCase().includes(options.muscleGroup!.toLowerCase())) ||
          result.secondaryMuscles.some(m => m.toLowerCase().includes(options.muscleGroup!.toLowerCase()));
        
        if (!targetsMuscle) {
          return null;
        }
      }

      if (options.equipment && options.equipment.length > 0) {
        // Check if exercise can be done with specified equipment
        const hasEquipment = options.equipment.some(eq => 
          result.equipment.some(e => e.toLowerCase() === eq.toLowerCase())
        );
        
        if (!hasEquipment) {
          return null;
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting exercise info:', error);
      throw error;
    }
  }

  async searchExercises(criteria: {
    muscleGroup?: string;
    equipment?: string[];
    difficulty?: string;
    category?: string;
  }): Promise<ExerciseInfo[]> {
    const results: ExerciseInfo[] = [];

    for (const exercise of this.exerciseDatabase.values()) {
      let matches = true;

      if (criteria.muscleGroup) {
        matches = matches && (
          exercise.primaryMuscles.some(m => m.toLowerCase().includes(criteria.muscleGroup!.toLowerCase())) ||
          exercise.secondaryMuscles.some(m => m.toLowerCase().includes(criteria.muscleGroup!.toLowerCase()))
        );
      }

      if (criteria.equipment && criteria.equipment.length > 0) {
        matches = matches && criteria.equipment.some(eq => 
          exercise.equipment.some(e => e.toLowerCase() === eq.toLowerCase())
        );
      }

      if (criteria.difficulty) {
        matches = matches && exercise.difficulty === criteria.difficulty;
      }

      if (criteria.category) {
        matches = matches && exercise.category.toLowerCase() === criteria.category.toLowerCase();
      }

      if (matches) {
        results.push(exercise);
      }
    }

    return results;
  }

  getExercisesByMuscleGroup(muscleGroup: string): ExerciseInfo[] {
    return this.searchExercises({ muscleGroup });
  }

  getExercisesByEquipment(equipment: string[]): ExerciseInfo[] {
    return this.searchExercises({ equipment });
  }
}

export const exerciseDatabaseService = new ExerciseDatabaseService();