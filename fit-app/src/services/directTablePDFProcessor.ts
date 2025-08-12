import * as pdfjsLib from 'pdfjs-dist';
import type { StoredWorkoutTemplate, DayWorkout } from '../services/workoutStorageService';
import { v4 as uuidv4 } from 'uuid';

// Simple, reliable PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface TableRow {
  exercise: string;
  sets: string;
  reps: string;
  rest: string;
}

interface WorkoutDay {
  dayName: string;
  exercises: TableRow[];
}

interface ProcessingResult {
  template: StoredWorkoutTemplate;
  success: boolean;
  extractedDays: number;
  extractedExercises: number;
  processingTime: number;
  warnings: string[];
}

export class DirectTablePDFProcessor {
  
  /**
   * Main processing method - Direct table extraction
   */
  async processPDF(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log('🚀 DIRECT TABLE EXTRACTION - Simple & Reliable');
    
    try {
      // Step 1: Extract raw text (this works now)
      const rawText = await this.extractTextFromPDF(file);
      console.log('📄 Text extracted:', rawText.length, 'characters');
      
      // Step 2: Find day sections (simple day detection)
      const daySections = this.findDaySections(rawText);
      console.log('📅 Found', daySections.length, 'day sections');
      
      // Step 3: Extract tables from each day (direct table parsing)
      const workoutDays = this.extractTablesFromDays(daySections);
      console.log('💪 Extracted', workoutDays.reduce((sum, day) => sum + day.exercises.length, 0), 'exercises');
      
      // Step 4: Build template (no AI needed)
      const template = this.buildWorkoutTemplate(file.name, workoutDays);
      
      return {
        template,
        success: true,
        extractedDays: workoutDays.length,
        extractedExercises: workoutDays.reduce((sum, day) => sum + day.exercises.length, 0),
        processingTime: Date.now() - startTime,
        warnings: workoutDays.length === 0 ? ['No workout days found'] : []
      };
      
    } catch (error) {
      console.error('❌ Processing failed:', error);
      return {
        template: this.createFallbackTemplate(file.name),
        success: false,
        extractedDays: 0,
        extractedExercises: 0,
        processingTime: Date.now() - startTime,
        warnings: [`Processing failed: ${error}`]
      };
    }
  }

  /**
   * Extract text from PDF (this part works now)
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  }

  /**
   * Find day sections - Simple and bulletproof
   */
  private findDaySections(text: string): string[] {
    console.log('🔍 Finding day sections...');
    
    // Split by day patterns (much simpler)
    const dayPatterns = [
      /DAY\s*\d+/gi,
      /WEEK\s*\d+\s*[-:]?\s*DAY\s*\d+/gi,
      /MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY/gi
    ];
    
    for (const pattern of dayPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 1) {
        // Split on these matches
        const sections = text.split(pattern).filter(section => section.trim().length > 50);
        console.log(`✅ Split into ${sections.length} sections using pattern:`, pattern);
        return sections;
      }
    }
    
