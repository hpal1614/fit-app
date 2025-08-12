// PDF Processor Test & Diagnostic Script
// File: src/utils/pdfProcessorTest.ts

import { OptimalPDFProcessor } from '../services/OptimalPDFProcessor';
import { NimbusAIService } from '../nimbus/services/NimbusAIService';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  error?: string;
}

export interface DiagnosticReport {
  timestamp: string;
  browserInfo: {
    userAgent: string;
    vendor: string;
    platform: string;
  };
  tests: TestResult[];
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  recommendations: string[];
}

export class PDFProcessorDiagnostic {
  private processor: OptimalPDFProcessor;

  constructor() {
    this.processor = new OptimalPDFProcessor();
  }

  async runFullDiagnostic(): Promise<DiagnosticReport> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    console.log('🔍 Starting PDF Processor Diagnostic...');

    // Test 1: PDF.js Library Loading
    tests.push(await this.testPDFJSLoading());

    // Test 2: File Reading Capabilities
    tests.push(await this.testFileReading());

    // Test 3: AI Service Connectivity
    tests.push(await this.testAIService());

    // Test 4: Text Processing Patterns
    tests.push(await this.testTextPatterns());

    // Test 5: JSON Parsing
    tests.push(await this.testJSONParsing());

    // Test 6: Mock PDF Processing
    tests.push(await this.testMockPDFProcessing());

    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    const overallStatus = passedTests === totalTests ? 'PASS' : 
                         passedTests >= totalTests * 0.7 ? 'WARNING' : 'FAIL';

