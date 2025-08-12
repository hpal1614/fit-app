import React, { useState } from 'react';
import { Play, FileText, CheckCircle, Brain, Save, ExternalLink } from 'lucide-react';
import { testWorkoutExtraction } from '../utils/testWorkoutExtraction';
import { hybridStorageService } from '../services/hybridStorageService';
import '../utils/templateChecker'; // Load template checker utils

interface ExtractionResult {
  success: boolean;
  extractedDays: number;
  extractedExercises: number;
  confidence: number;
  processingTime: number;
  template: any;
}

export const WorkoutExtractionDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  
  // Use the exported instance

  const runDemo = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setSavedTemplateId(null);

    try {
      console.log('🚀 Starting workout extraction demo...');
      const extractionResult = await testWorkoutExtraction();
      
      setResult({
        success: extractionResult.success,
        extractedDays: extractionResult.extractedDays,
        extractedExercises: extractionResult.extractedExercises,
        confidence: extractionResult.confidence,
        processingTime: extractionResult.processingTime,
        template: extractionResult.template
      });
    } catch (err) {
      console.error('Demo failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  const saveTemplate = async () => {
    if (!result?.template) return;

    setIsSaving(true);
    try {
      // Convert template to proper format for storage
      const templateForStorage = {
        ...result.template,
        isActive: false,
        currentWeek: 1,
        updatedAt: new Date()
      };

      console.log('💾 Saving template to storage...', templateForStorage);
      
      const success = await hybridStorageService.store('workout', result.template.id, templateForStorage);
      
      if (success) {
        setSavedTemplateId(result.template.id);
        console.log('✅ Template saved successfully with ID:', result.template.id);
        
        // Also save to localStorage for compatibility
        const existingTemplates = JSON.parse(localStorage.getItem('workoutTemplates') || '[]');
        const updatedTemplates = [...existingTemplates, templateForStorage];
        localStorage.setItem('workoutTemplates', JSON.stringify(updatedTemplates));
        
        console.log('💾 Template also saved to localStorage');
      } else {
        throw new Error('Failed to save template to storage');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError(`Failed to save template: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <Brain className="text-blue-600" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workout PDF Extraction Demo</h2>
          <p className="text-gray-600">Test automatic extraction of workout data from PDF format</p>
        </div>
      </div>

      {/* Sample Data Preview */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Sample Workout Data Format:</h3>
        <div className="font-mono text-sm text-gray-700 bg-white p-3 rounded border">
          <div className="text-blue-600 font-semibold">Day 1: Upper Body Workout</div>
          <div className="mt-2">
            <div className="grid grid-cols-4 gap-4 font-semibold border-b pb-1 mb-2">
              <span>Exercise</span>
              <span>Sets</span>
              <span>Reps</span>
              <span>Rest</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-xs space-y-1">
              <div className="col-span-4 grid grid-cols-4 gap-4">
                <span>Barbell Bench Press</span>
                <span>5</span>
                <span>1 - 4</span>
                <span>90 - 120 Sec</span>
              </div>
              <div className="col-span-4 grid grid-cols-4 gap-4">
                <span>Overhead Barbell Press</span>
                <span>3</span>
                <span>4 - 6</span>
                <span>60 Sec</span>
              </div>
              <div className="col-span-4 grid grid-cols-4 gap-4">
                <span>Bent Over Row</span>
                <span>3</span>
                <span>4 - 6</span>
                <span>60 Sec</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Button */}
      <div className="text-center mb-6">
        <button
          onClick={runDemo}
          disabled={isRunning}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
            isRunning 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? (
            <>
              <Brain className="animate-pulse mr-2" size={20} />
              Processing...
            </>
          ) : (
            <>
              <Play className="mr-2" size={20} />
              Run Extraction Demo
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Success Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="text-green-600" size={24} />
              <h3 className="text-lg font-semibold text-green-800">Extraction Successful!</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.extractedDays}</div>
                <div className="text-green-700">Days Extracted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.extractedExercises}</div>
                <div className="text-green-700">Exercises Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round(result.confidence * 100)}%</div>
                <div className="text-green-700">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.processingTime}ms</div>
                <div className="text-green-700">Processing Time</div>
              </div>
            </div>
            
            {/* Save Template Button */}
            <div className="mt-4 text-center">
              {!savedTemplateId ? (
                <button
                  onClick={saveTemplate}
                  disabled={isSaving}
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    isSaving 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Save className="animate-pulse mr-2" size={20} />
                      Saving Template...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={20} />
                      Save Template to Workout Library
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2 text-green-800">
                    <CheckCircle size={20} />
                    <span className="font-medium">Template Saved Successfully!</span>
                  </div>
                  <p className="text-green-700 text-sm mt-2">
                    Template ID: <code className="bg-green-100 px-2 py-1 rounded">{savedTemplateId}</code>
                  </p>
                  <div className="mt-3 space-x-3">
                    <button
                      onClick={() => window.location.hash = '#onboarding'}
                      className="inline-flex items-center text-sm text-green-700 hover:text-green-900"
                    >
                      <ExternalLink size={16} className="mr-1" />
                      View in Template Manager
                    </button>
                    <button
                      onClick={() => window.location.hash = '#workout'}
                      className="inline-flex items-center text-sm text-green-700 hover:text-green-900"
                    >
                      <Play size={16} className="mr-1" />
                      Start Workout Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Template Preview */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Workout Template</h3>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">Program Details:</h4>
              <div className="text-sm text-gray-600 mt-1">
                <div><strong>Name:</strong> {result.template.name}</div>
                <div><strong>Description:</strong> {result.template.description}</div>
                <div><strong>Equipment:</strong> {result.template.equipment.join(', ')}</div>
                <div><strong>Days per week:</strong> {result.template.daysPerWeek}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Workout Schedule:</h4>
              <div className="space-y-4">
                {result.template.schedule.map((day: any, dayIndex: number) => (
                  <div key={dayIndex} className="border rounded-lg p-3">
                    <h5 className="font-medium text-blue-600 mb-2">{day.name}</h5>
                    <div className="space-y-1">
                      {day.exercises.map((exercise: any, exIndex: number) => (
                        <div key={exIndex} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{exercise.name}</span>
                          <span className="text-gray-600">
                            {exercise.sets} sets × {exercise.reps} reps 
                            ({exercise.restTime}s rest)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Extraction Failed</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">How the Extraction Works</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <FileText className="text-blue-600 mt-0.5" size={16} />
            <div>
              <strong>1. PDF Text Extraction:</strong> Uses PDF.js to extract text while preserving table structure
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Brain className="text-blue-600 mt-0.5" size={16} />
            <div>
              <strong>2. Format Detection:</strong> Detects table headers like "Exercise Sets Reps Rest"
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="text-blue-600 mt-0.5" size={16} />
            <div>
              <strong>3. Pattern Matching:</strong> Extracts exercise data using regex patterns for different formats
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Play className="text-blue-600 mt-0.5" size={16} />
            <div>
              <strong>4. Template Generation:</strong> Creates a complete workout template ready for use
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
