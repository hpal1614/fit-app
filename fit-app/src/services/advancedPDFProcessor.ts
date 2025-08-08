import { NimbusAIService } from '../nimbus/services/NimbusAIService';
import { EXERCISE_DATABASE } from '../constants/exercises';
import type { StoredWorkoutTemplate, DayWorkout } from './workoutStorageService';

// PDF.js types for proper text extraction
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PDFExtractionResult {
  text: string;
  structure: DocumentStructure;
  metadata: PDFMetadata;
}

interface DocumentStructure {
  pages: PageContent[];
  detectedSections: SectionInfo[];
  tables: TableData[];
  lists: ListData[];
}

interface PageContent {
  pageNumber: number;
  text: string;
  lines: TextLine[];
  formatting: FormattingInfo[];
}

interface TextLine {
  text: string;
  bbox: [number, number, number, number];
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

interface SectionInfo {
  type: 'heading' | 'paragraph' | 'list' | 'table';
  content: string;
  level?: number;
  pageNumber: number;
  confidence: number;
}

interface PDFMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  pageCount: number;
}

interface WorkoutAnalysisResult {
  programType: 'PPL' | 'UpperLower' | 'FullBody' | 'Strength' | 'Hypertrophy' | 'Custom';
  duration: number; // weeks
  frequency: number; // days per week
  exercises: AnalyzedExercise[];
  schedule: ParsedSchedule[];
  progression: ProgressionRules;
  confidence: number;
  warnings: string[];
}

interface AnalyzedExercise {
  originalText: string;
  canonicalName: string;
  exerciseId?: string;
  targetSets: number;
  targetReps: string;
  restTime: number;
  notes: string[];
  confidence: number;
  alternatives: string[];
}

interface ParsedSchedule {
  day: string;
  dayName: string;
  focus: string;
  exercises: AnalyzedExercise[];
  estimatedTime: number;
  targetIntensity: 'Light' | 'Moderate' | 'Heavy';
}

interface ProgressionRules {
  type: 'linear' | 'percentage' | 'weekly' | 'custom';
  increment: number;
  frequency: string;
  conditions: string[];
}

export class AdvancedPDFProcessor {
  private aiService: NimbusAIService;
  private exerciseDatabase: any[];

  constructor() {
    this.aiService = new NimbusAIService();
    this.exerciseDatabase = EXERCISE_DATABASE;
  }

  /**
   * Main processing pipeline for PDF workout extraction
   */
  async processPDFWorkout(file: File): Promise<{
    template: StoredWorkoutTemplate;
    analysis: WorkoutAnalysisResult;
    debug: any;
  }> {
    try {
      console.log('🚀 Starting advanced PDF processing...');
      
      // Stage 1: Extract structured text from PDF
      const extractionResult = await this.extractStructuredText(file);
      console.log('✅ Stage 1: Text extraction complete');
      
      // Stage 2: Analyze workout structure with AI
      const analysisResult = await this.analyzeWorkoutStructure(extractionResult);
      console.log('✅ Stage 2: AI analysis complete');
      
      // Stage 3: Map exercises to database
      const mappedExercises = await this.mapExercisesToDatabase(analysisResult.exercises);
      console.log('✅ Stage 3: Exercise mapping complete');
      
      // Stage 4: Generate final template
      const template = await this.generateTemplate(file.name, analysisResult, mappedExercises);
      console.log('✅ Stage 4: Template generation complete');
      
      return {
        template,
        analysis: analysisResult,
        debug: {
          extraction: extractionResult,
          mapping: mappedExercises,
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Stage 1: Advanced PDF text extraction using PDF.js
   */
  private async extractStructuredText(file: File): Promise<PDFExtractionResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load PDF.js if not already loaded
        if (!window.pdfjsLib) {
          await this.loadPDFJS();
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const pages: PageContent[] = [];
        let allText = '';
        
        // Extract text from each page with formatting info
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const lines: TextLine[] = [];
          let pageText = '';
          
          textContent.items.forEach((item: any) => {
            if (item.str && item.str.trim()) {
              lines.push({
                text: item.str,
                bbox: item.transform ? [item.transform[4], item.transform[5], 0, 0] : [0, 0, 0, 0],
                fontSize: item.height || 12,
                fontFamily: item.fontName || 'default',
                isBold: item.fontName?.toLowerCase().includes('bold') || false,
                isItalic: item.fontName?.toLowerCase().includes('italic') || false
              });
              pageText += item.str + ' ';
            }
          });
          
          pages.push({
            pageNumber: i,
            text: pageText.trim(),
            lines,
            formatting: []
          });
          
          allText += pageText + '\n\n';
        }

        // Analyze document structure
        const structure = await this.analyzeDocumentStructure(pages);
        
        // Extract metadata
        const metadata: PDFMetadata = {
          pageCount: pdf.numPages,
          title: file.name.replace('.pdf', ''),
          creationDate: new Date()
        };

        resolve({
          text: allText.trim(),
          structure,
          metadata
        });
        
      } catch (error) {
        reject(new Error(`PDF text extraction failed: ${error.message}`));
      }
    });
  }

