import * as pdfjsLib from 'pdfjs-dist';
import { StoredWorkoutTemplate, DayWorkout } from '../services/workoutStorageService';
import { EXERCISE_DATABASE } from '../constants/exercises';
import { NimbusAIService } from '../nimbus/services/NimbusAIService';
import { v4 as uuidv4 } from 'uuid';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFAnalysisResult {
  template: StoredWorkoutTemplate;
  analysis: {
    programType: string;
    duration: number; // weeks
    frequency: number; // days per week
    confidence: number; // 0-1
    warnings: string[];
    rawAIResponse: string;
  };
  debug: {
    extraction: {
      text: string;
      pages: number;
    };
    aiPrompt: string;
  };
}

interface StructuredWorkoutData {
  programName: string;
  duration: number;
  frequency: number;
  days: StructuredDay[];
  progression: ProgressionChart;
  instructions: string[];
  metadata: {
    difficulty: string;
    goals: string[];
    equipment: string[];
  };
}

interface StructuredDay {
  dayNumber: number;
  dayName: string;
  exercises: StructuredExercise[];
  notes?: string;
}

interface StructuredExercise {
  name: string;
  sets: number;
  reps: string;
  restTime: number;
  notes?: string;
  progression?: string;
}

interface ProgressionChart {
  type: 'weekly' | 'linear' | 'percentage';
  increments: { week: number; increment: string }[];
  conditions: string[];
}

export class AdvancedPDFProcessor {
  private nimbusAI: NimbusAIService;

  constructor() {
    this.nimbusAI = new NimbusAIService();
  }

  async processPDFWorkout(file: File): Promise<PDFAnalysisResult> {
    console.log('🚀 Starting two-stage PDF processing...');
    
    try {
      // Stage 1: Extract structured data directly from PDF
      const extraction = await this.extractStructuredData(file);
      console.log('✅ Stage 1: Structured data extraction complete');
      
      // Stage 2: AI enhancement and validation
      const enhancedData = await this.enhanceWithAI(extraction);
      console.log('✅ Stage 2: AI enhancement complete');
      
      // Stage 3: Generate final template
      const template = this.generateTemplate(enhancedData);
      console.log('✅ Stage 3: Template generation complete');
      
      return {
        template,
        analysis: {
          programType: enhancedData.programType || 'Custom',
          duration: enhancedData.duration,
          frequency: enhancedData.frequency,
          confidence: enhancedData.confidence || 0.9,
          warnings: enhancedData.warnings || [],
          rawAIResponse: enhancedData.aiResponse || ''
        },
        debug: {
          extraction: {
            text: extraction.rawText,
            pages: extraction.pages
          },
          aiPrompt: enhancedData.aiPrompt || ''
        }
      };
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      return this.generateFallbackResult(file);
    }
  }

