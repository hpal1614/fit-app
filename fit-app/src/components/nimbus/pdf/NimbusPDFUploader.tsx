import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface PDFUploaderProps {
  onUpload: (file: File, extractedText: string) => void;
  className?: string;
}

export const NimbusPDFUploader: React.FC<PDFUploaderProps> = ({ 
  onUpload, 
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('');

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      // Simulate PDF text extraction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted text
      const extractedText = `
        WORKOUT PLAN
        
        Day 1: Upper Body
        - Bench Press: 3 sets x 8-10 reps
        - Pull-ups: 3 sets x 6-8 reps
        - Shoulder Press: 3 sets x 10-12 reps
        - Rows: 3 sets x 8-10 reps
        
        Day 2: Lower Body
        - Squats: 4 sets x 8-10 reps
        - Deadlifts: 3 sets x 5-6 reps
        - Lunges: 3 sets x 12 each leg
        - Calf Raises: 4 sets x 15-20 reps
        
        Day 3: Full Body
        - Burpees: 3 sets x 10
        - Push-ups: 3 sets x 15
        - Mountain Climbers: 3 sets x 20
        - Plank: 3 sets x 60 seconds
      `;
      
      onUpload(file, extractedText);
      setUploadStatus('success');
    } catch (error) {
      console.error('PDF processing error:', error);
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUploader = () => {
    setUploadStatus('idle');
    setFileName('');
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="text-fitness-blue" size={24} />
        <h2 className="text-xl font-bold text-gray-900">PDF Workout Uploader</h2>
      </div>

      {uploadStatus === 'idle' && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-fitness-blue bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop your workout PDF here
          </h3>
          <p className="text-gray-500 mb-4">
            or click to browse and select a file
          </p>
          
          <label className="inline-flex items-center px-4 py-2 bg-fitness-blue text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
            <Upload size={20} className="mr-2" />
            Choose PDF File
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          
          <p className="text-sm text-gray-400 mt-4">
            Supports PDF files up to 10MB
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-blue mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Processing PDF...
          </h3>
          <p className="text-gray-500">
            Extracting workout information from {fileName}
          </p>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            PDF Processed Successfully!
          </h3>
          <p className="text-gray-500 mb-4">
            Workout plan extracted from {fileName}
          </p>
          <button
            onClick={resetUploader}
            className="bg-fitness-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Upload Another PDF
          </button>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="text-center py-8">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Processing Failed
          </h3>
          <p className="text-gray-500 mb-4">
            Could not extract workout information from {fileName}
          </p>
          <button
            onClick={resetUploader}
            className="bg-fitness-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