  /**
   * Load PDF.js library dynamically
   */
  private async loadPDFJS(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Analyze document structure to identify sections
   */
  private async analyzeDocumentStructure(pages: PageContent[]): Promise<DocumentStructure> {
    const detectedSections: SectionInfo[] = [];
    const tables: TableData[] = [];
    const lists: ListData[] = [];

    pages.forEach(page => {
      // Detect headings based on font size and formatting
      page.lines.forEach(line => {
        if (line.fontSize > 14 || line.isBold) {
          detectedSections.push({
            type: 'heading',
            content: line.text,
            level: line.fontSize > 16 ? 1 : 2,
            pageNumber: page.pageNumber,
            confidence: line.isBold ? 0.9 : 0.7
          });
        }
      });

      // Detect lists (lines starting with bullets, numbers, dashes)
      const listPattern = /^[\-\•\*\d+\.]\s+/;
      page.lines.forEach(line => {
        if (listPattern.test(line.text)) {
          lists.push({
            content: line.text,
            pageNumber: page.pageNumber,
            type: 'exercise_list'
          });
        }
      });
    });

    return {
      pages,
      detectedSections,
      tables,
      lists
    };
  }

  /**
   * Stage 2: AI-powered workout structure analysis
   */
  private async analyzeWorkoutStructure(extraction: PDFExtractionResult): Promise<WorkoutAnalysisResult> {
    const prompt = `
You are a fitness expert analyzing a workout PDF. Extract the workout structure and return ONLY a valid JSON object.

PDF Content (first 2000 chars):
${extraction.text.slice(0, 2000)}

Return ONLY this JSON structure with NO additional text:
{
  "programType": "PPL",
  "duration": 4,
  "frequency": 3,
  "exercises": [
    {
      "originalText": "Bench Press 3x8-10",
      "canonicalName": "Bench Press",
      "targetSets": 3,
      "targetReps": "8-10",
      "restTime": 90,
      "notes": [],
      "confidence": 0.9
    }
  ],
  "schedule": [
    {
      "day": "Monday",
      "dayName": "Upper Body",
      "focus": "Chest and Arms",
      "exercises": [],
      "estimatedTime": 60,
      "targetIntensity": "Moderate"
    }
  ],
  "progression": {
    "type": "linear",
    "increment": 2.5,
    "frequency": "weekly",
    "conditions": []
  },
  "confidence": 0.8,
  "warnings": []
}`;

    try {
      const stream = this.aiService.streamMessage(
        prompt,
        { type: 'workout_analysis', priority: 'high' }
      );

      let response = '';
      for await (const chunk of stream) {
        response += chunk;
      }

      console.log('🤖 Raw AI Response:', response.slice(0, 500) + '...');

      // Multiple strategies to extract JSON
      let jsonStr = '';
      
      // Strategy 1: Find JSON between curly braces
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        // Strategy 2: Look for JSON after colon
        const colonMatch = response.match(/:\s*(\{[\s\S]*\})/);
        if (colonMatch) {
          jsonStr = colonMatch[1];
        } else {
          throw new Error('No JSON found in AI response');
        }
      }

      // Clean the JSON string
      jsonStr = jsonStr
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .trim();

      console.log('🔧 Cleaned JSON:', jsonStr.slice(0, 300) + '...');

      let analysis;
      try {
        analysis = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('❌ JSON Parse failed:', parseError);
        console.log('📄 Failed JSON:', jsonStr);
        throw new Error(`JSON parsing failed: ${parseError.message}`);
      }
      
      // Validate and sanitize the analysis
      return this.validateAnalysis(analysis);
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      return this.generateFallbackAnalysis(extraction.text);
    }
  }

  /**
   * Stage 3: Map parsed exercises to database
   */
  private async mapExercisesToDatabase(exercises: AnalyzedExercise[]): Promise<AnalyzedExercise[]> {
    return exercises.map(exercise => {
      // Find exact match first
      let dbExercise = this.exerciseDatabase.find(e => 
        e.name.toLowerCase() === exercise.canonicalName.toLowerCase()
      );

      // Try partial match
      if (!dbExercise) {
        dbExercise = this.exerciseDatabase.find(e => 
          e.name.toLowerCase().includes(exercise.canonicalName.toLowerCase()) ||
          exercise.canonicalName.toLowerCase().includes(e.name.toLowerCase())
        );
      }

      // Try alias matching
      if (!dbExercise) {
        dbExercise = this.exerciseDatabase.find(e => 
          e.variations?.some((v: string) => 
            v.toLowerCase() === exercise.canonicalName.toLowerCase()
          )
        );
      }

      return {
        ...exercise,
        exerciseId: dbExercise?.id,
        canonicalName: dbExercise?.name || exercise.canonicalName,
        alternatives: dbExercise?.variations || []
      };
    });
  }

