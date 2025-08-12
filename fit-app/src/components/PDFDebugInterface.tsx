import React, { useState } from 'react';
import { Play, FileText, AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import { runPDFProcessorDiagnostic, PDFProcessorDiagnostic, DiagnosticReport } from '../utils/pdfProcessorTest';
import { OptimalPDFProcessor } from '../services/OptimalPDFProcessor';

interface PDFDebugInterfaceProps {
  className?: string;
}

export const PDFDebugInterface: React.FC<PDFDebugInterfaceProps> = ({ className = '' }) => {
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [pdfResult, setPdfResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Intercept console logs for display
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  React.useEffect(() => {
    const captureLog = (level: string, ...args: any[]) => {
      const message = `[${level}] ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`;
      setLogs(prev => [...prev.slice(-49), message]); // Keep last 50 logs
    };

    console.log = (...args) => {
      originalConsoleLog(...args);
      captureLog('LOG', ...args);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      captureLog('ERROR', ...args);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      captureLog('WARN', ...args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    setLogs([]);
    
    try {
      console.log('🔍 Starting comprehensive PDF processor diagnostic...');
      const report = await runPDFProcessorDiagnostic();
      setDiagnosticReport(report);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      console.log('📄 PDF file selected:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
    }
  };

  const handleProcessPDF = async () => {
    if (!selectedFile) return;

    setIsProcessingPDF(true);
    setPdfResult(null);
    
    try {
      console.log('🚀 Starting PDF processing with OptimalPDFProcessor...');
      const processor = new OptimalPDFProcessor();
      
      // Call testProcessor if it exists
      if (typeof processor.testProcessor === 'function') {
        processor.testProcessor();
      }
      
      const result = await processor.processPDF(selectedFile);
      setPdfResult(result);
      
      console.log('✅ PDF processing completed successfully');
      console.log('📊 Result summary:', {
        templateName: result.template.name,
        method: result.method,
        success: result.success,
        confidence: Math.round(result.confidence * 100) + '%',
        daysExtracted: result.extractedDays,
        exercisesExtracted: result.extractedExercises,
        processingTime: result.processingTime + 'ms',
        detectedFormat: result.debugInfo.detectedFormat
      });
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      setPdfResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      case 'FAIL': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-900">PDF Processing Debug Interface</h2>
      </div>

      {/* Diagnostic Tests Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Diagnostics</h3>
        
        <button
          onClick={handleRunDiagnostic}
          disabled={isRunningDiagnostic}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {isRunningDiagnostic ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <Play size={16} />
          )}
          <span>{isRunningDiagnostic ? 'Running Diagnostic...' : 'Run Full Diagnostic'}</span>
        </button>

        {diagnosticReport && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getStatusColor(diagnosticReport.overallStatus)}`}>
              {diagnosticReport.overallStatus === 'PASS' ? (
                <CheckCircle size={16} className="mr-2" />
              ) : (
                <AlertCircle size={16} className="mr-2" />
              )}
              Overall Status: {diagnosticReport.overallStatus}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {diagnosticReport.tests.map((test, index) => (
                <div key={index} className="bg-white rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{test.testName}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {test.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{test.details}</p>
                  {test.error && (
                    <p className="text-xs text-red-600 mt-1">Error: {test.error}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{test.duration.toFixed(2)}ms</p>
                </div>
              ))}
            </div>

            {diagnosticReport.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-medium text-yellow-800 mb-2">Recommendations:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {diagnosticReport.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF Processing Test Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">PDF Processing Test</h3>
        
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          <button
            onClick={handleProcessPDF}
            disabled={!selectedFile || isProcessingPDF}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isProcessingPDF ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Play size={16} />
            )}
            <span>{isProcessingPDF ? 'Processing...' : 'Test PDF Processing'}</span>
          </button>
        </div>

        {selectedFile && (
          <div className="bg-blue-50 rounded p-3 mb-4">
            <p className="text-sm text-blue-800">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        )}

        {pdfResult && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Processing Result:</h4>
            
            {pdfResult.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 font-medium">Error:</p>
                <p className="text-red-700 text-sm">{pdfResult.error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-600">Template Name</p>
                    <p className="font-medium">{pdfResult.template?.name || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-600">Days</p>
                    <p className="font-medium">{pdfResult.template?.schedule?.length || 0}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-600">Exercises</p>
                    <p className="font-medium">
                      {pdfResult.template?.schedule?.reduce((sum: number, day: any) => sum + (day.exercises?.length || 0), 0) || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-600">Confidence</p>
                    <p className="font-medium">{Math.round((pdfResult.confidence || 0) * 100)}%</p>
                  </div>
                </div>
                
                {pdfResult.warnings?.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 font-medium mb-1">Warnings:</p>
                    <ul className="text-yellow-700 text-sm">
                      {pdfResult.warnings.map((warning: string, index: number) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Console Logs Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Console Output</h3>
          <button
            onClick={clearLogs}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Logs
          </button>
        </div>
        
        <div className="bg-black text-green-400 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run diagnostic or process a PDF to see output.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