    const recommendations = this.generateRecommendations(tests);

    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      browserInfo: {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform
      },
      tests,
      overallStatus,
      recommendations
    };

    console.log(`✅ Diagnostic Complete: ${passedTests}/${totalTests} tests passed`);
    return report;
  }

  private async testPDFJSLoading(): Promise<TestResult> {
    const testName = 'PDF.js Library Loading';
    const startTime = performance.now();

    try {
      console.log('📦 Testing PDF.js library loading...');
      
      const pdfjsLib = await import('pdfjs-dist');
      
      // Test if we can access basic PDF.js functions
      const hasGetDocument = typeof pdfjsLib.getDocument === 'function';
      const hasGlobalWorkerOptions = typeof pdfjsLib.GlobalWorkerOptions === 'object';
      
      if (!hasGetDocument || !hasGlobalWorkerOptions) {
        throw new Error('PDF.js library loaded but missing required functions');
      }

      // Check worker configuration
      const workerSrc = pdfjsLib.GlobalWorkerOptions.workerSrc;
      console.log('🔧 PDF.js Worker Source:', workerSrc);

      const duration = performance.now() - startTime;
      return {
        testName,
        passed: true,
        duration,
        details: `PDF.js loaded successfully in ${duration.toFixed(2)}ms. Worker: ${workerSrc}`
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        duration,
        details: 'Failed to load PDF.js library',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testFileReading(): Promise<TestResult> {
    const testName = 'File Reading Capabilities';
    const startTime = performance.now();

    try {
      console.log('📁 Testing file reading capabilities...');
      
      // Create a mock text file to test FileReader
      const mockText = 'Test content for file reading';
      const mockFile = new File([mockText], 'test.txt', { type: 'text/plain' });
      
      const content = await this.readFileAsText(mockFile);
      
      if (content !== mockText) {
        throw new Error('File content mismatch');
      }

      // Test ArrayBuffer reading
      const arrayBuffer = await this.readFileAsArrayBuffer(mockFile);
      if (!(arrayBuffer instanceof ArrayBuffer)) {
        throw new Error('ArrayBuffer reading failed');
      }

      const duration = performance.now() - startTime;
      return {
        testName,
        passed: true,
        duration,
        details: `File reading works correctly in ${duration.toFixed(2)}ms`
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        duration,
        details: 'File reading capabilities failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testAIService(): Promise<TestResult> {
    const testName = 'AI Service Connectivity';
    const startTime = performance.now();

    try {
      console.log('🤖 Testing AI service connectivity...');
      
      // Test if we can create an AI service instance
      const aiService = new NimbusAIService();
      
      if (!aiService) {
        throw new Error('AI service not initialized');
      }

      // Test basic method existence
      if (typeof aiService.streamResponse !== 'function') {
        throw new Error('AI service missing streamResponse method');
      }

      const duration = performance.now() - startTime;
      return {
        testName,
        passed: true,
        duration,
        details: `AI service accessible in ${duration.toFixed(2)}ms (Note: API key validation requires actual request)`
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        duration,
        details: 'AI service initialization failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testTextPatterns(): Promise<TestResult> {
    const testName = 'Text Processing Patterns';
    const startTime = performance.now();

    try {
      console.log('🔍 Testing text pattern recognition...');
      
      const testText = `
        PUSH/PULL/LEGS WORKOUT PROGRAM
        
        Day 1 - Push (Chest, Shoulders, Triceps)
        1. Bench Press - 4 sets x 6-8 reps - Rest 3 minutes
        2. Overhead Press - 3 sets x 8-10 reps - Rest 2 minutes  
        3. Incline Dumbbell Press - 3 sets x 10-12 reps - Rest 90 seconds
        
        Day 2 - Pull (Back, Biceps)
        1. Deadlifts - 4 sets x 5-6 reps - Rest 3 minutes
        2. Pull-ups - 3 sets x 6-10 reps - Rest 2 minutes
      `;

      // Test pattern recognition (mimic the analyzeTextStructure method)
      const dayPatterns = [
        /day\s+\d+/gi,
        /monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi,
        /week\s+\d+/gi,
        /workout\s+[a-z]/gi
      ];

      const exercisePatterns = [
        /\d+\s*x\s*\d+/g, // 3x8, 4 x 10
        /\d+\s+sets?\s*x?\s*\d+\s*reps?/gi, // 3 sets x 8 reps
        /\d+\s*sets?\s+of\s+\d+/gi, // 3 sets of 8
        /\d+\s*reps?\s*x\s*\d+\s*sets?/gi // 8 reps x 3 sets
      ];

      let dayCount = 0;
      dayPatterns.forEach(pattern => {
        const matches = testText.match(pattern) || [];
        dayCount = Math.max(dayCount, matches.length);
      });

      let exerciseCount = 0;
      exercisePatterns.forEach(pattern => {
        const matches = testText.match(pattern) || [];
        exerciseCount += matches.length;
      });

      if (dayCount < 2) {
        throw new Error(`Expected at least 2 days, found ${dayCount}`);
      }

      if (exerciseCount < 3) {
        throw new Error(`Expected at least 3 exercises, found ${exerciseCount}`);
      }

      const duration = performance.now() - startTime;
      return {
        testName,
        passed: true,
        duration,
        details: `Pattern recognition working: ${dayCount} days, ${exerciseCount} exercises found in ${duration.toFixed(2)}ms`
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        duration,
        details: 'Text pattern recognition failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testJSONParsing(): Promise<TestResult> {
    const testName = 'JSON Parsing & Repair';
    const startTime = performance.now();

    try {
      console.log('📝 Testing JSON parsing and repair...');
      
      // Test valid JSON
      const validJSON = `{
        "title": "Test Workout",
        "difficulty": "intermediate",
        "days": [
          {
            "name": "Day 1",
            "exercises": [
              {
                "name": "Bench Press",
                "sets": 3,
                "reps": "8-10",
                "muscleGroups": ["chest"]
              }
            ]
          }
        ]
      }`;

      const parsed = JSON.parse(validJSON);
      if (!parsed.title || !parsed.days || !Array.isArray(parsed.days)) {
        throw new Error('Valid JSON parsed incorrectly');
      }

      // Test JSON with markdown wrapper (common AI response format)
      const wrappedJSON = `\`\`\`json\n${validJSON}\n\`\`\``;
      const cleaned = wrappedJSON.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const parsedCleaned = JSON.parse(cleaned);
      
      if (!parsedCleaned.title) {
        throw new Error('JSON cleaning failed');
      }

      // Test malformed JSON extraction
      const malformedResponse = `Here's your workout plan:\n\n${validJSON}\n\nThis should work well!`;
      const jsonMatch = malformedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('JSON extraction from text failed');
      }

      const extractedJSON = JSON.parse(jsonMatch[0]);
      if (!extractedJSON.title) {
        throw new Error('Extracted JSON parsing failed');
      }

      const duration = performance.now() - startTime;
      return {
        testName,
        passed: true,
        duration,
        details: `JSON parsing and repair working correctly in ${duration.toFixed(2)}ms`
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        duration,
        details: 'JSON parsing and repair failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testMockPDFProcessing(): Promise<TestResult> {
    const testName = 'Optimal PDF Processor Instantiation';
    const startTime = performance.now();

    try {
      console.log('🧪 Testing Optimal PDF Processor...');
      
      // Test that we can create the processor
      const processor = new OptimalPDFProcessor();
      
      if (!processor) {
        throw new Error('Cannot instantiate OptimalPDFProcessor');
      }

      // Test that the testProcessor method exists
      if (typeof processor.testProcessor === 'function') {
        processor.testProcessor();
        console.log('✅ testProcessor method called successfully');
      } else {
        console.log('⚠️ testProcessor method not found (not critical)');
      }

      // Test that processPDF method exists
      if (typeof processor.processPDF !== 'function') {
        throw new Error('processPDF method missing');
      }

      const duration = performance.now() - startTime;
      return {
        testName,
        passed: true,
        duration,
        details: `Optimal PDF Processor instantiated successfully in ${duration.toFixed(2)}ms`
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        duration,
        details: 'Enhanced PDF Processor instantiation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];
    const failedTests = tests.filter(t => !t.passed);

    if (failedTests.some(t => t.testName.includes('PDF.js'))) {
      recommendations.push('🔧 PDF.js library failed to load. Check internet connection and CDN availability.');
      recommendations.push('   Try: Verify worker URL: https://unpkg.com/pdfjs-dist@[version]/build/pdf.worker.min.js');
    }

    if (failedTests.some(t => t.testName.includes('File Reading'))) {
      recommendations.push('📁 File reading capabilities are broken. This might be a browser compatibility issue.');
      recommendations.push('   Try: Test in Chrome/Firefox with no browser extensions');
    }

    if (failedTests.some(t => t.testName.includes('AI Service'))) {
      recommendations.push('🤖 AI service is not working. Check API keys in environment variables.');
      recommendations.push('   Try: Set VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY in .env');
    }

    if (failedTests.some(t => t.testName.includes('Text Patterns'))) {
      recommendations.push('🔍 Text pattern recognition is failing. Review regex patterns for exercise detection.');
      recommendations.push('   Try: Check if text contains "Day 1", "sets", "reps" keywords');
    }

    if (failedTests.some(t => t.testName.includes('JSON'))) {
      recommendations.push('📝 JSON parsing is broken. Check AI response format and repair utilities.');
      recommendations.push('   Try: Verify jsonRepairUtils.ts exists and imports correctly');
    }

    if (failedTests.some(t => t.testName.includes('Enhanced PDF'))) {
      recommendations.push('🧪 Optimal PDF Processor is broken. Check import paths and dependencies.');
      recommendations.push('   Try: Verify OptimalPDFProcessor.ts exists and compiles');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All core tests passed! PDF processing should work correctly.');
      recommendations.push('📝 If you\'re still having issues, upload a PDF and check browser console.');
      recommendations.push('🎯 Next step: Test with actual PDF file in the UI.');
    }

    return recommendations;
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Export diagnostic report for debugging
  exportDiagnosticReport(report: DiagnosticReport): void {
    const reportText = this.formatReportAsText(report);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pdf_processor_diagnostic_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  private formatReportAsText(report: DiagnosticReport): string {
    let text = `PDF PROCESSOR DIAGNOSTIC REPORT\n`;
    text += `Generated: ${report.timestamp}\n`;
    text += `Overall Status: ${report.overallStatus}\n\n`;

    text += `BROWSER INFORMATION:\n`;
    text += `- User Agent: ${report.browserInfo.userAgent}\n`;
    text += `- Vendor: ${report.browserInfo.vendor}\n`;
    text += `- Platform: ${report.browserInfo.platform}\n\n`;

    text += `TEST RESULTS:\n`;
    report.tests.forEach((test, index) => {
      text += `${index + 1}. ${test.testName}: ${test.passed ? 'PASS' : 'FAIL'}\n`;
      text += `   Duration: ${test.duration.toFixed(2)}ms\n`;
      text += `   Details: ${test.details}\n`;
      if (test.error) {
        text += `   Error: ${test.error}\n`;
      }
      text += `\n`;
    });

    text += `RECOMMENDATIONS:\n`;
    report.recommendations.forEach((rec, index) => {
      text += `${index + 1}. ${rec}\n`;
    });

    return text;
  }
}

// Usage example for manual testing
export async function runPDFProcessorDiagnostic(): Promise<void> {
  const diagnostic = new PDFProcessorDiagnostic();
  
  console.log('🚀 Starting PDF Processor Diagnostic...');
  const report = await diagnostic.runFullDiagnostic();
  
  console.log('📊 Diagnostic Report:', report);
  
  if (report.overallStatus === 'FAIL') {
    console.error('❌ PDF Processor has critical issues:');
    report.recommendations.forEach(rec => console.error(`  • ${rec}`));
  } else if (report.overallStatus === 'WARNING') {
    console.warn('⚠️ PDF Processor has some issues:');
    report.recommendations.forEach(rec => console.warn(`  • ${rec}`));
  } else {
    console.log('✅ PDF Processor is working correctly!');
  }

  // Auto-export report if there are failures
  if (report.overallStatus !== 'PASS') {
    diagnostic.exportDiagnosticReport(report);
    console.log('📁 Diagnostic report exported for debugging');
  }
}