  /**
   * Stage 4: Generate final workout template
   */
  private async generateTemplate(
    fileName: string, 
    analysis: WorkoutAnalysisResult, 
    mappedExercises: AnalyzedExercise[]
  ): Promise<StoredWorkoutTemplate> {
    
    const schedule: DayWorkout[] = analysis.schedule.map((day, index) => ({
      id: `day-${index}`,
      day: day.day,
      name: day.dayName || day.focus,
      exercises: day.exercises.map((ex, exIndex) => ({
        id: `${index}-${exIndex}`,
        name: ex.canonicalName,
        sets: ex.targetSets,
        reps: ex.targetReps,
        restTime: ex.restTime,
        notes: ex.notes.join('; ')
      })),
      isCompleted: false
    }));

    return {
      id: `pdf-template-${Date.now()}`,
      name: fileName.replace(/\.pdf$/i, '') + ' Workout Program',
      description: `AI-analyzed ${analysis.programType} program (${analysis.duration} weeks, ${analysis.frequency}x/week)`,
      difficulty: this.inferDifficulty(analysis),
      duration: analysis.duration,
      category: analysis.programType.toLowerCase(),
      goals: this.inferGoals(analysis),
      equipment: this.inferEquipment(mappedExercises),
      daysPerWeek: analysis.frequency,
      estimatedTime: this.calculateEstimatedTime(analysis.schedule),
      schedule,
      createdAt: new Date(),
      isActive: false,
      currentWeek: 1,
      startDate: new Date()
    };
  }

