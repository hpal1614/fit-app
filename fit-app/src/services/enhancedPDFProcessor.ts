import * as pdfjsLib from 'pdfjs-dist';
import { StoredWorkoutTemplate, DayWorkout } from '../services/workoutStorageService';
import { EXERCISE_DATABASE } from '../constants/exercises';
import { NimbusAIService } from '../nimbus/services/NimbusAIService';
import { v4 as uuidv4 } from 'uuid';
import { parseAIResponseWithFallbacks, validateAIResponse } from './jsonRepairUtils';

// Configure PDF.js worker for Vite development
if (import.meta.env.DEV) {
  // Development: use CDN with HTTPS
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} else {
  // Production: use relative path
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}
console.log('📝 PDF.js worker configured for:', import.meta.env.DEV ? 'development' : 'production');

interface PDFProcessingResult {
  template: StoredWorkoutTemplate;
  analysis: {
    processingStage: 'structured' | 'ai_enhanced' | 'fallback';
    confidence: number;
    warnings: string[];
    errors: string[];
    successfulStages: string[];
  };
  debug: {
    rawText: string;
    structuredData?: StructuredWorkoutData;
    aiResponse?: string;
    processingTime: number;
  };
}

interface StructuredWorkoutData {
  programName: string;
  duration: number; // weeks
  frequency: number; // days per week
  workoutDays: WorkoutDay[];
  progressionChart?: ProgressionData;
  instructions: string[];
  metadata: WorkoutMetadata;
  structure: PDFStructure;
}

interface WorkoutDay {
  dayNumber: number;
  dayName: string;
  isOptional?: boolean;
  exercises: ExerciseEntry[];
  notes?: string[];
  specialInstructions?: string;
}

interface ExerciseEntry {
  name: string;
  sets: number;
  reps: string; // e.g., "8-10", "12", "AMRAP"
  restTime: number; // seconds
  weight?: string; // e.g., "RPE 8", "70%", "bodyweight"
  notes?: string[];
  modifications?: string[];
  formCues?: string[];
}

interface ProgressionData {
  type: 'percentage' | 'linear' | 'weekly' | 'custom';
  schedule: ProgressionWeek[];
  instructions: string[];
}

interface ProgressionWeek {
  week: number;
  percentage?: number;
  addedWeight?: number;
  modifications?: string[];
  notes?: string;
}

interface WorkoutMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  equipment: string[];
  programType: string;
  estimatedDuration: number; // minutes per session
}

interface PDFStructure {
  hasTableStructure: boolean;
  hasProgressionChart: boolean;
  hasExerciseNotes: boolean;
  dayFormat: 'numbered' | 'named' | 'mixed';
  exerciseFormat: 'table' | 'list' | 'mixed';
}



export class EnhancedPDFProcessor {
  private nimbusAI: NimbusAIService;

  constructor() {
    this.nimbusAI = new NimbusAIService();
    console.log('✅ EnhancedPDFProcessor initialized');
  }
  
  /**
   * Test method to verify the processor is working
   */
  public testProcessor(): void {
    console.log('🧪 ENHANCED PDF PROCESSOR TEST');
    console.log('  ✅ NimbusAI Service:', !!this.nimbusAI);
    console.log('  ✅ JSON Repair Utils imported:', typeof parseAIResponseWithFallbacks);
    console.log('  ✅ All methods available:', typeof this.processPDF);
  }

