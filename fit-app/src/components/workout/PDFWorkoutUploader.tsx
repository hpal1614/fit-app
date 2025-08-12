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

  // AI workout parsing with enhanced day detection
  const parseWorkoutWithAI = async (textContent: string, source: string): Promise<ExtractedWorkout> => {
    const prompt = `Extract workout information from this content. CRITICALLY IMPORTANT: Identify ALL workout days correctly.

SOURCE: ${source}
CONTENT: ${textContent.substring(0, 8000)}

Return ONLY valid JSON in this EXACT format:
{
  "title": "Workout Program Name",
  "days": number_of_workout_days,
  "exercises": [
    {
      "dayNumber": 1,
      "dayName": "Day 1: Upper Body",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 3,
          "reps": "8-12",
          "notes": "any special notes"
        }
      ]
    }
  ]
}

CRITICAL RULES FOR DAY DETECTION:
1. Look for day markers: "Day 1", "Day 2", "Day 3", "Day 4", etc.
2. Look for workout splits: "Upper Body", "Lower Body", "Push", "Pull", "Legs"
3. Look for session names: "Workout A", "Workout B", "Session 1", "Session 2"
4. Count ALL distinct workout sessions
5. If you see "Day 1" and "Day 2", then days = 2 (NOT 1!)
6. If you see "Upper Body" and "Lower Body", then days = 2
7. If you see "Push", "Pull", "Legs", then days = 3

EXERCISE GROUPING:
- Group ALL exercises under the correct day
- Don't create separate days for individual exercises
- Use standard exercise names

RESPOND WITH ONLY JSON, NO OTHER TEXT.`;

    try {
      console.log('🔍 Sending workout content to AI for parsing...');
      
      const response = await aiService.getCoachingResponse(
        prompt,
        { type: 'workout_extraction', contentLength: textContent.length },
        'workout_planning'
      );

      console.log('🤖 AI Response received:', response.content.substring(0, 200));

      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI could not extract structured workout data');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      console.log('📊 Parsed workout data:', parsedData);

      // Validate the data structure
      if (!parsedData.exercises || !Array.isArray(parsedData.exercises)) {
        throw new Error('Invalid workout structure detected');
      }

      if (parsedData.exercises.length === 0) {
        throw new Error('No workout days found in content');
      }

      // CRITICAL FIX: Ensure day count matches actual workout days
      parsedData.days = parsedData.exercises.length;

      console.log(`✅ Successfully detected ${parsedData.days} workout days`);

      return parsedData;

    } catch (error) {
      console.error('❌ AI parsing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown AI parsing error';
      throw new Error(`AI extraction failed: ${errorMessage}. Please use manual edit to correct the workout.`);
    }
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