  /**
   * Stage 1: Extract structured data directly from PDF
   */
  private async extractStructuredData(file: File): Promise<StructuredWorkoutData> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }

    console.log('📄 Extracted text length:', fullText.length);
    
    // Extract structured components
    const structuredData: StructuredWorkoutData = {
      programName: this.extractProgramName(fullText, file.name),
      duration: this.extractDuration(fullText),
      frequency: this.extractFrequency(fullText),
      days: this.extractWorkoutDays(fullText),
      progression: this.extractProgressionChart(fullText),
      instructions: this.extractInstructions(fullText),
      metadata: this.extractMetadata(fullText)
    };

    console.log('🏗️ Structured data extracted:', {
      programName: structuredData.programName,
      duration: structuredData.duration,
      frequency: structuredData.frequency,
      daysCount: structuredData.days.length,
      exercisesCount: structuredData.days.reduce((sum, day) => sum + day.exercises.length, 0)
    });

    return {
      ...structuredData,
      rawText: fullText,
      pages: pdf.numPages
    };
  }

  /**
   * Extract program name from text or filename
   */
  private extractProgramName(text: string, filename: string): string {
    // Look for program name patterns
    const namePatterns = [
      /(?:program|workout|plan):\s*([A-Za-z\s]+)/i,
      /([A-Za-z\s]+)\s*(?:program|workout|plan)/i,
      /week\s*\d+\s*-\s*([A-Za-z\s]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback to filename
    return filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
  }

  /**
   * Extract workout duration in weeks
   */
  private extractDuration(text: string): number {
    const patterns = [
      /(\d+)\s*week/i,
      /week\s*(\d+)/i,
      /(\d+)\s*week\s*program/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const weeks = parseInt(match[1]);
        if (weeks >= 1 && weeks <= 52) return weeks;
      }
    }

    // Count unique week mentions
    const weekMatches = text.match(/week\s*\d+/gi) || [];
    const uniqueWeeks = new Set(weekMatches.map(m => m.match(/\d+/)?.[0]));
    if (uniqueWeeks.size > 0) return uniqueWeeks.size;

    return 4; // Default
  }

  /**
   * Extract workout frequency (days per week)
   */
  private extractFrequency(text: string): number {
    const patterns = [
      /(\d+)\s*days?\s*per\s*week/i,
      /(\d+)\s*times?\s*per\s*week/i,
      /day\s*(\d+)/gi
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        const numbers = matches.map(m => m.match(/\d+/)?.[0]).filter(Boolean);
        if (numbers.length > 0) {
          const maxDay = Math.max(...numbers.map(n => parseInt(n)));
          if (maxDay >= 1 && maxDay <= 7) return maxDay;
        }
      }
    }

    // Count unique day mentions
    const dayMatches = text.match(/day\s*\d+/gi) || [];
    const uniqueDays = new Set(dayMatches.map(m => m.match(/\d+/)?.[0]));
    if (uniqueDays.size > 0) return Math.min(7, uniqueDays.size);

    return 3; // Default
  }

  /**
   * Extract workout days with exercises
   */
  private extractWorkoutDays(text: string): StructuredDay[] {
    const days: StructuredDay[] = [];
    
    // Split text into sections by day
    const daySections = text.split(/(?:day|week)\s*\d+/i);
    
    for (let i = 1; i < daySections.length; i++) {
      const section = daySections[i];
      const dayNumber = i;
      
      // Extract exercises from this day's section
      const exercises = this.extractExercisesFromSection(section);
      
      if (exercises.length > 0) {
        days.push({
          dayNumber,
          dayName: `Day ${dayNumber}`,
          exercises,
          notes: this.extractDayNotes(section)
        });
      }
    }

    // If no day sections found, try alternative patterns
    if (days.length === 0) {
      const exercises = this.extractExercisesFromSection(text);
      if (exercises.length > 0) {
        days.push({
          dayNumber: 1,
          dayName: 'Full Body',
          exercises
        });
      }
    }

    return days;
  }

  /**
   * Extract exercises from a text section
   */
  private extractExercisesFromSection(section: string): StructuredExercise[] {
    const exercises: StructuredExercise[] = [];
    
    // Multiple patterns for exercise detection
    const patterns = [
      // "Exercise Name 3x8-10 90s"
      /([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)\s*(\d+)s?/g,
      // "Exercise Name 3 sets 8-10 reps 90s rest"
      /([A-Za-z\s]+):?\s*(\d+)\s*sets?\s*(\d+(?:-\d+)?)\s*reps?\s*(\d+)s?\s*rest/g,
      // "Exercise Name 3x8-10"
      /([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/g,
      // "• Exercise Name 3x8"
      /[-•\u2022]\s*([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/g
    ];

    for (const pattern of patterns) {
      const matches = section.matchAll(pattern);
      for (const match of matches) {
        const name = match[1]?.trim();
        const sets = parseInt(match[2]) || 3;
        const reps = match[3] || '8-12';
        const restTime = parseInt(match[4]) || 90;

        if (name && name.length > 2) {
          exercises.push({
            name: this.cleanExerciseName(name),
            sets: Math.max(1, Math.min(6, sets)),
            reps,
            restTime: Math.max(30, Math.min(300, restTime)),
            notes: this.extractExerciseNotes(section, name)
          });
        }
      }
    }

    return exercises;
  }

  /**
   * Clean exercise name
   */
  private cleanExerciseName(name: string): string {
    return name
      .replace(/[-•\u2022]/g, '')
      .replace(/^\d+\.?\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract exercise-specific notes
   */
  private extractExerciseNotes(section: string, exerciseName: string): string | undefined {
    const lines = section.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(exerciseName.toLowerCase()) && 
          (line.includes('note') || line.includes('tip') || line.includes('focus'))) {
        return line.replace(/^.*?[:•]\s*/, '').trim();
      }
    }
    return undefined;
  }

  /**
   * Extract day-specific notes
   */
  private extractDayNotes(section: string): string | undefined {
    const notePatterns = [
      /note[s]?:?\s*(.+)/i,
      /tip[s]?:?\s*(.+)/i,
      /focus:?\s*(.+)/i
    ];

    for (const pattern of notePatterns) {
      const match = section.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  /**
   * Extract progression chart
   */
  private extractProgressionChart(text: string): ProgressionChart {
    const progression: ProgressionChart = {
      type: 'weekly',
      increments: [],
      conditions: []
    };

    // Look for progression patterns
    const weekPatterns = [
      /week\s*(\d+):?\s*([^.\n]+)/gi,
      /week\s*(\d+)\s*[-–]\s*([^.\n]+)/gi
    ];

    for (const pattern of weekPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const week = parseInt(match[1]);
        const increment = match[2]?.trim();
        if (week && increment) {
          progression.increments.push({ week, increment });
        }
      }
    }

    // Extract progression conditions
    const conditionPatterns = [
      /increase\s+([^.\n]+)/gi,
      /progression\s+([^.\n]+)/gi,
      /when\s+([^.\n]+)/gi
    ];

    for (const pattern of conditionPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const condition = match[1]?.trim();
        if (condition && condition.length > 10) {
          progression.conditions.push(condition);
        }
      }
    }

    return progression;
  }

  /**
   * Extract workout instructions
   */
  private extractInstructions(text: string): string[] {
    const instructions: string[] = [];
    
    const instructionPatterns = [
      /instruction[s]?:?\s*(.+)/gi,
      /note[s]?:?\s*(.+)/gi,
      /tip[s]?:?\s*(.+)/gi,
      /important:?\s*(.+)/gi
    ];

    for (const pattern of instructionPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const instruction = match[1]?.trim();
        if (instruction && instruction.length > 10) {
          instructions.push(instruction);
        }
      }
    }

    return instructions;
  }

  /**
   * Extract workout metadata
   */
  private extractMetadata(text: string): { difficulty: string; goals: string[]; equipment: string[] } {
    const lowerText = text.toLowerCase();
    
    // Detect difficulty
    let difficulty = 'intermediate';
    if (lowerText.includes('beginner')) difficulty = 'beginner';
    else if (lowerText.includes('advanced')) difficulty = 'advanced';
    else if (lowerText.includes('intermediate')) difficulty = 'intermediate';

    // Detect goals
    const goals: string[] = [];
    if (lowerText.includes('strength')) goals.push('Strength');
    if (lowerText.includes('muscle') || lowerText.includes('hypertrophy')) goals.push('Muscle Gain');
    if (lowerText.includes('weight loss') || lowerText.includes('fat loss')) goals.push('Weight Loss');
    if (lowerText.includes('endurance')) goals.push('Endurance');
    if (goals.length === 0) goals.push('General Fitness');

    // Detect equipment
    const equipment: string[] = [];
    if (lowerText.includes('dumbbell')) equipment.push('Dumbbells');
    if (lowerText.includes('barbell')) equipment.push('Barbell');
    if (lowerText.includes('bench')) equipment.push('Bench');
    if (lowerText.includes('cable')) equipment.push('Cable Machine');
    if (lowerText.includes('machine')) equipment.push('Machine');
    if (equipment.length === 0) equipment.push('Dumbbells', 'Barbell');

    return { difficulty, goals, equipment };
  }

  /**
   * Stage 2: AI enhancement and validation
   */
  private async enhanceWithAI(structuredData: StructuredWorkoutData): Promise<any> {
    const prompt = `
You are a fitness expert enhancing workout data. Review and enhance this structured workout data:

PROGRAM: ${structuredData.programName}
DURATION: ${structuredData.duration} weeks
FREQUENCY: ${structuredData.frequency} days/week
EXERCISES: ${structuredData.days.map(day => 
  `${day.dayName}: ${day.exercises.map(ex => `${ex.name} ${ex.sets}x${ex.reps}`).join(', ')}`
).join(' | ')}

INSTRUCTIONS: ${structuredData.instructions.join('; ')}

Enhance this data and return ONLY valid JSON:
{
  "programType": "PPL|UpperLower|FullBody|Strength|Hypertrophy|Custom",
  "enhancedExercises": [
    {
      "originalName": "string",
      "canonicalName": "string",
      "muscleGroups": ["string"],
      "difficulty": "beginner|intermediate|advanced",
      "formCues": ["string"],
      "alternatives": ["string"]
    }
  ],
  "progressionType": "linear|percentage|weekly|custom",
  "confidence": 0.9,
  "warnings": ["string"],
  "aiResponse": "string"
}`;

    try {
      const stream = this.nimbusAI.streamMessage(prompt, { type: 'enhancement', priority: 'medium' });
      let response = '';
      for await (const chunk of stream) {
        response += chunk;
      }

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enhanced = JSON.parse(jsonMatch[0]);
        return {
          ...structuredData,
          ...enhanced,
          aiResponse: response,
          aiPrompt: prompt
        };
      }
    } catch (error) {
      console.warn('⚠️ AI enhancement failed, using structured data:', error);
    }

    return {
      ...structuredData,
      programType: 'Custom',
      confidence: 0.8,
      warnings: ['AI enhancement failed, using structured extraction'],
      aiResponse: '',
      aiPrompt: prompt
    };
  }

  /**
   * Stage 3: Generate final template
   */
  private generateTemplate(enhancedData: any): StoredWorkoutTemplate {
    const schedule: DayWorkout[] = enhancedData.days.map((day: StructuredDay) => ({
      id: uuidv4(),
      day: day.dayName,
      name: day.dayName,
      exercises: day.exercises.map((ex: StructuredExercise) => ({
        id: uuidv4(),
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        restTime: ex.restTime,
        notes: ex.notes || ''
      }))
    }));

    return {
      id: uuidv4(),
      name: enhancedData.programName,
      description: enhancedData.instructions.join(' '),
      difficulty: enhancedData.metadata.difficulty,
      duration: enhancedData.duration,
      category: 'strength',
      goals: enhancedData.metadata.goals,
      equipment: enhancedData.metadata.equipment,
      daysPerWeek: enhancedData.frequency,
      estimatedTime: 60,
      schedule,
      createdAt: new Date(),
      isActive: false,
      currentWeek: 1,
      startDate: new Date()
    };
  }

  /**
   * Fallback result generation
   */
  private generateFallbackResult(file: File): PDFAnalysisResult {
    const template: StoredWorkoutTemplate = {
      id: uuidv4(),
      name: file.name.replace(/\.pdf$/i, '') + ' (Basic)',
      description: 'Basic workout template from PDF',
      difficulty: 'intermediate',
      duration: 4,
      category: 'strength',
      goals: ['General Fitness'],
      equipment: ['Dumbbells'],
      daysPerWeek: 3,
      estimatedTime: 60,
      schedule: [{
        id: uuidv4(),
        day: 'Monday',
        name: 'Full Body',
        exercises: [{
          id: uuidv4(),
          name: 'Squats',
          sets: 3,
          reps: '8-12',
          restTime: 120,
          notes: ''
        }]
      }],
      createdAt: new Date(),
      isActive: false,
      currentWeek: 1,
      startDate: new Date()
    };

    return {
      template,
      analysis: {
        programType: 'Custom',
        duration: 4,
        frequency: 3,
        confidence: 0.5,
        warnings: ['PDF processing failed, using basic template'],
        rawAIResponse: ''
      },
      debug: {
        extraction: { text: '', pages: 0 },
        aiPrompt: ''
      }
    };
  }
}