  /**
   * Main processing method - Two-stage approach
   */
  async processPDF(file: File): Promise<PDFProcessingResult> {
    const startTime = Date.now();
    const result: PDFProcessingResult = {
      template: this.createEmptyTemplate(),
      analysis: {
        processingStage: 'fallback',
        confidence: 0,
        warnings: [],
        errors: [],
        successfulStages: []
      },
      debug: {
        rawText: '',
        processingTime: 0
      }
    };

    try {
      // Stage 1: Structure Recognition & Data Extraction
      console.log('🔍 Stage 1: Structure Recognition...');
      const rawText = await this.extractTextFromPDF(file);
      result.debug.rawText = rawText;
      
      // 🐛 DEBUG: Check raw text extraction
      console.log('📄 RAW PDF TEXT LENGTH:', rawText.length);
      console.log('📄 RAW PDF TEXT SAMPLE (first 500 chars):', rawText.substring(0, 500));
      console.log('📄 RAW PDF TEXT SAMPLE (last 200 chars):', rawText.substring(Math.max(0, rawText.length - 200)));

      const structuredData = await this.performStructureRecognition(rawText);
      result.debug.structuredData = structuredData;
      result.analysis.successfulStages.push('structure_recognition');
      
      // 🐛 DEBUG: Check structure recognition results
      console.log('🏗️ STRUCTURE ANALYSIS:');
      console.log('  📊 Program Name:', structuredData.programName);
      console.log('  📅 Duration:', structuredData.duration, 'weeks');
      console.log('  🔄 Frequency:', structuredData.frequency, 'days/week');
      console.log('  📋 Workout Days Found:', structuredData.workoutDays.length);
      console.log('  💪 Total Exercises:', structuredData.workoutDays.flatMap(d => d.exercises).length);
      console.log('  🎯 Structure Type:', structuredData.structure);
      
      if (structuredData.workoutDays.length > 0) {
        console.log('  📝 First Day Sample:', {
          day: structuredData.workoutDays[0].dayName,
          exercises: structuredData.workoutDays[0].exercises.length,
          firstExercise: structuredData.workoutDays[0].exercises[0]?.name || 'None'
        });
      } else {
        console.warn('  ⚠️ NO WORKOUT DAYS FOUND - This is the main issue!');
      }

      // Stage 2: AI Enhancement (only for canonicalization and details)
      console.log('🤖 Stage 2: AI Enhancement...');
      let enhancedData: any = null;
      try {
        enhancedData = await this.performAIEnhancement(structuredData);
        result.debug.aiResponse = JSON.stringify(enhancedData);
        result.analysis.successfulStages.push('ai_enhancement');
        result.analysis.processingStage = 'ai_enhanced';
      } catch (aiError) {
        console.warn('AI enhancement failed, using structured data:', aiError);
        result.analysis.warnings.push(`AI enhancement failed: ${aiError}`);
        result.analysis.processingStage = 'structured';
      }

      // Stage 3: Template Assembly
      console.log('🔧 Stage 3: Template Assembly...');
      result.template = await this.assembleTemplate(structuredData, enhancedData);
      result.analysis.successfulStages.push('template_assembly');

      // Stage 4: Quality Validation
      console.log('✅ Stage 4: Quality Validation...');
      const validationResult = this.validateTemplate(result.template);
      result.analysis.confidence = validationResult.confidence;
      result.analysis.warnings.push(...validationResult.warnings);
      result.analysis.successfulStages.push('quality_validation');

      console.log(`✅ PDF processing completed in ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('PDF processing failed:', error);
      result.analysis.errors.push(`Processing failed: ${error}`);
      
      // Fallback: Create basic template with raw text
      result.template = this.createFallbackTemplate(result.debug.rawText);
      result.analysis.processingStage = 'fallback';
    }

    result.debug.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Stage 1: Structure Recognition - Extract structured data directly from PDF
   */
  private async performStructureRecognition(text: string): Promise<StructuredWorkoutData> {
    console.log('📊 Analyzing PDF structure...');

    const structure = this.analyzePDFStructure(text);
    const programName = this.extractProgramName(text);
    const duration = this.extractDuration(text);
    const frequency = this.extractFrequency(text);
    
    // Extract workout days using structure-aware parsing
    const workoutDays = structure.hasTableStructure 
      ? this.extractWorkoutDaysFromTables(text)
      : this.extractWorkoutDaysFromText(text);

    // Extract progression chart if present
    const progressionChart = structure.hasProgressionChart 
      ? this.extractProgressionChart(text)
      : undefined;

    const instructions = this.extractInstructions(text);
    const metadata = this.extractMetadata(text);

    return {
      programName,
      duration,
      frequency,
      workoutDays,
      progressionChart,
      instructions,
      metadata,
      structure
    };
  }

  /**
   * Analyze PDF structure to determine best extraction strategy
   */
  private analyzePDFStructure(text: string): PDFStructure {
    // Check for table indicators
    const hasTableStructure = this.detectTableStructure(text);
    
    // Check for progression chart
    const hasProgressionChart = /week\s*\d+.*\d+%|progression|increase.*weight/i.test(text);
    
    // Check for exercise notes
    const hasExerciseNotes = /form|technique|cue|note|important|tip/i.test(text);
    
    // Analyze day format
    const dayFormat = this.detectDayFormat(text);
    
    // Analyze exercise format
    const exerciseFormat = hasTableStructure ? 'table' : 
                          /[-•]\s*\w+/g.test(text) ? 'list' : 'mixed';

    return {
      hasTableStructure,
      hasProgressionChart,
      hasExerciseNotes,
      dayFormat,
      exerciseFormat
    };
  }

  /**
   * Detect if PDF has table structure
   */
  private detectTableStructure(text: string): boolean {
    // Look for table indicators
    const tableIndicators = [
      /exercise.*sets.*reps.*rest/i,
      /exercise.*sets.*reps/i,
      /sets.*reps.*rest/i,
      /\|\s*\w+\s*\|\s*\d+\s*\|/,  // Basic table structure
      /\s+sets\s+reps\s+rest\s*/i
    ];

    return tableIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Detect day format (numbered, named, or mixed)
   */
  private detectDayFormat(text: string): 'numbered' | 'named' | 'mixed' {
    const numberedDays = (text.match(/day\s*\d+/gi) || []).length;
    const namedDays = (text.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi) || []).length;
    
    if (numberedDays > namedDays) return 'numbered';
    if (namedDays > numberedDays) return 'named';
    return 'mixed';
  }

  /**
   * Extract workout days from table structure
   */
  private extractWorkoutDaysFromTables(text: string): WorkoutDay[] {
    const days: WorkoutDay[] = [];
    
    // Split into day sections
    const daySections = this.splitIntoDaySections(text);
    
    for (let i = 0; i < daySections.length; i++) {
      const section = daySections[i];
      const dayInfo = this.extractDayInfo(section, i + 1);
      
      if (dayInfo) {
        const exercises = this.extractExercisesFromTable(section);
        if (exercises.length > 0) {
          days.push({
            ...dayInfo,
            exercises
          });
        }
      }
    }

    return days;
  }

  /**
   * Split text into day sections
   */
  private splitIntoDaySections(text: string): string[] {
    // Multiple patterns for day splitting
    const patterns = [
      /(?=day\s*\d+)/gi,
      /(?=monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      /(?=workout\s*[a-z])/gi
    ];

    console.log('🔍 SPLITTING INTO DAY SECTIONS...');
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const sections = text.split(pattern).filter(s => s.trim().length > 50);
      console.log(`  Pattern ${i + 1} (${pattern}): Found ${sections.length} sections`);
      
      if (sections.length > 1) {
        console.log(`  ✅ Using pattern ${i + 1} - returning ${sections.length} sections`);
        console.log('  📝 Section previews:', sections.map((s, idx) => `Section ${idx}: ${s.substring(0, 100)}...`));
        return sections;
      }
    }

    // Fallback: return entire text as one section
    console.log('  ⚠️ No day patterns matched - using entire text as one section');
    return [text];
  }

  /**
   * Extract day information (number, name, special flags)
   */
  private extractDayInfo(section: string, fallbackNumber: number): Partial<WorkoutDay> | null {
    const lines = section.split('\n').slice(0, 5); // Check first few lines
    const headerText = lines.join(' ').toLowerCase();

    // Extract day number
    const dayNumberMatch = headerText.match(/day\s*(\d+)/);
    const dayNumber = dayNumberMatch ? parseInt(dayNumberMatch[1]) : fallbackNumber;

    // Extract day name
    let dayName = `Day ${dayNumber}`;
    const nameMatches = [
      /day\s*\d+[:\s]*(.+?)(?:\n|exercise|workout)/i,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(upper|lower|push|pull|legs?|chest|back|shoulders?)/i
    ];

    for (const pattern of nameMatches) {
      const match = headerText.match(pattern);
      if (match && match[1]) {
        dayName = match[1].trim();
        break;
      }
    }

    // Check if optional
    const isOptional = /optional|rest|off/i.test(headerText);

    // Extract special instructions
    const specialInstructions = this.extractSpecialInstructions(section);

    return {
      dayNumber,
      dayName,
      isOptional,
      specialInstructions,
      notes: []
    };
  }

  /**
   * Extract exercises from table format
   */
  private extractExercisesFromTable(section: string): ExerciseEntry[] {
    const exercises: ExerciseEntry[] = [];
    const lines = section.split('\n');

    console.log('💪 EXTRACTING EXERCISES FROM TABLE...');
    console.log('  📝 Section length:', section.length);
    console.log('  📄 Lines count:', lines.length);

    // Find table header
    let tableStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const headerPattern = /exercise.*sets.*reps|sets.*reps.*rest/i;
      if (headerPattern.test(lines[i])) {
        tableStartIndex = i + 1;
        console.log(`  📊 Found table header at line ${i}: "${lines[i]}"`);
        break;
      }
    }

    if (tableStartIndex === -1) {
      console.log('  ⚠️ No table header found, trying pattern matching...');
      return this.extractExercisesFromPatterns(section);
    }

    // Extract exercises from table rows
    console.log(`  🔍 Processing table rows from line ${tableStartIndex}...`);
    for (let i = tableStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 5) continue;

      console.log(`    Line ${i}: "${line}"`);
      const exercise = this.parseTableRow(line);
      if (exercise) {
        exercises.push(exercise);
        console.log(`    ✅ Parsed exercise: ${exercise.name} ${exercise.sets}x${exercise.reps}`);
      } else {
        console.log(`    ❌ Failed to parse line`);
      }
    }

    console.log(`  📊 Total exercises extracted: ${exercises.length}`);
    return exercises;
  }

  /**
   * Parse a table row into an exercise entry
   */
  private parseTableRow(row: string): ExerciseEntry | null {
    // Multiple table formats
    const formats = [
      // "Exercise Name | 3 | 8-10 | 90"
      /^([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)$/,
      // "Exercise Name    3    8-10    90"
      /^(\S.*?)\s+(\d+)\s+(\d+(?:-\d+)?)\s+(\d+)$/,
      // "Exercise Name 3x8-10 90s"
      /^(\S.*?)\s+(\d+)[xX×](\d+(?:-\d+)?)\s*(\d+)?s?$/
    ];

    for (const format of formats) {
      const match = row.match(format);
      if (match) {
        const name = match[1].trim();
        const sets = parseInt(match[2]) || 3;
        const reps = match[3].trim();
        const restTime = parseInt(match[4]) || 90;

        if (name.length > 2) {
          return {
            name,
            sets,
            reps,
            restTime,
            notes: [],
            formCues: []
          };
        }
      }
    }

    return null;
  }

  /**
   * Extract exercises using pattern matching (fallback)
   */
  private extractExercisesFromPatterns(section: string): ExerciseEntry[] {
    const exercises: ExerciseEntry[] = [];
    
    const patterns = [
      // "• Exercise Name 3x8-10 90s"
      /[•\-\*]\s*([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)\s*(\d+)?s?/g,
      // "Exercise Name: 3 sets of 8-10, 90s rest"
      /([A-Za-z\s]+):\s*(\d+)\s*sets?\s*of\s*(\d+(?:-\d+)?),?\s*(\d+)s?\s*rest/g,
      // "Exercise Name 3x8-10"
      /^([A-Za-z\s]+):?\s*(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)$/gm
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
            name,
            sets,
            reps,
            restTime,
            notes: [],
            formCues: []
          });
        }
      }
    }

    return exercises;
  }

  /**
   * Stage 2: AI Enhancement - Only for canonicalization and details
   */
  private async performAIEnhancement(structuredData: StructuredWorkoutData): Promise<any> {
    // Create focused prompt for exercise canonicalization
    const exerciseList = structuredData.workoutDays
      .flatMap(day => day.exercises)
      .map(ex => ex.name)
      .filter((name, index, arr) => arr.indexOf(name) === index); // unique

    const prompt = `You are a fitness database expert. Your ONLY job is to canonicalize exercise names and add missing details.

EXERCISES TO CANONICALIZE:
${exerciseList.map((name, i) => `${i + 1}. "${name}"`).join('\n')}

Return ONLY valid JSON with this exact structure:
{
  "canonicalized": [
    {
      "original": "Exact original name",
      "canonical": "Standard exercise name from fitness databases",
      "muscleGroups": ["Primary", "Secondary"],
      "equipment": ["Required equipment"],
      "difficulty": "beginner|intermediate|advanced",
      "category": "strength|cardio|flexibility|mobility"
    }
  ],
  "programType": "PPL|UpperLower|FullBody|PowerBuilding|Strength|Custom",
  "confidence": 0.95
}

RULES:
- Match original names EXACTLY as provided
- Use standard exercise names (e.g., "Barbell Back Squat" not "back squat")
- Primary muscle groups only (max 2)
- Return valid JSON ONLY, no explanation`;

    try {
      const response = await this.callAIWithRetry(prompt);
      const parsedData = parseAIResponseWithFallbacks(response, exerciseList);
      
      // Validate the response has required fields
      const validation = validateAIResponse(parsedData, ['canonicalized', 'programType', 'confidence']);
      if (!validation.valid) {
        console.warn('AI response missing fields:', validation.missing);
      }

      return parsedData;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Call AI with retry logic and timeouts
   */
  private async callAIWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI attempt ${attempt}/${maxRetries}...`);
        
        const stream = this.nimbusAI.streamMessage(prompt, { 
          type: 'json_extraction',
          priority: 'high',
          timeout: 30000
        });

        let response = '';
        const timeout = setTimeout(() => {
          throw new Error('AI response timeout');
        }, 30000);

        for await (const chunk of stream) {
          response += chunk;
        }
        
        clearTimeout(timeout);
        
        if (response.length > 50) { // Basic sanity check
          return response;
        }
        
        throw new Error('AI response too short');
        
      } catch (error) {
        console.warn(`AI attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('All AI attempts failed');
  }



  /**
   * Assemble final template from structured data and AI enhancements
   */
  private async assembleTemplate(
    structuredData: StructuredWorkoutData, 
    aiData: any = null
  ): Promise<StoredWorkoutTemplate> {
    
    const schedule: DayWorkout[] = structuredData.workoutDays.map(day => {
      const exercises = day.exercises.map(exercise => {
        // Apply AI canonicalization if available
        let exerciseName = exercise.name;
        let muscleGroups: string[] = [];
        
        if (aiData?.canonicalized) {
          const canonicalMatch = aiData.canonicalized.find(
            (c: any) => c.original === exercise.name
          );
          if (canonicalMatch) {
            exerciseName = canonicalMatch.canonical;
            muscleGroups = canonicalMatch.muscleGroups || [];
          }
        }

        return {
          id: uuidv4(),
          name: exerciseName,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restTime,
          weight: exercise.weight || '',
          notes: exercise.notes?.join('; ') || '',
          muscleGroups,
          formCues: exercise.formCues || []
        };
      });

      return {
        id: uuidv4(),
        day: day.dayName,
        name: day.dayName,
        exercises,
        notes: day.notes?.join('; ') || '',
        isOptional: day.isOptional || false,
        completedAt: undefined
      };
    });

    const template: StoredWorkoutTemplate = {
      id: uuidv4(),
      name: structuredData.programName || 'Imported Workout',
      description: `${structuredData.frequency} day workout program${structuredData.duration ? ` (${structuredData.duration} weeks)` : ''}`,
      difficulty: structuredData.metadata.difficulty,
      duration: structuredData.metadata.estimatedDuration || 60,
      category: aiData?.programType || structuredData.metadata.programType || 'custom',
      goals: structuredData.metadata.goals,
      equipment: structuredData.metadata.equipment,
      daysPerWeek: structuredData.frequency,
      estimatedTime: structuredData.metadata.estimatedDuration || 60,
      schedule,
      tags: this.generateTags(structuredData, aiData),
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date(),
      progressionChart: structuredData.progressionChart ? {
        weeks: structuredData.progressionChart.schedule.map(week => ({
          week: week.week,
          percentage: week.percentage || 100,
          notes: week.notes || ''
        }))
      } : undefined,
      instructions: structuredData.instructions.join('\n\n')
    };

    return template;
  }

  /**
   * Generate relevant tags for the template
   */
  private generateTags(structuredData: StructuredWorkoutData, aiData: any): string[] {
    const tags: string[] = [];
    
    // Add program type
    if (aiData?.programType) {
      tags.push(aiData.programType.toLowerCase());
    }
    
    // Add frequency
    tags.push(`${structuredData.frequency}-day`);
    
    // Add difficulty
    tags.push(structuredData.metadata.difficulty);
    
    // Add goals
    tags.push(...structuredData.metadata.goals.map(g => g.toLowerCase().replace(' ', '-')));
    
    // Add equipment
    tags.push(...structuredData.metadata.equipment.map(e => e.toLowerCase().replace(' ', '-')));
    
    // Add structure-based tags
    if (structuredData.structure.hasProgressionChart) {
      tags.push('progression');
    }
    
    if (structuredData.structure.hasExerciseNotes) {
      tags.push('detailed');
    }
    
    tags.push('imported');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Validate template quality and assign confidence score
   */
  private validateTemplate(template: StoredWorkoutTemplate): { confidence: number; warnings: string[] } {
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check for missing critical data
    if (!template.name || template.name === 'Imported Workout') {
      warnings.push('Program name not extracted');
      confidence -= 0.1;
    }

    if (template.schedule.length === 0) {
      warnings.push('No workout days found');
      confidence -= 0.5;
    }

    // Check exercise quality
    let totalExercises = 0;
    let exercisesWithRestTime = 0;
    let exercisesWithFormCues = 0;

    template.schedule.forEach(day => {
      totalExercises += day.exercises.length;
      exercisesWithRestTime += day.exercises.filter(ex => ex.restTime > 0).length;
      exercisesWithFormCues += day.exercises.filter(ex => ex.formCues && ex.formCues.length > 0).length;
    });

    if (totalExercises === 0) {
      warnings.push('No exercises extracted');
      confidence -= 0.6;
    }

    // Rest time coverage
    const restTimeCoverage = exercisesWithRestTime / totalExercises;
    if (restTimeCoverage < 0.8) {
      warnings.push('Missing rest times for some exercises');
      confidence -= 0.1;
    }

    // Form cues coverage
    const formCuesCoverage = exercisesWithFormCues / totalExercises;
    if (formCuesCoverage < 0.3) {
      warnings.push('Limited exercise details extracted');
      confidence -= 0.1;
    }

    // Check for progression data
    if (!template.progressionChart && template.duration > 4) {
      warnings.push('No progression chart found for multi-week program');
      confidence -= 0.15;
    }

    return {
      confidence: Math.max(0, confidence),
      warnings
    };
  }

  // Helper methods for basic extraction (keeping existing implementations)
  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('📄 Starting PDF text extraction...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('📄 PDF file loaded, size:', arrayBuffer.byteLength, 'bytes');
      
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      console.log('📄 PDF document loaded, pages:', pdf.numPages);
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`📄 Processing page ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        console.log(`📄 Page ${i} text length:`, pageText.length);
      }
      
      console.log('✅ PDF text extraction completed, total length:', fullText.length);
      return fullText;
      
    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      
      // Fallback: return file name and basic info for manual processing
      const fallbackText = `
PDF FILE: ${file.name}
SIZE: ${(file.size / 1024).toFixed(2)} KB
TYPE: ${file.type}

EXTRACTION FAILED - PLEASE MANUALLY ENTER WORKOUT DATA

Example format:
DAY 1: UPPER BODY
Exercise        Sets    Reps    Rest
Bench Press     3       8-10    90s
Pull-ups        3       6-8     90s

DAY 2: LOWER BODY  
Exercise        Sets    Reps    Rest
Squats          4       8-10    120s
Deadlifts       3       5-6     180s
`;
      
      return fallbackText;
    }
  }

