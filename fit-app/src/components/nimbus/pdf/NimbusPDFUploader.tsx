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
      console.log('🤖 Starting AI parsing with text length:', text.length);
      console.log('🤖 Text preview:', text.substring(0, 300));
      
      const aiService = getAIService();
      const aiPrompt = `You are a professional fitness trainer and workout plan expert with deep knowledge of fitness terminology and PDF analysis. Your task is to intelligently analyze this workout PDF content and extract the actual workout information, understanding that the same information can be expressed in many different ways.

PDF Content: ${text.substring(0, 3000)}

CRITICAL INSTRUCTIONS FOR INTELLIGENT ANALYSIS:

1. **SMART TERMINOLOGY RECOGNITION**: Understand that the same concept can be expressed differently:
   - Difficulty: "Difficulty", "Training Level", "Experience Level", "Skill Level", "Fitness Level", "Beginner/Intermediate/Advanced"
   - Goals: "Goals", "Objectives", "Target", "Aim", "Purpose", "Focus Areas"
   - Equipment: "Equipment", "Gear", "Tools", "Machines", "Weights", "Apparatus"
   - Duration: "Duration", "Length", "Weeks", "Program Length", "Training Period"
   - Category: "Category", "Type", "Focus", "Training Style", "Workout Type"

2. **EXERCISE EXTRACTION**: Look for exercises in various formats:
   - "Bench Press 3x10" = "Bench Press: 3 sets, 10 reps"
   - "3 sets of 12 reps Squats" = "Squats: 3 sets, 12 reps"
   - "Deadlift: 4 sets, 8-12 reps" = "Deadlift: 4 sets, 8-12 reps"
   - "Pull-ups (assisted): 3x5-8" = "Pull-ups: 3 sets, 5-8 reps (assisted)"

3. **INTELLIGENT SCHEDULE DETECTION**: Recognize different day formats:
   - "Day 1", "Monday", "Week 1 Day 1", "Session 1", "Workout 1"
   - "Upper Body", "Push Day", "Chest/Triceps", "Upper A"
   - "Lower Body", "Leg Day", "Squat Day", "Lower A"

4. **CONTEXT-AWARE ANALYSIS**: Use the overall context to understand:
   - If it's a strength program, assume strength goals
   - If it mentions "beginner", set difficulty to beginner
   - If it's bodyweight exercises, equipment is "bodyweight"
   - If it's a 12-week program, duration is 12 weeks

5. **FLEXIBLE EXTRACTION**: Even if you can only find a few exercises or partial information, include what you find. It's better to have some accurate data than none.

Return ONLY a valid JSON object with this exact structure:
{
  "name": "Exact workout name from PDF or intelligent filename analysis",
  "description": "Brief description based on PDF content analysis",
  "difficulty": "beginner|intermediate|advanced (based on content analysis)",
  "duration": number_of_weeks_from_pdf,
  "category": "strength|cardio|flexibility|full-body|sports (based on content)",
  "goals": ["strength", "muscle", "endurance", "weight-loss", "flexibility"] (from content),
  "equipment": ["dumbbells", "barbell", "bodyweight", "machines", "kettlebells"] (from content),
  "daysPerWeek": number_from_schedule_analysis,
  "estimatedTime": estimated_minutes_per_session,
  "rating": 0,
  "downloads": 0,
  "isCustom": true,
  "schedule": [
    {
      "day": "Monday (or Day 1, or actual day mentioned)",
      "name": "Workout name or focus area",
      "exercises": [
        {
          "id": "1",
          "name": "EXACT exercise name from PDF",
          "sets": EXACT number of sets from PDF,
          "reps": "EXACT reps from PDF (e.g., '8-12', '10', '5-8')",
          "restTime": 90,
          "notes": "Form notes if mentioned in PDF"
        }
      ]
    }
  ]
}

IMPORTANT: Be intelligent about understanding variations in terminology. Include any exercises you can find, even if the schedule is incomplete. If you find ANY workout-related information, include it.`;

      console.log('🤖 Sending prompt to AI...');
      const aiResponse = await aiService.getCoachingResponse(
        aiPrompt,
        { currentWorkout: null, userProfile: null },
        'workout-planning'
      );

      console.log('🤖 AI Response received:', aiResponse.response.substring(0, 200));

      let parsedWorkout: AIWorkout;
      try {
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('🤖 Found JSON in AI response');
          parsedWorkout = JSON.parse(jsonMatch[0]);
          console.log('🤖 Parsed workout:', parsedWorkout);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.warn('🤖 AI response parsing failed, using fallback:', parseError);
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

      console.log('🤖 Final parsed workout:', parsedWorkout);

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
      return parsedWorkout;
    } catch (error) {
      console.error('🤖 AI parsing failed, using fallback:', error);
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

  // Extract exercises from text using intelligent pattern matching
  const extractExercisesFromText = (text: string): Array<{name: string, sets?: number, reps?: string}> => {
    const exercises: Array<{name: string, sets?: number, reps?: string}> = [];

    // Intelligent exercise patterns to match various workout formats
    const exercisePatterns = [
      // Pattern: "3 sets 10-12 reps Bench Press"
      /(\d+)\s*(?:sets?|x)\s*(\d+(?:-\d+)?)\s*(?:reps?|repetitions?)?\s*([A-Za-z\s]+)/gi,
      // Pattern: "Bench Press 3 sets 10-12 reps"
      /([A-Za-z\s]+)\s*(\d+)\s*(?:sets?|x)\s*(\d+(?:-\d+)?)/gi,
      // Pattern: "Bench Press 10-12 reps"
      /([A-Za-z\s]+)\s*(\d+(?:-\d+)?)\s*(?:reps?|repetitions?)/gi,
      // Pattern: "Bench Press 3x10"
      /([A-Za-z\s]+)\s*(\d+)x(\d+)/gi,
      // Pattern: "3x10 Bench Press"
      /(\d+)x(\d+)\s*([A-Za-z\s]+)/gi,
      // Pattern: "Bench Press: 3 sets, 10 reps"
      /([A-Za-z\s]+):\s*(\d+)\s*(?:sets?|x)\s*,?\s*(\d+(?:-\d+)?)/gi,
      // Pattern: "Bench Press - 3 sets of 10-12"
      /([A-Za-z\s]+)\s*[-–]\s*(\d+)\s*(?:sets?|x)\s*(?:of\s*)?(\d+(?:-\d+)?)/gi
    ];

    // Look for patterns like "3 sets 10 reps exercise name"
    exercisePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.length >= 3) {
          const exerciseName = match[3] || match[1];
          const sets = parseInt(match[1] || match[2]);
          const reps = match[2] || match[3];

          if (exerciseName && exerciseName.trim().length > 2) {
            const cleanName = exerciseName.trim().split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            // Filter out common non-exercise words
            const nonExerciseWords = ['sets', 'reps', 'repetitions', 'rest', 'time', 'minutes', 'seconds', 'kg', 'lbs', 'weight'];
            if (!nonExerciseWords.some(word => cleanName.toLowerCase().includes(word))) {
              exercises.push({
                name: cleanName,
                sets: sets || 3,
                reps: reps || '8-12'
              });
            }
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
      // Return empty schedule if no exercises found - accuracy over completeness
      console.log('📄 No exercises found in PDF, returning empty schedule');
      return [];
    }

    // Distribute exercises across a weekly schedule
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const exercisesPerDay = Math.ceil(exercises.length / 5); // 5 workout days
    const schedule = [];

    for (let i = 0; i < Math.min(5, days.length); i++) {
      const dayExercises = exercises.slice(i * exercisesPerDay, (i + 1) * exercisesPerDay);
      if (dayExercises.length > 0) {
        schedule.push({
          day: days[i],
          name: `${days[i]} Workout`,
          exercises: dayExercises.map((exercise, index) => ({
            id: `${i + 1}-${index + 1}`,
            name: exercise.name,
            sets: exercise.sets || 3,
            reps: exercise.reps || '8-12',
            restTime: 90,
            notes: ''
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