  /**
   * Helper methods
   */
  private validateAnalysis(analysis: any): WorkoutAnalysisResult {
    return {
      programType: analysis.programType || 'Custom',
      duration: Math.max(1, Math.min(52, analysis.duration || 4)),
      frequency: Math.max(1, Math.min(7, analysis.frequency || 3)),
      exercises: analysis.exercises || [],
      schedule: analysis.schedule || [],
      progression: analysis.progression || {
        type: 'linear',
        increment: 2.5,
        frequency: 'weekly',
        conditions: []
      },
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.7)),
      warnings: analysis.warnings || []
    };
  }

  private generateFallbackAnalysis(text: string): WorkoutAnalysisResult {
    console.warn('🔄 Using enhanced fallback analysis');
    
    // Enhanced regex patterns for better exercise detection
    const exercisePatterns = [
      /([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/g,  // "Exercise 3x8-10"
      /([A-Za-z\s]+):?\s*(\d+)\s*sets?\s*[xX×]?\s*(\d+(?:-\d+)?)\s*reps?/gi, // "Exercise: 3 sets x 8 reps"
      /(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)\s*([A-Za-z\s]+)/g,   // "3x8 Exercise"
      /[-•\u2022]\s*([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/g  // "• Exercise 3x8"
    ];

    let allMatches: string[] = [];
    exercisePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      allMatches = allMatches.concat(matches);
    });

    // Remove duplicates and clean up
    const uniqueMatches = [...new Set(allMatches)];
    
    const exercises: AnalyzedExercise[] = uniqueMatches.slice(0, 15).map((match, i) => {
      // Try different parsing approaches
      let name = '', sets = 3, reps = '8-12';
      
      const standardMatch = match.match(/([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/);
      if (standardMatch) {
        name = standardMatch[1]?.trim();
        sets = parseInt(standardMatch[2]) || 3;
        reps = standardMatch[3] || '8-12';
      } else {
        // Fallback: extract any exercise-like name
        const nameMatch = match.match(/([A-Za-z\s]{3,})/);
        name = nameMatch?.[1]?.trim() || `Exercise ${i + 1}`;
      }

      // Clean up the name
      name = name.replace(/[-•\u2022]/g, '').replace(/^\d+\.?\s*/, '').trim();
      
      return {
        originalText: match,
        canonicalName: name,
        targetSets: Math.max(1, Math.min(6, sets)), // Limit to reasonable range
        targetReps: reps,
        restTime: name.toLowerCase().includes('cardio') ? 30 : 90,
        notes: [],
        confidence: 0.7,
        alternatives: []
      };
    }).filter(ex => ex.canonicalName.length > 2); // Filter out too-short names

    // Try to detect program structure from text
    const detectProgramType = (): string => {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('push') && lowerText.includes('pull') && lowerText.includes('leg')) return 'PPL';
      if (lowerText.includes('upper') && lowerText.includes('lower')) return 'UpperLower';
      if (lowerText.includes('full body')) return 'FullBody';
      if (lowerText.includes('strength')) return 'Strength';
      return 'Custom';
    };

    // Try to detect frequency
    const detectFrequency = (): number => {
      const dayMatches = text.match(/day\s*\d+/gi) || [];
      const weekMatches = text.match(/week\s*\d+/gi) || [];
      if (dayMatches.length > 0) return Math.min(7, dayMatches.length);
      if (weekMatches.length > 0) return 3; // Default for weekly programs
      return Math.min(5, Math.max(3, Math.ceil(exercises.length / 6))); // Estimate based on exercises
    };

    // Try to detect duration
    const detectDuration = (): number => {
      const weekMatches = text.match(/week\s*(\d+)/gi) || [];
      if (weekMatches.length > 0) {
        const maxWeek = Math.max(...weekMatches.map(m => parseInt(m.match(/\d+/)?.[0] || '1')));
        return Math.max(1, Math.min(12, maxWeek));
      }
      return 4; // Default
    };

    const programType = detectProgramType();
    const frequency = detectFrequency();
    const duration = detectDuration();

    // Create basic schedule
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const schedule: ParsedSchedule[] = [];
    
    for (let i = 0; i < frequency; i++) {
      const dayExercises = exercises.slice(i * Math.ceil(exercises.length / frequency), (i + 1) * Math.ceil(exercises.length / frequency));
      if (dayExercises.length > 0) {
        schedule.push({
          day: daysOfWeek[i] || `Day ${i + 1}`,
          dayName: `Workout ${i + 1}`,
          focus: programType === 'PPL' ? ['Push', 'Pull', 'Legs'][i % 3] : 
                 programType === 'UpperLower' ? ['Upper', 'Lower'][i % 2] : 'Full Body',
          exercises: dayExercises,
          estimatedTime: Math.min(90, Math.max(30, dayExercises.length * 8)), // ~8 min per exercise
          targetIntensity: 'Moderate'
        });
      }
    }

    return {
      programType: programType as any,
      duration,
      frequency,
      exercises,
      schedule: schedule.length > 0 ? schedule : [{
        day: 'Monday',
        dayName: 'Full Body Workout',
        focus: 'Full Body',
        exercises,
        estimatedTime: 60,
        targetIntensity: 'Moderate'
      }],
      progression: {
        type: 'linear',
        increment: 2.5,
        frequency: 'weekly',
        conditions: ['Increase weight when all sets completed with good form']
      },
      confidence: 0.75, // Improved confidence with enhanced analysis
      warnings: exercises.length === 0 ? 
        ['No exercises detected - manual review required'] : 
        ['Enhanced fallback analysis used - verify accuracy']
    };
  }

  private inferDifficulty(analysis: WorkoutAnalysisResult): string {
    const avgSets = analysis.exercises.reduce((sum, ex) => sum + ex.targetSets, 0) / analysis.exercises.length;
    if (avgSets <= 3) return 'beginner';
    if (avgSets <= 4) return 'intermediate';
    return 'advanced';
  }

  private inferGoals(analysis: WorkoutAnalysisResult): string[] {
    const goals = ['Build Muscle'];
    if (analysis.programType === 'Strength') goals.push('Increase Strength');
    if (analysis.frequency >= 5) goals.push('Improve Endurance');
    return goals;
  }

  private inferEquipment(exercises: AnalyzedExercise[]): string[] {
    const equipment = new Set(['Dumbbells', 'Barbell']);
    exercises.forEach(ex => {
      if (ex.canonicalName.toLowerCase().includes('machine')) equipment.add('Machines');
      if (ex.canonicalName.toLowerCase().includes('cable')) equipment.add('Cables');
      if (ex.canonicalName.toLowerCase().includes('bodyweight')) equipment.add('Bodyweight');
    });
    return Array.from(equipment);
  }

  private calculateEstimatedTime(schedule: ParsedSchedule[]): number {
    return schedule.length > 0 
      ? Math.round(schedule.reduce((sum, day) => sum + day.estimatedTime, 0) / schedule.length)
      : 60;
  }
}

// Type definitions for helper interfaces
interface TableData {
  content: string[][];
  pageNumber: number;
}

interface ListData {
  content: string;
  pageNumber: number;
  type: string;
}

interface FormattingInfo {
  bold: boolean;
  italic: boolean;
  fontSize: number;
  startIndex: number;
  endIndex: number;
}
