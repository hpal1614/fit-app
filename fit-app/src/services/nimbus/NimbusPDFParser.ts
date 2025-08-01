import { IntelligentAIService } from '../intelligentAIService';

export interface NimbusPDFWorkout {
  title: string;
  author?: string;
  description?: string;
  duration?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  exercises: NimbusParsedExercise[];
  notes?: string;
  originalText: string;
}

export interface NimbusParsedExercise {
  name: string;
  sets?: number;
  reps?: string; // "8-12" or "10" or "to failure"
  weight?: string; // "bodyweight" or "previous + 5lbs"
  rest?: string; // "60-90 seconds"
  notes?: string;
  alternatives?: string[];
  muscleGroups: string[];
  equipment?: string[];
}

export class NimbusPDFParser {
  private aiService: IntelligentAIService;

  constructor() {
    this.aiService = new IntelligentAIService();
  }

  // Main PDF processing function
  async parseWorkoutPDF(file: File): Promise<NimbusPDFWorkout> {
    try {
      console.log('📄 Starting PDF workout parsing...');
      
      // Step 1: Extract text from PDF
      const pdfText = await this.extractTextFromPDF(file);
      console.log('📄 PDF text extracted, length:', pdfText.length);

      // Step 2: Use AI to parse workout structure
      const parsedWorkout = await this.parseWorkoutWithAI(pdfText, file.name);
      console.log('📄 Workout parsed by AI');

      // Step 3: Validate and enhance the parsed workout
      const enhancedWorkout = await this.enhanceWorkoutData(parsedWorkout);
      console.log('📄 Workout enhanced and validated');

      return enhancedWorkout;

    } catch (error) {
      console.error('❌ PDF parsing failed:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  // Extract text from PDF using PDF.js
  private async extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Import PDF.js dynamically
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';

          // Extract text from each page
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
          }

          resolve(fullText);
        } catch (error) {
          reject(new Error(`PDF text extraction failed: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Use AI to intelligently parse workout structure
  private async parseWorkoutWithAI(pdfText: string, filename: string): Promise<NimbusPDFWorkout> {
    const prompt = `You are an expert fitness coach analyzing a workout PDF. Parse this workout document and extract structured workout information.

PDF FILENAME: ${filename}
PDF CONTENT:
${pdfText.substring(0, 8000)} ${pdfText.length > 8000 ? '...(truncated)' : ''}

TASK: Extract and structure the workout information. Return ONLY valid JSON in this exact format:

{
  "title": "workout program name",
  "author": "author name if mentioned",
  "description": "brief description of the program",
  "duration": "duration in weeks if specified",
  "difficulty": "beginner|intermediate|advanced",
  "equipment": ["list of required equipment"],
  "exercises": [
    {
      "name": "exercise name (standardized)",
      "sets": "number of sets",
      "reps": "rep range or specific reps",
      "weight": "weight specification",
      "rest": "rest time",
      "notes": "any special instructions",
      "alternatives": ["alternative exercises"],
      "muscleGroups": ["primary muscle groups"],
      "equipment": ["equipment needed for this exercise"]
    }
  ],
  "notes": "any additional program notes or instructions"
}

IMPORTANT RULES:
1. Use standard exercise names (e.g., "Bench Press" not "bench press" or "BP")
2. Convert non-standard exercises to closest standard equivalent
3. If sets/reps are unclear, make reasonable assumptions based on context
4. Include rest periods when specified
5. List muscle groups using standard terms (chest, back, shoulders, etc.)
6. Extract equipment requirements accurately
7. Preserve important coaching notes and form cues
8. If information is missing, use null rather than guessing

RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.`;

    let aiResponse = '';
    await this.aiService.streamResponse(
      prompt,
      (chunk) => { aiResponse += chunk; },
      (fullResponse) => { aiResponse = fullResponse; },
      (error) => { throw error; }
    );

    try {
      // Clean the response to extract just the JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      return {
        ...parsedData,
        originalText: pdfText
      };

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('AI failed to parse PDF content properly');
    }
  }

  // Enhance and validate the parsed workout
  private async enhanceWorkoutData(parsedWorkout: NimbusPDFWorkout): Promise<NimbusPDFWorkout> {
    // Validate exercise names against exercise database
    const validatedExercises = await Promise.all(
      parsedWorkout.exercises.map(async (exercise) => {
        const standardizedName = await this.standardizeExerciseName(exercise.name);
        return {
          ...exercise,
          name: standardizedName,
          muscleGroups: exercise.muscleGroups.filter(mg => mg && mg.trim().length > 0)
        };
      })
    );

    return {
      ...parsedWorkout,
      exercises: validatedExercises
    };
  }

  // Standardize exercise names using AI
  private async standardizeExerciseName(exerciseName: string): Promise<string> {
    const standardExercises = [
      'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
      'Pull-ups', 'Push-ups', 'Dips', 'Bicep Curls', 'Tricep Extensions',
      'Lateral Raises', 'Leg Press', 'Leg Curls', 'Leg Extensions', 'Calf Raises',
      'Plank', 'Russian Twists', 'Mountain Climbers', 'Burpees', 'Jump Squats'
    ];

    // Simple matching first
    const lowercaseName = exerciseName.toLowerCase();
    for (const standard of standardExercises) {
      if (lowercaseName.includes(standard.toLowerCase()) || 
          standard.toLowerCase().includes(lowercaseName)) {
        return standard;
      }
    }

    // If no match, return original name cleaned up
    return exerciseName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
} 