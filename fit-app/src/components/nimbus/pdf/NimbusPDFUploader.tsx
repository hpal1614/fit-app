import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Brain, Zap } from 'lucide-react';
import { EnhancedPDFProcessor } from '../../../services/enhancedPDFProcessor';
import { WorkoutPDFExtractor } from '../../../services/WorkoutPDFExtractor';
import { hybridStorageService } from '../../../services/hybridStorageService';
import type { StoredWorkoutTemplate } from '../../../services/workoutStorageService';

interface PDFUploaderProps {
  onWorkoutParsed: (template: StoredWorkoutTemplate, analysis: any) => Promise<void>;
  onError: (error: string) => void;
  className?: string;
}

export const NimbusPDFUploader: React.FC<PDFUploaderProps> = ({ 
  onWorkoutParsed, 
  onError,
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const [processingStage, setProcessingStage] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [useNewExtractor, setUseNewExtractor] = useState(true);
  
  const processor = new EnhancedPDFProcessor();
  const workoutExtractor = new WorkoutPDFExtractor();

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
    setUploadStatus('idle');
    setProcessingStage('Initializing...');
    setAnalysis(null);

    try {
      // Stage updates with UI feedback
      setProcessingStage('🔍 Analyzing PDF structure...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStage('📊 Extracting workout data...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let result: any;
      
      if (useNewExtractor) {
        setProcessingStage('🎯 Enhanced workout extraction...');
        result = await workoutExtractor.processPDF(file);
        
        // Convert to expected format for compatibility
        const analysisData = {
          processingStage: result.method === 'table' ? 'table_extraction' : 
                          result.method === 'pattern' ? 'pattern_extraction' : 'fallback_extraction',
          confidence: result.confidence,
          successfulStages: [result.method + '_extraction'],
          warnings: result.warnings,
          extractedDays: result.extractedDays,
          extractedExercises: result.extractedExercises,
          processingTime: result.processingTime
        };
        
        setProcessingStage('✅ Finalizing template...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setAnalysis(analysisData);
        
        // Save template to storage automatically
        const templateForStorage = {
          ...result.template,
          isActive: false,
          currentWeek: 1,
          // updatedAt is already in result.template
        };
        
        console.log('💾 Auto-saving template to storage...');
        await hybridStorageService.store('workout', result.template.id, templateForStorage);
        
        // Also save to localStorage for compatibility
        const existingTemplates = JSON.parse(localStorage.getItem('workoutTemplates') || '[]');
        const updatedTemplates = [...existingTemplates, templateForStorage];
        localStorage.setItem('workoutTemplates', JSON.stringify(updatedTemplates));
        
        console.log('✅ Template auto-saved successfully');
        
        await onWorkoutParsed(result.template, analysisData);
      } else {
        setProcessingStage('🤖 AI enhancement...');
        result = await processor.processPDF(file);
        
        setProcessingStage('✅ Finalizing template...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setAnalysis(result.analysis);
        
        // Save template to storage automatically (legacy processor)
        const templateForStorage = {
          ...result.template,
          isActive: false,
          currentWeek: 1,
          updatedAt: new Date()
        };
        
        console.log('💾 Auto-saving legacy template to storage...');
        await hybridStorageService.store('workout', result.template.id, templateForStorage);
        
        // Also save to localStorage for compatibility
        const existingTemplates = JSON.parse(localStorage.getItem('workoutTemplates') || '[]');
        const updatedTemplates = [...existingTemplates, templateForStorage];
        localStorage.setItem('workoutTemplates', JSON.stringify(updatedTemplates));
        
        console.log('✅ Legacy template auto-saved successfully');
        
        await onWorkoutParsed(result.template, result.analysis);
      }
      setUploadStatus('success');
      
    } catch (error) {
      console.error('PDF processing error:', error);
      setUploadStatus('error');
      onError(`Failed to process PDF: ${error}`);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const resetUploader = () => {
    setUploadStatus('idle');
    setFileName('');
    setProcessingStage('');
    setAnalysis(null);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="text-fitness-blue" size={24} />
          <h2 className="text-xl font-bold text-gray-900">PDF Workout Uploader</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Enhanced Extractor:</span>
          <button
            onClick={() => setUseNewExtractor(!useNewExtractor)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              useNewExtractor ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useNewExtractor ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs text-gray-500">
            {useNewExtractor ? 'Enhanced (Table Format)' : 'Legacy (AI Enhanced)'}
          </span>
        </div>
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
          <div className="flex items-center justify-center mb-4">
            <Brain className="animate-pulse text-fitness-blue mr-3" size={32} />
            <Zap className="animate-bounce text-yellow-500" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Advanced PDF Processing
          </h3>
          <p className="text-gray-600 mb-4">
            {processingStage || 'Processing your workout PDF...'}
          </p>
          <div className="bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-fitness-blue h-2 rounded-full transition-all duration-500"
              style={{ 
                width: processingStage.includes('Analyzing') ? '25%' : 
                       processingStage.includes('Extracting') ? '50%' : 
                       processingStage.includes('AI') ? '75%' : 
                       processingStage.includes('Finalizing') ? '90%' : '10%'
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            Using structure recognition + AI enhancement
          </p>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="py-8">
          <div className="text-center mb-6">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              PDF Processed Successfully!
            </h3>
            <p className="text-gray-500 mb-4">
              Workout plan extracted from {fileName}
            </p>
          </div>
          
          {analysis && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Processing Results</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Processing Stage:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    analysis.processingStage === 'ai_enhanced' ? 'bg-green-100 text-green-800' :
                    analysis.processingStage === 'structured' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {analysis.processingStage.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Confidence:</span>
                  <span className="ml-2 font-medium">
                    {Math.round(analysis.confidence * 100)}%
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Successful Stages:</span>
                  <div className="ml-2 flex flex-wrap gap-1 mt-1">
                    {analysis.successfulStages.map((stage: string) => (
                      <span key={stage} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {stage.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                {analysis.warnings.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Warnings:</span>
                    <ul className="ml-2 mt-1 text-xs text-yellow-700">
                      {analysis.warnings.slice(0, 3).map((warning: string, i: number) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <button
              onClick={resetUploader}
              className="bg-fitness-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upload Another PDF
            </button>
          </div>
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
