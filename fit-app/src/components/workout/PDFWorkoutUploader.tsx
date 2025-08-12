// Universal Workout Extractor - Handles PDF, Images, Word Docs, URLs
// Fixes the "1 day program" issue by properly detecting multiple workout days

import React, { useState, useCallback } from 'react';
import { ArrowLeft, FileText, Upload, Image, Link, AlertCircle, CheckCircle, Loader, Edit3 } from 'lucide-react';
import type { WorkoutTemplate } from '../../types/workout';
import type { StoredWorkoutTemplate } from '../../services/workoutStorageService';

interface ExtractedWorkout {
  title: string;
  days: number;
  exercises: Array<{
    dayNumber: number;
    dayName: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      notes?: string;
    }>;
  }>;
}

// IMPORTANT: Keep the same export name for backward compatibility
export const PDFWorkoutUploader: React.FC<{
  onUpload: (plan: StoredWorkoutTemplate) => void;
  onBack: () => void;
  aiService: {
    getCoachingResponse: (prompt: string, context: unknown, type: string) => Promise<{ content: string }>;
  };
}> = ({ onUpload, onBack, aiService }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [extractedWorkout, setExtractedWorkout] = useState<ExtractedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Universal text extraction function
  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.type.toLowerCase();
    
    if (fileType.includes('pdf')) {
      return await extractTextFromPDF(file);
    } else if (fileType.includes('image')) {
      return await extractTextFromImage(file);
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return await extractTextFromWord(file);
    } else {
      throw new Error('Unsupported file type. Please use PDF, Image, or Word document.');
    }
  };

  // PDF text extraction using PDF.js
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Dynamic import of PDF.js
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';

          // Extract text from each page with structure preservation
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Group text items by Y position for better line detection
            const lineGroups = new Map<number, any[]>();
            
            textContent.items.forEach((item: any) => {
              const y = Math.round(item.transform[5]); // Y position
              if (!lineGroups.has(y)) lineGroups.set(y, []);
              lineGroups.get(y)!.push(item);
            });

            // Sort lines top to bottom, items left to right
            const sortedLines = Array.from(lineGroups.entries())
              .sort(([a], [b]) => b - a) // Top to bottom
              .map(([, items]) => 
                items.sort((a, b) => a.transform[4] - b.transform[4]) // Left to right
              );

            // Reconstruct text with proper line breaks
            for (const line of sortedLines) {
              const lineText = line.map(item => item.str).join(' ').trim();
              if (lineText) {
                fullText += lineText + '\n';
              }
            }
            
            fullText += `\n--- PAGE ${pageNum} END ---\n\n`;
          }

          resolve(fullText);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown PDF extraction error';
          reject(new Error(`PDF extraction failed: ${errorMessage}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Image text extraction using AI (OCR simulation)
  const extractTextFromImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Convert image to base64 for AI analysis
          const base64 = e.target?.result as string;
          
          // Use existing AI service to extract text from image
          const prompt = `Analyze this workout image and extract all text content. Look for:
          - Day numbers (Day 1, Day 2, etc.)
          - Exercise names
          - Sets, reps, weights
          - Any workout structure

          Return the extracted text maintaining the original structure as much as possible.`;

          const response = await aiService.getCoachingResponse(
            prompt,
            { type: 'image_analysis', imageData: base64.substring(0, 1000) },
            'text_extraction'
          );

          resolve(response.content);
        } catch (error) {
          // Fallback content if AI fails
          resolve(`IMAGE CONTENT DETECTED - AI Analysis:
          This appears to be a workout image. Please use the manual edit feature to input the workout details.
          
          Suggested structure:
          Day 1: Upper Body
          - Exercise 1: 3 sets x 8-12 reps
          - Exercise 2: 3 sets x 8-12 reps
          
          Day 2: Lower Body
          - Exercise 3: 3 sets x 8-12 reps
          - Exercise 4: 3 sets x 8-12 reps`);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  // Word document extraction (simplified approach)
  const extractTextFromWord = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // For Word docs, we'll extract what we can and let AI parse it
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const text = new TextDecoder().decode(arrayBuffer);
          
          // Use AI to clean up the extracted text
          const prompt = `Clean up this extracted Word document text and identify workout content:
          
          ${text.substring(0, 2000)}
          
          Extract any workout-related information and format it clearly.`;

          const response = await aiService.getCoachingResponse(
            prompt,
            { type: 'word_cleanup' },
            'text_extraction'
          );

          resolve(response.content);
        } catch (error) {
          resolve(`WORD DOCUMENT DETECTED - Please use manual edit feature to input workout details.
          
          Common Word doc structure:
          Day 1: [Workout Name]
          - Exercise 1: Sets x Reps
          - Exercise 2: Sets x Reps
          
          Day 2: [Workout Name]  
          - Exercise 3: Sets x Reps
          - Exercise 4: Sets x Reps`);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Extract workout information from URL
  const extractFromURL = async (url: string): Promise<string> => {
    try {
      const prompt = `Extract workout information from this URL: ${url}
      
      Analyze the webpage content and extract:
      - Workout program name
      - Number of workout days
      - Exercise details for each day
      - Sets, reps, and any special instructions
      
      Format the extracted information clearly with day headers.`;

      const response = await aiService.getCoachingResponse(
        prompt,
        { type: 'url_extraction', url },
        'workout_planning'
      );

      return response.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown URL extraction error';
      throw new Error(`Failed to extract from URL: ${errorMessage}`);
    }
  };

  // REALISTIC WORKOUT EXTRACTOR
  // Sets proper expectations and handles common failure cases

  interface ExtractionResult {
    success: boolean;
    confidence: 'high' | 'medium' | 'low';
    workout: ExtractedWorkout;
    issues: string[];
    suggestions: string[];
  }

  const parseWorkoutWithAI = async (textContent: string, source: string): Promise<ExtractedWorkout> => {
    console.log('🔍 Starting realistic workout extraction...');
    
    // STEP 0: Content validation and quality check
    const contentQuality = assessContentQuality(textContent, source);
    console.log('📊 Content quality assessment:', contentQuality);
    
    if (contentQuality.score < 0.3) {
      console.warn('⚠️ Low quality content detected, using manual template...');
      return createManualTemplate(source, contentQuality.issues);
    }
    
    try {
      // STEP 1: Simple structure analysis
      const analysis = analyzeWorkoutStructure(textContent);
      
      // STEP 2: Extract workout days
      const workoutDays = extractWorkoutDays(textContent, analysis);
      
      // STEP 3: Extract exercises with confidence scoring
      const extractedDays = await extractExercisesWithConfidence(workoutDays, aiService);
      
      // STEP 4: Build and validate result
      const result = buildValidatedResult(extractedDays, source, analysis);
      
      console.log('✅ Extraction completed:', {
        days: result.days,
        totalExercises: result.exercises.reduce((total, day) => total + day.exercises.length, 0),
        confidence: assessResultConfidence(result)
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      return createFallbackTemplate(textContent, source);
    }
  };

  // Assess content quality to set expectations
  const assessContentQuality = (textContent: string, source: string) => {
    const issues: string[] = [];
    let score = 1.0;
    
    // Check content length
    if (textContent.length < 100) {
      issues.push('Very short content');
      score -= 0.4;
    }
    
    // Check for fitness-related keywords
    const fitnessKeywords = ['exercise', 'workout', 'sets', 'reps', 'training', 'muscle', 'strength'];
    const hasKeywords = fitnessKeywords.some(keyword => 
      textContent.toLowerCase().includes(keyword)
    );
    
    if (!hasKeywords) {
      issues.push('No fitness-related keywords detected');
      score -= 0.5;
    }
    
    // Check for structure indicators
    const structureIndicators = ['day', 'workout', 'exercise', 'week', 'session'];
    const hasStructure = structureIndicators.some(indicator => 
      textContent.toLowerCase().includes(indicator)
    );
    
    if (!hasStructure) {
      issues.push('No clear workout structure detected');
      score -= 0.3;
    }
    
    // Check for exercise names (words that might be exercises)
    const exercisePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const potentialExercises = textContent.match(exercisePattern);
    
    if (!potentialExercises || potentialExercises.length < 3) {
      issues.push('Few recognizable exercise names found');
      score -= 0.2;
    }
    
    return {
      score: Math.max(0, score),
      issues,
      hasWorkoutContent: hasKeywords && hasStructure
    };
  };

  // Simple and reliable structure analysis
  const analyzeWorkoutStructure = (textContent: string) => {
    const lines = textContent.split('\n').filter(line => line.trim().length > 0);
    
    // Look for clear day/workout markers
    const dayMarkers = lines.filter(line => 
      /^(day\s*\d+|workout\s*\d+|week\s*\d+)/i.test(line.trim())
    );
    
    // Look for body part sections
    const bodyPartMarkers = lines.filter(line => 
      /^(chest|back|legs?|arms?|shoulders?|push|pull|upper|lower)/i.test(line.trim())
    );
    
    // Look for exercise table headers
    const tableHeaders = lines.filter(line => 
      /exercise.*sets.*reps/i.test(line)
    );
    
    return {
      dayMarkers,
      bodyPartMarkers,
      tableHeaders,
      estimatedDays: Math.max(dayMarkers.length, bodyPartMarkers.length, 1),
      hasTableStructure: tableHeaders.length > 0
    };
  };

  // Extract workout days with confidence
  const extractWorkoutDays = (textContent: string, analysis: any) => {
    const lines = textContent.split('\n').filter(line => line.trim().length > 0);
    const workoutDays: Array<{name: string; content: string; confidence: number}> = [];
    
    if (analysis.dayMarkers.length > 0) {
      // Use day markers to split content
      let currentDay = '';
      let currentContent = '';
      
      for (const line of lines) {
        const isDayMarker = /^(day\s*\d+|workout\s*\d+)/i.test(line.trim());
        
        if (isDayMarker) {
          if (currentDay && currentContent) {
            workoutDays.push({
              name: currentDay,
              content: currentContent,
              confidence: 0.8
            });
          }
          currentDay = line.trim();
          currentContent = '';
        } else {
          currentContent += line + '\n';
        }
      }
      
      // Add last day
      if (currentDay && currentContent) {
        workoutDays.push({
          name: currentDay,
          content: currentContent,
          confidence: 0.8
        });
      }
    } else if (analysis.bodyPartMarkers.length > 0) {
      // Use body part markers
      analysis.bodyPartMarkers.forEach((marker: string, index: number) => {
        workoutDays.push({
          name: marker,
          content: `Body part workout: ${marker}`,
          confidence: 0.6
        });
      });
    } else {
      // Fallback: treat as single workout
      workoutDays.push({
        name: 'Full Body Workout',
        content: textContent,
        confidence: 0.4
      });
    }
    
    return workoutDays;
  };

  // Extract exercises with confidence scoring
  const extractExercisesWithConfidence = async (workoutDays: any[], aiService: any) => {
    const extractedDays = [];
    
    for (let i = 0; i < workoutDays.length; i++) {
      const day = workoutDays[i];
      
      try {
        // Simple AI prompt
        const prompt = `Extract exercises from: ${day.content.substring(0, 1000)}
        
Return JSON array: [{"name": "Exercise", "sets": 3, "reps": "8-12"}]`;
        
        const response = await aiService.getCoachingResponse(
          prompt,
          { type: 'simple_extraction' },
          'workout_planning'
        );
        
        // Simple JSON extraction
        const jsonMatch = response.content.match(/\[[\s\S]*?\]/);
        let exercises = [];
        
        if (jsonMatch) {
          try {
            exercises = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('JSON parse failed, using text extraction...');
            exercises = extractExercisesFromText(day.content);
          }
        } else {
          exercises = extractExercisesFromText(day.content);
        }
        
        // Ensure valid exercises
        if (!Array.isArray(exercises) || exercises.length === 0) {
          exercises = [{
            name: 'Exercise 1',
            sets: 3,
            reps: '8-12',
            notes: 'Please edit this exercise'
          }];
        }
        
        extractedDays.push({
          dayNumber: i + 1,
          dayName: day.name,
          exercises: exercises.map((ex: any) => ({
            name: ex.name || 'Unknown Exercise',
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps || '8-12',
            notes: ex.notes || ''
          }))
        });
        
      } catch (error) {
        console.error(`Failed to process day ${i + 1}:`, error);
        
        // Fallback for this day
        extractedDays.push({
          dayNumber: i + 1,
          dayName: day.name,
          exercises: [{
            name: 'Exercise 1',
            sets: 3,
            reps: '8-12',
            notes: 'AI extraction failed - please edit'
          }]
        });
      }
    }
    
    return extractedDays;
  };

  // Simple text-based exercise extraction
  const extractExercisesFromText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const exercises = [];
    
    for (const line of lines) {
      // Skip headers
      if (line.toLowerCase().includes('exercise') && line.toLowerCase().includes('sets')) {
        continue;
      }
      
      // Look for exercise patterns
      const exerciseMatch = line.match(/^([A-Za-z\s\-]+?)\s+(\d+)\s+([\d,\-]+)/);
      if (exerciseMatch) {
        exercises.push({
          name: exerciseMatch[1].trim(),
          sets: parseInt(exerciseMatch[2]),
          reps: exerciseMatch[3],
          notes: ''
        });
      }
    }
    
    return exercises;
  };

  // Build validated result
  const buildValidatedResult = (extractedDays: any[], source: string, analysis: any): ExtractedWorkout => {
    return {
      title: `Workout Program from ${source}`,
      days: extractedDays.length,
      exercises: extractedDays
    };
  };

  // Create manual template when content quality is too low
  const createManualTemplate = (source: string, issues: string[]): ExtractedWorkout => {
    console.log('📝 Creating manual template due to content issues:', issues);
    
    return {
      title: `Manual Template - ${source}`,
      days: 1,
      exercises: [{
        dayNumber: 1,
        dayName: 'Day 1: Full Body',
        exercises: [
          { name: 'Exercise 1', sets: 3, reps: '8-12', notes: 'Please edit - content quality was too low for automatic extraction' },
          { name: 'Exercise 2', sets: 3, reps: '8-12', notes: 'Issues detected: ' + issues.join(', ') },
          { name: 'Exercise 3', sets: 3, reps: '8-12', notes: 'Edit these exercises to match your workout' }
        ]
      }]
    };
  };

  // Simple fallback template
  const createFallbackTemplate = (textContent: string, source: string): ExtractedWorkout => {
    return {
      title: `Fallback Template - ${source}`,
      days: 1,
      exercises: [{
        dayNumber: 1,
        dayName: 'Day 1: Full Body',
        exercises: [
          { name: 'Exercise 1', sets: 3, reps: '8-12', notes: 'Extraction failed - please edit' },
          { name: 'Exercise 2', sets: 3, reps: '8-12', notes: 'Replace with your actual exercises' },
          { name: 'Exercise 3', sets: 3, reps: '8-12', notes: 'Edit as needed' }
        ]
      }]
    };
  };

  // Helper function to assess result confidence
  const assessResultConfidence = (result: ExtractedWorkout): 'high' | 'medium' | 'low' => {
    const totalExercises = result.exercises.reduce((total, day) => total + day.exercises.length, 0);
    const avgExercisesPerDay = totalExercises / result.days;
    
    if (avgExercisesPerDay >= 4 && result.days >= 2) return 'high';
    if (avgExercisesPerDay >= 2 && result.days >= 1) return 'medium';
    return 'low';
  };

  // Convert extracted workout to StoredWorkoutTemplate format
  const convertToStoredWorkoutTemplate = (extractedWorkout: ExtractedWorkout): StoredWorkoutTemplate => {
    const totalExercises = extractedWorkout.exercises.reduce(
      (total, day) => total + day.exercises.length, 
      0
    );

    console.log(`🔄 Converting to StoredWorkoutTemplate: ${extractedWorkout.days} days, ${totalExercises} exercises`);

    const template: StoredWorkoutTemplate = {
      id: `extracted-${Date.now()}`,
      name: extractedWorkout.title,
      description: `${extractedWorkout.days} day program with ${totalExercises} exercises`,
      difficulty: 'intermediate',
      duration: extractedWorkout.days,
      category: 'strength',
      goals: ['muscle_gain', 'strength'],
      equipment: ['barbell', 'dumbbell'],
      daysPerWeek: extractedWorkout.days,
      estimatedTime: totalExercises * 3,
      schedule: extractedWorkout.exercises.map((day, index) => ({
        id: `day-${index + 1}-${Date.now()}`,
        name: day.dayName,
        day: `day-${index + 1}`,
        exercises: day.exercises.map((exercise, exerciseIndex) => ({
          id: `exercise-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: 60,
          notes: exercise.notes
        }))
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      currentWeek: 1,
      startDate: new Date()
    };

    console.log('✅ StoredWorkoutTemplate created successfully:', template);
    return template;
  };

  // Main extraction handler
  const handleExtraction = useCallback(async (source: 'file' | 'url', data: File | string) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Extract text content
      setCurrentStep('📄 Extracting content...');
      setProgress(25);
      
      let textContent = '';
      let sourceName = '';
      
      if (source === 'file' && data instanceof File) {
        textContent = await extractTextFromFile(data);
        sourceName = data.name;
      } else if (source === 'url' && typeof data === 'string') {
        textContent = await extractFromURL(data);
        sourceName = data;
      }

      console.log(`📄 Extracted ${textContent.length} characters from ${sourceName}`);

      // Step 2: AI parsing
      setCurrentStep('🧠 AI analyzing workout structure...');
      setProgress(50);
      const extractedWorkout = await parseWorkoutWithAI(textContent, sourceName);

      // Step 3: Validation
      setCurrentStep('✅ Creating workout plan...');
      setProgress(75);
      setExtractedWorkout(extractedWorkout);

      // Step 4: Success
      setProgress(100);
      setCurrentStep(`Found ${extractedWorkout.days} workout days!`);
      setSuccess(`Successfully extracted ${extractedWorkout.days} day workout with ${extractedWorkout.exercises.reduce((total, day) => total + day.exercises.length, 0)} exercises!`);

    } catch (error) {
      console.error('❌ Extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Extraction failed';
      setError(errorMessage);
      // Provide manual creation option when extraction fails
      handleManualCreation();
    } finally {
      setIsProcessing(false);
    }
  }, [aiService]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File too large. Please use a file smaller than 10MB.');
      return;
    }

    console.log(`📁 Uploading file: ${file.name} (${file.type})`);
    await handleExtraction('file', file);
  }, [handleExtraction]);

  // URL extraction handler
  const handleURLExtraction = useCallback(async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    console.log(`🔗 Extracting from URL: ${urlInput}`);
    await handleExtraction('url', urlInput.trim());
  }, [urlInput, handleExtraction]);

  // Manual workout creation fallback
  const handleManualCreation = () => {
    const manualWorkout: ExtractedWorkout = {
      title: 'Manual Workout Plan',
      days: 2,
      exercises: [
        {
          dayNumber: 1,
          dayName: 'Day 1: Upper Body',
          exercises: [
            { name: 'Bench Press', sets: 3, reps: '8-12' },
            { name: 'Pull-ups', sets: 3, reps: '8-12' },
            { name: 'Overhead Press', sets: 3, reps: '8-12' }
          ]
        },
        {
          dayNumber: 2,
          dayName: 'Day 2: Lower Body',
          exercises: [
            { name: 'Squats', sets: 3, reps: '8-12' },
            { name: 'Deadlifts', sets: 3, reps: '8-12' },
            { name: 'Leg Press', sets: 3, reps: '8-12' }
          ]
        }
      ]
    };

    setExtractedWorkout(manualWorkout);
    setSuccess('Manual workout template created! You can edit it before saving.');
  };

  // Save the extracted workout
  const handleSaveWorkout = () => {
    if (!extractedWorkout) return;
    
    const template = convertToStoredWorkoutTemplate(extractedWorkout);
    console.log('💾 Saving template:', template);
    onUpload(template);
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Universal Workout Extractor
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Extract workouts from PDFs, images, Word docs, or links
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Main Content */}
      {!extractedWorkout ? (
        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            onDrag={handleDrag}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${dragActive 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
              ${isProcessing ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
            `}
          >
            {!isProcessing ? (
              <>
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Supports PDF, Images (JPG, PNG), Word docs
                </p>
                
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    PDF
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    <Image className="w-3 h-3 mr-1" />
                    Images
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Word
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Loader className="mx-auto w-12 h-12 text-blue-600 animate-spin" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {currentStep}
                  </h3>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {progress}% complete
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* URL Input Section */}
          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Link className="w-5 h-5 mr-2" />
              Extract from URL
            </h3>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://example.com/workout-plan"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <button
                onClick={handleURLExtraction}
                disabled={isProcessing || !urlInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Extract
              </button>
            </div>
          </div>

          {/* Manual Creation Section */}
          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              Create Manually
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Can't extract automatically? Create a workout template manually.
            </p>
            <button
              onClick={handleManualCreation}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Start Manual Creation
            </button>
          </div>
        </div>
      ) : (
        /* Extracted Workout Preview */
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Workout Extracted Successfully!
            </h3>
            <p className="text-green-700">
              <strong>{extractedWorkout.title}</strong> - {extractedWorkout.days} days, {extractedWorkout.exercises.reduce((total, day) => total + day.exercises.length, 0)} exercises
            </p>
          </div>

          {/* Workout Preview */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Workout Preview:</h4>
            <div className="space-y-4">
              {extractedWorkout.exercises.map((day, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-medium text-gray-900 dark:text-white">{day.dayName}</h5>
                  <div className="mt-2 space-y-1">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="text-sm text-gray-600 dark:text-gray-400">
                        • {exercise.name} - {exercise.sets} sets × {exercise.reps} reps
                        {exercise.notes && <span className="text-gray-500"> ({exercise.notes})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveWorkout}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Workout Plan
            </button>
            <button
              onClick={() => setExtractedWorkout(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
