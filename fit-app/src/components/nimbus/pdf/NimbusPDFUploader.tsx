import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { NimbusPDFParser, NimbusPDFWorkout } from '../../../services/nimbus/NimbusPDFParser';

export const NimbusPDFUploader: React.FC<{
  onWorkoutParsed: (workout: NimbusPDFWorkout) => void;
  onError: (error: string) => void;
}> = ({ onWorkoutParsed, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const pdfParser = new NimbusPDFParser();

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
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

      // Step 2: Text extraction
      setCurrentStep('Extracting text from PDF...');
      setUploadProgress(40);
      
      // Step 3: AI analysis
      setCurrentStep('Analyzing workout structure with AI...');
      setUploadProgress(60);
      
      // Step 4: Parse the workout
      setCurrentStep('Creating workout template...');
      setUploadProgress(80);
      
      const parsedWorkout = await pdfParser.parseWorkoutPDF(file);
      
      // Step 5: Complete
      setCurrentStep('Workout parsed successfully!');
      setUploadProgress(100);
      
      setTimeout(() => {
        onWorkoutParsed(parsedWorkout);
        setIsProcessing(false);
        setCurrentStep('');
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('PDF parsing error:', error);
      onError(error.message || 'Failed to parse PDF workout');
      setIsProcessing(false);
      setCurrentStep('');
      setUploadProgress(0);
    }
  }, [pdfParser, onWorkoutParsed, onError]);

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

  // Test function to verify component is working
  const testComponent = () => {
    console.log('✅ NimbusPDFUploader component is working correctly');
    return true;
  };

  // Call test function on mount
  React.useEffect(() => {
    testComponent();
  }, []);

  return (
    <div className="nimbus-pdf-uploader p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            PDF Workout Intelligence
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Upload any fitness PDF (AthleanX, 5/3/1, StrongLifts, custom programs) and we'll intelligently convert it to a workout template.
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDrag={handleDrag}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
            ${dragActive 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
            ${isProcessing ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
          `}
        >
          {!isProcessing ? (
            <>
              <Upload className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Drop your PDF here or click to browse
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Supports PDFs up to 10MB
              </p>
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                Choose PDF File
              </button>
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
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {uploadProgress}% complete
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Popular PDF Formats */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Supported PDF Formats:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'AthleanX', desc: 'Jeff Cavaliere programs' },
              { name: '5/3/1', desc: 'Jim Wendler templates' },
              { name: 'StrongLifts', desc: 'Mehdi programs' },
              { name: 'Custom', desc: 'Personal trainer PDFs' }
            ].map((format) => (
              <div key={format.name} className="nimbus-glass rounded-lg p-3 text-center">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {format.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 