  private extractProgramName(text: string): string {
    const lines = text.split('\n').slice(0, 10);
    for (const line of lines) {
      const cleaned = line.trim();
      if (cleaned.length > 5 && cleaned.length < 100 && 
          !cleaned.match(/^(day|week|exercise|sets|reps)/i)) {
        return cleaned;
      }
    }
    return 'Imported Workout Program';
  }

  private extractDuration(text: string): number {
    const patterns = [
      /(\d+)\s*weeks?/i,
      /(\d+)\s*week\s*program/i,
      /duration:?\s*(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const weeks = parseInt(match[1]);
        if (weeks >= 1 && weeks <= 52) return weeks;
      }
    }

    return 8; // Default
  }

  private extractFrequency(text: string): number {
    const dayMatches = text.match(/day\s*\d+/gi) || [];
    const uniqueDays = new Set(dayMatches.map(m => m.match(/\d+/)?.[0]));
    
    if (uniqueDays.size > 0) {
      return Math.min(7, uniqueDays.size);
    }

    // Fallback patterns
    const frequencyMatch = text.match(/(\d+)\s*days?\s*per\s*week/i);
    if (frequencyMatch) {
      return parseInt(frequencyMatch[1]);
    }

    return 3; // Default
  }

  private extractProgressionChart(text: string): ProgressionData | undefined {
    const weeks: ProgressionWeek[] = [];
    
    // Look for percentage progression
    const percentageMatches = text.matchAll(/week\s*(\d+).*?(\d+)%/gi);
    for (const match of percentageMatches) {
      weeks.push({
        week: parseInt(match[1]),
        percentage: parseInt(match[2])
      });
    }

    if (weeks.length > 0) {
      return {
        type: 'percentage',
        schedule: weeks,
        instructions: ['Follow the percentage guidelines for each week']
      };
    }

    return undefined;
  }