    // No day patterns? Try to find exercise tables anyway
    console.log('⚠️ No day patterns found, treating as single workout');
    return [text];
  }

  /**
   * Extract exercise tables from day sections - The core magic
   */
  private extractTablesFromDays(daySections: string[]): WorkoutDay[] {
    const workoutDays: WorkoutDay[] = [];
    
    daySections.forEach((section, index) => {
      console.log(`💪 Processing day ${index + 1}...`);
      
      // Extract day name
      const dayName = this.extractDayName(section, index + 1);
      
      // Find the table in this section
      const exercises = this.extractTableFromSection(section);
      
      if (exercises.length > 0) {
        workoutDays.push({ dayName, exercises });
        console.log(`✅ ${dayName}: ${exercises.length} exercises`);
      }
    });
    
    return workoutDays;
  }

  /**
   * Extract day name from section
   */
  private extractDayName(section: string, dayNumber: number): string {
    const lines = section.split('\n').slice(0, 5);
    
    for (const line of lines) {
      const dayMatch = line.match(/DAY\s*(\d+)[:\s]*(.*?)(?:\n|$)/i);
      if (dayMatch) {
        const description = dayMatch[2]?.trim();
        return description ? `Day ${dayMatch[1]}: ${description}` : `Day ${dayMatch[1]}`;
      }
      
      const weekdayMatch = line.match(/(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/i);
      if (weekdayMatch) {
        return weekdayMatch[1];
      }
    }
    
    return `Day ${dayNumber}`;
  }

  /**
   * Extract exercise table from section - This is where the magic happens
   */
  private extractTableFromSection(section: string): TableRow[] {
    const exercises: TableRow[] = [];
    const lines = section.split('\n');
    
    console.log('📊 Looking for exercise table...');
    
    // Find table header
    let tableStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('exercise') && (line.includes('sets') || line.includes('reps'))) {
        tableStartIndex = i + 1;
        console.log(`📋 Found table header at line ${i}: "${lines[i]}"`);
        break;
      }
    }
    
    if (tableStartIndex === -1) {
      console.log('⚠️ No table header found, trying pattern detection...');
      return this.extractExercisesWithPatterns(section);
    }
    
    // Parse table rows
    for (let i = tableStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 5) continue;
      
      // Try to parse as table row
      const exercise = this.parseTableRow(line);
      if (exercise) {
        exercises.push(exercise);
        console.log(`✅ ${exercise.exercise} | ${exercise.sets} | ${exercise.reps} | ${exercise.rest}`);
      }
    }
    
    return exercises;
  }

  /**
   * Parse a single table row - Multiple format support
   */
  private parseTableRow(line: string): TableRow | null {
    // Remove common table separators and normalize
    const cleaned = line.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Pattern 1: "Exercise Sets Reps Rest" (space separated)
    const spacePattern = /^(.+?)\s+(\d+)\s+(\d+(?:-\d+)?)\s+(\d+\w*)$/;
    const spaceMatch = cleaned.match(spacePattern);
    if (spaceMatch) {
      return {
        exercise: spaceMatch[1].trim(),
        sets: spaceMatch[2],
        reps: spaceMatch[3],
        rest: spaceMatch[4]
      };
    }
    
    // Pattern 2: "Exercise 3x8-10 90s" (compact format)
    const compactPattern = /^(.+?)\s+(\d+)x(\d+(?:-\d+)?)\s*(\d+\w*)?$/;
    const compactMatch = cleaned.match(compactPattern);
    if (compactMatch) {
      return {
        exercise: compactMatch[1].trim(),
        sets: compactMatch[2],
        reps: compactMatch[3],
        rest: compactMatch[4] || '90s'
      };
    }
    
    // Pattern 3: Tab-separated or multiple spaces
    const parts = cleaned.split(/\s{2,}|\t/);
    if (parts.length >= 3) {
      return {
        exercise: parts[0].trim(),
        sets: parts[1].replace(/\D/g, '') || '3',
        reps: parts[2].trim(),
        rest: parts[3]?.trim() || '90s'
      };
    }
    
    return null;
  }

  /**
   * Fallback: Extract exercises using simple patterns (no tables)
   */
  private extractExercisesWithPatterns(section: string): TableRow[] {
    const exercises: TableRow[] = [];
    const lines = section.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length < 5) continue;
      
      // Look for patterns like "Exercise 3x8-10" or "Exercise 3 sets"
      const patterns = [
        /^(.+?)\s+(\d+)x(\d+(?:-\d+)?)/,
        /^(.+?)\s+(\d+)\s*sets?\s*[\sx]?\s*(\d+(?:-\d+)?)/i,
        /^[\-•]\s*(.+?)\s+(\d+)x(\d+(?:-\d+)?)/
      ];
      
      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          exercises.push({
            exercise: match[1].trim(),
            sets: match[2],
            reps: match[3],
            rest: '90s'
          });
          break;
        }
      }
    }
    
    return exercises;
  }

  /**
   * Build the final workout template
   */
  private buildWorkoutTemplate(fileName: string, workoutDays: WorkoutDay[]): StoredWorkoutTemplate {
    const schedule: DayWorkout[] = workoutDays.map(day => ({
      id: uuidv4(),
      day: day.dayName,
      name: day.dayName,
      exercises: day.exercises.map(exercise => ({
        id: uuidv4(),
        name: exercise.exercise,
        sets: parseInt(exercise.sets) || 3,
        reps: exercise.reps,
        restTime: this.parseRestTime(exercise.rest),
        weight: '',
        notes: ''
      })),
      notes: '',
      completedAt: undefined
    }));

    return {
      id: uuidv4(),
      name: this.extractProgramName(fileName),
      description: `Imported from ${fileName} - ${workoutDays.length} day program`,
      difficulty: 'intermediate' as const,
      duration: 60,
      category: 'strength' as const,
      goals: ['Strength', 'Muscle Gain'],
      equipment: ['Dumbbells', 'Barbell', 'Bench'],
      daysPerWeek: workoutDays.length,
      estimatedTime: 60,
      schedule,
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date()
    };
  }

  /**
   * Parse rest time to seconds
   */
  private parseRestTime(restStr: string): number {
    const cleaned = restStr.toLowerCase().replace(/[^\d]/g, '');
    const num = parseInt(cleaned) || 90;
    
    // If less than 10, assume minutes, otherwise seconds
    return num < 10 ? num * 60 : num;
  }

  /**
   * Extract program name from filename
   */
  private extractProgramName(fileName: string): string {
    return fileName
      .replace('.pdf', '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Create fallback template if processing fails
   */
  private createFallbackTemplate(fileName: string): StoredWorkoutTemplate {
    return {
      id: uuidv4(),
      name: `${fileName} (Import Failed)`,
      description: 'PDF import failed - please add exercises manually',
      difficulty: 'intermediate' as const,
      duration: 60,
      category: 'strength' as const,
      goals: ['General Fitness'],
      equipment: ['General'],
      daysPerWeek: 1,
      estimatedTime: 60,
      schedule: [{
        id: uuidv4(),
        day: 'Day 1',
        name: 'Manual Entry Required',
        exercises: [],
        notes: 'Please add exercises manually - PDF parsing failed',
        completedAt: undefined
      }],
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date()
    };
  }
}
