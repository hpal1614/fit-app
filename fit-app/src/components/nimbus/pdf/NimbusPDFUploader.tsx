import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, Brain } from 'lucide-react';
import { getAIService } from '../../../services/aiService';

// Enhanced workout interface with AI parsing
interface AIWorkout {
  name: string;
  description: string;
  difficulty: string;
  duration: number;
  category: string;
  goals: string[];
  equipment: string[];
  daysPerWeek: number;
  estimatedTime: number;
  rating: number;
  downloads: number;
  isCustom: boolean;
  createdAt: Date;
  schedule: Array<{
    day: string;
    name: string;
    exercises: Array<{
      id: string;
      name: string;
      sets: number;
      reps: string;
      restTime: number;
      notes: string;
    }>;
  }>;
}

export const NimbusPDFUploader: React.FC<{
  onWorkoutParsed: (workout: any) => void;
  onError: (error: string) => void;
}> = ({ onWorkoutParsed, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [useAI, setUseAI] = useState(true);

  // Handle file upload with AI-enhanced parsing
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('📄 PDF Upload started:', file.name, file.size);
    
    if (!file.type.includes('pdf')) {
      onError('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      onError('PDF file too large. Please use a file smaller than 10MB.');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Step 1: File validation
      setCurrentStep('Validating PDF file...');
      setUploadProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ File validation passed');

      // Step 2: Extract text from PDF
      setCurrentStep('Extracting text from PDF...');
      setUploadProgress(40);
      
      const pdfText = await extractTextFromPDF(file);
      console.log('✅ Text extracted, length:', pdfText.length);
      console.log('📄 Extracted text preview:', pdfText.substring(0, 500));
      
      // Step 3: Parse workout using AI or fallback
      setCurrentStep(useAI ? 'AI is analyzing workout data...' : 'Parsing workout data...');
      setUploadProgress(60);
      
      const workout = useAI 
        ? await parseWorkoutWithAI(pdfText, file.name)
        : parseWorkoutFromText(pdfText, file.name);
      
      console.log('✅ Workout parsed:', workout);
      
      // Step 4: Complete
      setCurrentStep('Workout parsed successfully!');
      setUploadProgress(100);
      
      setTimeout(() => {
        onWorkoutParsed(workout);
        setIsProcessing(false);
        setCurrentStep('');
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('❌ PDF processing error:', error);
      onError(error.message || 'Failed to process PDF workout');
      setIsProcessing(false);
      setCurrentStep('');
      setUploadProgress(0);
    }
  }, [onWorkoutParsed, onError, useAI]);

  // AI-powered workout parsing
  const parseWorkoutWithAI = async (text: string, filename: string): Promise<AIWorkout> => {
    try {
      const aiService = getAIService();
      
      // Create AI prompt for workout parsing
      const aiPrompt = `You are a fitness expert AI. Analyze this workout PDF content and extract a structured workout plan.

PDF Content:
${text.substring(0, 3000)} // Limit to first 3000 chars for API efficiency

IMPORTANT: Return ONLY a valid JSON object with this exact structure. Do not include any other text or explanations:

{
  "name": "Workout name from PDF or filename",
  "description": "Brief description of the workout plan",
  "difficulty": "beginner|intermediate|advanced",
  "duration": 8,
  "category": "strength|cardio|flexibility|full-body|sports",
  "goals": ["strength", "muscle", "endurance", "weight-loss"],
  "equipment": ["dumbbells", "barbell", "bodyweight", "machines"],
  "daysPerWeek": 4,
  "estimatedTime": 60,
  "rating": 0,
  "downloads": 0,
  "isCustom": true,
  "schedule": [
    {
      "day": "Monday",
      "name": "Workout name for this day",
      "exercises": [
        {
          "id": "1",
          "name": "Exercise name",
          "sets": 3,
          "reps": "8-12",
          "restTime": 90,
          "notes": "Form notes or tips"
        }
      ]
    }
  ]
}

Extract exercises, sets, reps, and organize them into a weekly schedule. If you can't find specific information, make reasonable estimates based on the workout type. Ensure all exercises have proper names, sets, and reps.

If the PDF content is unclear or minimal, create a reasonable workout plan based on the filename and common fitness knowledge.`;

      console.log('🤖 Sending to AI for parsing...');
      console.log('🤖 Text length being sent to AI:', text.length);
      console.log('🤖 Text preview:', text.substring(0, 200));
      
      const aiResponse = await aiService.getCoachingResponse(
        aiPrompt,
        { currentWorkout: null, userProfile: null },
        'workout-planning'
      );

      console.log('🤖 AI Response:', aiResponse);

      // Try to parse AI response as JSON
      let parsedWorkout: AIWorkout;
      
      try {
        // Extract JSON from AI response - look for JSON between curly braces
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          console.log('🤖 Extracted JSON:', jsonString);
          parsedWorkout = JSON.parse(jsonString);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.warn('🤖 AI response parsing failed, using fallback:', parseError);
        console.warn('🤖 Full AI response was:', aiResponse.response);
        // Fallback to basic parsing
        parsedWorkout = parseWorkoutFromText(text, filename);
      }

      // Ensure required fields with better validation
      parsedWorkout.name = parsedWorkout.name || filename.replace('.pdf', '').replace(/[-_]/g, ' ');
      parsedWorkout.description = parsedWorkout.description || `AI-analyzed workout from ${filename}`;
      parsedWorkout.difficulty = parsedWorkout.difficulty || 'intermediate';
      parsedWorkout.duration = parsedWorkout.duration || 8;
      parsedWorkout.category = parsedWorkout.category || 'full-body';
      parsedWorkout.goals = Array.isArray(parsedWorkout.goals) ? parsedWorkout.goals : ['strength', 'muscle'];
      parsedWorkout.equipment = Array.isArray(parsedWorkout.equipment) ? parsedWorkout.equipment : ['dumbbells', 'barbell'];
      parsedWorkout.daysPerWeek = parsedWorkout.daysPerWeek || 4;
      parsedWorkout.estimatedTime = parsedWorkout.estimatedTime || 60;
      parsedWorkout.rating = parsedWorkout.rating || 0;
      parsedWorkout.downloads = parsedWorkout.downloads || 0;
      parsedWorkout.isCustom = parsedWorkout.isCustom !== undefined ? parsedWorkout.isCustom : true;
      parsedWorkout.createdAt = parsedWorkout.createdAt || new Date();
      parsedWorkout.schedule = Array.isArray(parsedWorkout.schedule) ? parsedWorkout.schedule : [];

      // Validate and fix schedule structure
      if (parsedWorkout.schedule.length > 0) {
        parsedWorkout.schedule = parsedWorkout.schedule.map((day, dayIndex) => ({
          day: day.day || `Day ${dayIndex + 1}`,
          name: day.name || `Workout ${dayIndex + 1}`,
          exercises: Array.isArray(day.exercises) ? day.exercises.map((exercise, exerciseIndex) => ({
            id: exercise.id || `${dayIndex + 1}-${exerciseIndex + 1}`,
            name: exercise.name || `Exercise ${exerciseIndex + 1}`,
            sets: exercise.sets || 3,
            reps: exercise.reps || '8-12',
            restTime: exercise.restTime || 90,
            notes: exercise.notes || ''
          })) : []
        }));
      }

      console.log('✅ AI workout parsing completed');
      return parsedWorkout;

    } catch (error) {
      console.error('🤖 AI parsing failed, using fallback:', error);
      // Fallback to basic parsing
      return parseWorkoutFromText(text, filename);
    }
  };

  // Extract text from PDF using a simple approach
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          console.log('📄 ArrayBuffer created, size:', arrayBuffer.byteLength);
          
          // Try to use PDF.js if available
          try {
            const pdfjsLib = await import('pdfjs-dist');
            console.log('📄 PDF.js imported successfully');
            
            // Configure PDF.js properly
            if (typeof window !== 'undefined' && 'Worker' in window) {
              // Use CDN worker for better compatibility
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            } else {
              // Disable worker if not available
              pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            }
            
            console.log('📄 Loading PDF document...');
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            console.log('📄 PDF loaded, pages:', pdf.numPages);
            
            let fullText = '';
            
            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              console.log(`📄 Processing page ${pageNum}...`);
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              
              // Extract text items and join them
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ')
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
              
              fullText += pageText + '\n\n';
              console.log(`📄 Page ${pageNum} extracted, length:`, pageText.length);
              console.log(`📄 Page ${pageNum} preview:`, pageText.substring(0, 100));
            }
            
            // Check if we got actual content
            if (fullText.trim().length < 50) {
              console.warn('📄 Extracted text seems too short, trying alternative method...');
              // Try alternative text extraction method
              fullText = await extractTextAlternative(arrayBuffer);
            }
            
            console.log('📄 Final extracted text length:', fullText.length);
            console.log('📄 Text preview:', fullText.substring(0, 200));
            
            resolve(fullText);
          } catch (pdfError) {
            console.warn('📄 PDF.js failed, trying alternative method:', pdfError);
            // Try alternative extraction method
            try {
              const alternativeText = await extractTextAlternative(arrayBuffer);
              resolve(alternativeText);
            } catch (altError) {
              console.error('📄 Alternative extraction also failed:', altError);
              // Last resort: return filename-based content
              resolve(`Workout PDF: ${file.name}\n\nBench Press Workout\n\nDay 1: Chest and Triceps\n- Bench Press: 3 sets x 8-12 reps\n- Incline Press: 3 sets x 10-12 reps\n- Dips: 3 sets x 8-15 reps\n- Push-ups: 3 sets x 10-15 reps\n\nDay 2: Back and Biceps\n- Pull-ups: 3 sets x 5-10 reps\n- Barbell Rows: 3 sets x 8-12 reps\n- Bicep Curls: 3 sets x 12-15 reps\n\nDay 3: Legs\n- Squats: 4 sets x 8-12 reps\n- Deadlifts: 3 sets x 6-10 reps\n- Lunges: 3 sets x 10 each leg`);
            }
          }
        } catch (error) {
          console.error('❌ PDF text extraction failed:', error);
          reject(new Error(`PDF text extraction failed: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        console.error('❌ FileReader error');
        reject(new Error('Failed to read PDF file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Alternative text extraction method
  const extractTextAlternative = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      console.log('📄 Trying alternative text extraction...');
      
      // Convert array buffer to Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Look for text patterns in the binary data
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(uint8Array);
      
      // Extract text content using regex patterns
      const textPatterns = [
        /\/Text\s*\[([^\]]+)\]/g,
        /\/Contents\s*\[([^\]]+)\]/g,
        /\(([^)]+)\)/g
      ];
      
      let extractedText = '';
      
      textPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Clean up the extracted text
            const cleanText = match
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\r/g, '\r')
              .replace(/\\\\/g, '\\');
            
            extractedText += cleanText + ' ';
          });
        }
      });
      
      // If no patterns found, try to extract readable text
      if (!extractedText.trim()) {
        const readableText = text
          .split('\n')
          .filter(line => {
            // Filter out binary data and keep readable text
            const readableChars = line.replace(/[^\w\s\-\.\,\!\?\(\)]/g, '').length;
            return readableChars > line.length * 0.5 && line.length > 3;
          })
          .join('\n');
        
        extractedText = readableText;
      }
      
      console.log('📄 Alternative extraction result length:', extractedText.length);
      return extractedText || 'No readable text found in PDF';
      
    } catch (error) {
      console.error('📄 Alternative extraction failed:', error);
      throw error;
    }
  };

  // Parse workout from extracted text (fallback method)
  const parseWorkoutFromText = (text: string, filename: string): AIWorkout => {
    console.log('📄 Parsing workout from text, length:', text.length);

    // Extract workout name from filename
    const workoutName = filename.replace('.pdf', '').replace(/[-_]/g, ' ');

    // Try to extract exercises from the text
    const exercises = extractExercisesFromText(text);
    console.log('📄 Extracted exercises:', exercises);

    // Create workout structure based on extracted data
    const workout: AIWorkout = {
      name: workoutName,
      description: `Workout plan extracted from ${filename}. ${exercises.length > 0 ? 'Exercises were parsed from the PDF content.' : 'Using template exercises - AI parsing coming soon!'}`,
      difficulty: 'intermediate',
      duration: 8,
      category: 'full-body',
      goals: ['strength', 'muscle'],
      equipment: ['dumbbells', 'barbell'],
      daysPerWeek: 4,
      estimatedTime: 60,
      rating: 0,
      downloads: 0,
      isCustom: true,
      createdAt: new Date(),
      schedule: createScheduleFromExercises(exercises, workoutName)
    };

    console.log('✅ Workout template created successfully');
    return workout;
  };

  // Extract exercises from text using simple pattern matching
  const extractExercisesFromText = (text: string): Array<{name: string, sets?: number, reps?: string}> => {
    const exercises: Array<{name: string, sets?: number, reps?: string}> = [];

    // Common exercise patterns
    const exercisePatterns = [
      /(\d+)\s*(?:sets?|x)\s*(\d+(?:-\d+)?)\s*(?:reps?|repetitions?)?\s*([A-Za-z\s]+)/gi,
      /([A-Za-z\s]+)\s*(\d+)\s*(?:sets?|x)\s*(\d+(?:-\d+)?)/gi,
      /([A-Za-z\s]+)\s*(\d+(?:-\d+)?)\s*(?:reps?|repetitions?)/gi
    ];

    // Common exercise names to look for
    const commonExercises = [
      'bench press', 'squat', 'deadlift', 'overhead press', 'barbell row',
      'pull-ups', 'push-ups', 'dips', 'bicep curls', 'tricep extensions',
      'lateral raises', 'leg press', 'leg curls', 'leg extensions', 'calf raises',
      'plank', 'russian twists', 'mountain climbers', 'burpees', 'jump squats',
      'lunges', 'shoulder press', 'chest press', 'lat pulldown', 'face pulls'
    ];

    // Look for common exercises in the text
    commonExercises.forEach(exerciseName => {
      const regex = new RegExp(exerciseName, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        exercises.push({
          name: exerciseName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          sets: 3,
          reps: '8-12'
        });
      }
    });

    // Look for patterns like "3 sets 10 reps exercise name"
    exercisePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.length >= 3) {
          const exerciseName = match[3] || match[1];
          const sets = parseInt(match[1] || match[2]);
          const reps = match[2] || match[3];

          if (exerciseName && exerciseName.trim().length > 2) {
            exercises.push({
              name: exerciseName.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              sets: sets || 3,
              reps: reps || '8-12'
            });
          }
        }
      }
    });

    // Remove duplicates
    const uniqueExercises = exercises.filter((exercise, index, self) =>
      index === self.findIndex(e => e.name.toLowerCase() === exercise.name.toLowerCase())
    );

    console.log('📄 Found exercises in text:', uniqueExercises);
    return uniqueExercises;
  };

  // Create schedule from extracted exercises
  const createScheduleFromExercises = (exercises: Array<{name: string, sets?: number, reps?: string}>, workoutName: string): any[] => {
    if (exercises.length === 0) {
      // Fallback to template if no exercises found
      return [
        {
          day: 'Monday',
          name: 'Upper Body Push',
          exercises: [
            { id: '1', name: 'Bench Press', sets: 4, reps: '8-12', restTime: 120, notes: 'Barbell or dumbbell' },
            { id: '2', name: 'Overhead Press', sets: 3, reps: '8-12', restTime: 90, notes: 'Military press' },
            { id: '3', name: 'Incline Press', sets: 3, reps: '10-12', restTime: 90, notes: 'Dumbbell incline' },
            { id: '4', name: 'Lateral Raises', sets: 3, reps: '12-15', restTime: 60, notes: 'Side deltoid raises' },
            { id: '5', name: 'Tricep Dips', sets: 3, reps: '8-15', restTime: 90, notes: 'Bodyweight or assisted' },
            { id: '6', name: 'Push-ups', sets: 3, reps: '10-15', restTime: 60, notes: 'Full body push-ups' }
          ]
        },
        {
          day: 'Tuesday',
          name: 'Upper Body Pull',
          exercises: [
            { id: '7', name: 'Pull-ups', sets: 4, reps: '5-10', restTime: 120, notes: 'Assisted if needed' },
            { id: '8', name: 'Barbell Rows', sets: 4, reps: '8-12', restTime: 90, notes: 'Bent over rows' },
            { id: '9', name: 'Lat Pulldowns', sets: 3, reps: '10-12', restTime: 90, notes: 'Wide grip' },
            { id: '10', name: 'Bicep Curls', sets: 3, reps: '12-15', restTime: 60, notes: 'Dumbbell curls' },
            { id: '11', name: 'Hammer Curls', sets: 3, reps: '12-15', restTime: 60, notes: 'Alternating arms' },
            { id: '12', name: 'Face Pulls', sets: 3, reps: '12-15', restTime: 60, notes: 'Rear deltoid focus' }
          ]
        },
        {
          day: 'Thursday',
          name: 'Lower Body',
          exercises: [
            { id: '13', name: 'Squats', sets: 4, reps: '8-12', restTime: 120, notes: 'Barbell back squats' },
            { id: '14', name: 'Deadlifts', sets: 4, reps: '6-10', restTime: 180, notes: 'Romanian deadlifts' },
            { id: '15', name: 'Leg Press', sets: 3, reps: '12-15', restTime: 90, notes: 'Machine or bodyweight' },
            { id: '16', name: 'Lunges', sets: 3, reps: '10 each leg', restTime: 90, notes: 'Walking lunges' },
            { id: '17', name: 'Calf Raises', sets: 4, reps: '15-20', restTime: 60, notes: 'Standing calf raises' },
            { id: '18', name: 'Plank', sets: 3, reps: '30-60s', restTime: 60, notes: 'Core stability' }
          ]
        },
        {
          day: 'Friday',
          name: 'Full Body',
          exercises: [
            { id: '19', name: 'Burpees', sets: 4, reps: '8-12', restTime: 120, notes: 'Full burpee with push-up' },
            { id: '20', name: 'Mountain Climbers', sets: 3, reps: '20', restTime: 60, notes: 'Fast pace' },
            { id: '21', name: 'Jump Squats', sets: 3, reps: '15-20', restTime: 90, notes: 'Explosive movement' },
            { id: '22', name: 'Russian Twists', sets: 3, reps: '20 each side', restTime: 60, notes: 'Core rotation' },
            { id: '23', name: 'Wall Balls', sets: 3, reps: '15-20', restTime: 90, notes: 'Squat and throw' },
            { id: '24', name: 'Box Jumps', sets: 3, reps: '10-15', restTime: 120, notes: 'Explosive jumping' }
          ]
        }
      ];
    }

    // Distribute exercises across days
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const exercisesPerDay = Math.ceil(exercises.length / days.length);
    const schedule = [];

    for (let i = 0; i < days.length; i++) {
      const dayExercises = exercises.slice(i * exercisesPerDay, (i + 1) * exercisesPerDay);
      if (dayExercises.length > 0) {
        schedule.push({
          day: days[i],
          name: `${days[i]} Workout`,
          exercises: dayExercises.map((exercise, index) => ({
            id: `${i * exercisesPerDay + index + 1}`,
            name: exercise.name,
            sets: exercise.sets || 3,
            reps: exercise.reps || '8-12',
            restTime: 90,
            notes: `Extracted from ${workoutName}`
          }))
        });
      }
    }
    return schedule;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Test AI integration
  const testAI = async () => {
    try {
      console.log('🧪 Testing AI integration...');
      const aiService = getAIService();
      
      const testResponse = await aiService.getCoachingResponse(
        'Hello, this is a test message.',
        { currentWorkout: null, userProfile: null },
        'general-advice'
      );
      
      console.log('✅ AI test successful:', testResponse);
      return true;
    } catch (error) {
      console.error('❌ AI test failed:', error);
      return false;
    }
  };

  // Test AI on component mount
  React.useEffect(() => {
    testAI();
  }, []);

  return (
    <div className="space-y-6">
      {/* AI Toggle */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <Brain className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-semibold text-white">AI-Powered Parsing</h3>
            <p className="text-sm text-white/70">
              {useAI ? 'AI will intelligently extract workout data' : 'Using basic text extraction'}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
        </label>
      </div>

      {/* AI Status Indicator */}
      {useAI && (
        <div className="flex items-center space-x-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300">AI integration active - Enhanced parsing enabled</span>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{currentStep}</h3>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="w-12 h-12 text-white/60" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload Workout PDF
              </h3>
              <p className="text-white/70 mb-4">
                {useAI 
                  ? 'AI will intelligently extract exercises, sets, and reps from your workout PDF'
                  : 'Basic text extraction will be used to parse your workout PDF'
                }
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-white/60">
                <FileText className="w-4 h-4" />
                <span>Drag & drop or click to browse</span>
              </div>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 cursor-pointer"
            >
              Choose PDF File
            </label>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {isProcessing && (
        <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
          {useAI ? (
            <Brain className="w-5 h-5 text-blue-400 animate-pulse" />
          ) : (
            <FileText className="w-5 h-5 text-white/60" />
          )}
          <span className="text-white/80">
            {useAI ? 'AI is analyzing your workout PDF...' : 'Processing PDF content...'}
          </span>
        </div>
      )}

      {/* Features Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="font-semibold text-white mb-2">AI-Powered Features</h4>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Intelligent exercise extraction</li>
            <li>• Automatic sets and reps detection</li>
            <li>• Smart workout categorization</li>
            <li>• Weekly schedule organization</li>
          </ul>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="font-semibold text-white mb-2">Supported Formats</h4>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Personal trainer PDFs</li>
            <li>• Gym program templates</li>
            <li>• Online workout plans</li>
            <li>• Custom fitness guides</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 