  private extractInstructions(text: string): string[] {
    const instructions: string[] = [];
    
    const patterns = [
      /instructions?:?\s*(.+)/gi,
      /notes?:?\s*(.+)/gi,
      /important:?\s*(.+)/gi,
      /tips?:?\s*(.+)/gi
    ];

    for (const pattern of patterns) {
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

  private extractMetadata(text: string): WorkoutMetadata {
    const lowerText = text.toLowerCase();
    
    // Difficulty
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    if (lowerText.includes('beginner')) difficulty = 'beginner';
    else if (lowerText.includes('advanced')) difficulty = 'advanced';

    // Goals
    const goals: string[] = [];
    if (lowerText.includes('strength')) goals.push('Strength');
    if (lowerText.includes('muscle') || lowerText.includes('hypertrophy')) goals.push('Muscle Gain');
    if (lowerText.includes('weight loss')) goals.push('Weight Loss');
    if (lowerText.includes('endurance')) goals.push('Endurance');
    if (goals.length === 0) goals.push('General Fitness');

    // Equipment
    const equipment: string[] = [];
    if (lowerText.includes('dumbbell')) equipment.push('Dumbbells');
    if (lowerText.includes('barbell')) equipment.push('Barbell');
    if (lowerText.includes('bench')) equipment.push('Bench');
    if (lowerText.includes('machine')) equipment.push('Machine');
    if (equipment.length === 0) equipment.push('Dumbbells', 'Barbell');

    // Program type
    let programType = 'Custom';
    if (lowerText.includes('push') && lowerText.includes('pull')) programType = 'PPL';
    else if (lowerText.includes('upper') && lowerText.includes('lower')) programType = 'Upper/Lower';
    else if (lowerText.includes('full body')) programType = 'Full Body';

    return {
      difficulty,
      goals,
      equipment,
      programType,
      estimatedDuration: 60
    };
  }

  private extractSpecialInstructions(section: string): string | undefined {
    const instructions = section.match(/(optional|light|heavy|deload|rest|note:.+)/i);
    return instructions ? instructions[0] : undefined;
  }

  private extractWorkoutDaysFromText(text: string): WorkoutDay[] {
    // Fallback for non-table formats
    return this.extractWorkoutDaysFromTables(text);
  }

  private createEmptyTemplate(): StoredWorkoutTemplate {
    return {
      id: uuidv4(),
      name: 'Empty Template',
      description: 'Failed to process PDF',
      difficulty: 'intermediate',
      duration: 60,
      category: 'custom',
      goals: ['General Fitness'],
      equipment: ['Dumbbells'],
      daysPerWeek: 3,
      estimatedTime: 60,
      schedule: [],
      tags: ['imported', 'error'],
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date()
    };
  }

  private createFallbackTemplate(rawText: string): StoredWorkoutTemplate {
    const template = this.createEmptyTemplate();
    template.name = 'PDF Import (Basic)';
    template.description = `Raw PDF content - please review and edit manually.\n\n${rawText.substring(0, 500)}...`;
    template.tags = ['imported', 'raw', 'needs-review'];
    return template;
  }
}
