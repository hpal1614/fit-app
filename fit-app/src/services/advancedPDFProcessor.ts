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
Analyze this fitness program PDF text and extract workout structure. Return a JSON response with:

1. Program type (PPL, UpperLower, FullBody, etc.)
2. Duration in weeks
3. Days per week
4. Exercise list with sets/reps
5. Weekly schedule
6. Progression rules

PDF Text:
${extraction.text}

Detected Sections:
${extraction.structure.detectedSections.map(s => `${s.type}: ${s.content}`).join('\n')}

Return ONLY valid JSON in this exact format:
{
  "programType": "PPL|UpperLower|FullBody|Strength|Hypertrophy|Custom",
  "duration": number,
  "frequency": number,
  "exercises": [
    {
      "originalText": "string",
      "canonicalName": "string", 
      "targetSets": number,
      "targetReps": "string",
      "restTime": number,
      "notes": ["string"],
      "confidence": number
    }
  ],
  "schedule": [
    {
      "day": "Monday|Tuesday|etc",
      "dayName": "Day 1|Upper|etc", 
      "focus": "string",
      "exercises": [...],
      "estimatedTime": number,
      "targetIntensity": "Light|Moderate|Heavy"
    }
  ],
  "progression": {
    "type": "linear|percentage|weekly|custom",
    "increment": number,
    "frequency": "string",
    "conditions": ["string"]
  },
  "confidence": number,
  "warnings": ["string"]
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

      // Extract JSON from response (handle AI responses that include explanations)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI response did not contain valid JSON');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the analysis
      return this.validateAnalysis(analysis);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
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
    console.warn('🔄 Using fallback analysis');
    
    // Basic regex-based fallback
    const exerciseMatches = text.match(/([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/g) || [];
    
    const exercises: AnalyzedExercise[] = exerciseMatches.slice(0, 12).map((match, i) => {
      const parts = match.match(/([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/);
      return {
        originalText: match,
        canonicalName: parts?.[1]?.trim() || `Exercise ${i + 1}`,
        targetSets: parseInt(parts?.[2] || '3'),
        targetReps: parts?.[3] || '8-12',
        restTime: 90,
        notes: [],
        confidence: 0.6,
        alternatives: []
      };
    });

    return {
      programType: 'Custom',
      duration: 4,
      frequency: 3,
      exercises,
      schedule: [{
        day: 'Monday',
        dayName: 'Workout Day',
        focus: 'Full Body',
        exercises,
        estimatedTime: 60,
        targetIntensity: 'Moderate'
      }],
      progression: {
        type: 'linear',
        increment: 2.5,
        frequency: 'weekly',
        conditions: []
      },
      confidence: 0.6,
      warnings: ['Used fallback analysis - results may be less accurate']
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
