import { useState, useEffect, useCallback, useRef } from 'react';
import { poseDetection } from '../services/poseDetectionService';
import { cameraService } from '../services/cameraService';
import { formCoaching } from '../services/formCoachingService';

interface UseFormAnalysisOptions {
  exercise: string;
  voiceEnabled?: boolean;
  visualEnabled?: boolean;
  strictnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface FormMetrics {
  formScore: number;
  repCount: number;
  tempo: number;
  errors: any[];
  suggestions: string[];
}

interface CameraStatus {
  isInitialized: boolean;
  isProcessing: boolean;
  fps: number;
  error: string | null;
}

interface UseFormAnalysisReturn {
  // Status
  cameraStatus: CameraStatus;
  isSessionActive: boolean;
  
  // Metrics
  currentMetrics: FormMetrics | null;
  sessionSummary: any | null;
  
  // Actions
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  switchCamera: () => Promise<void>;
  takeSnapshot: () => string | null;
  
  // Settings
  setDrawOptions: (options: any) => void;
  setCoachingConfig: (config: any) => void;
  
  // Refs for DOM elements
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useFormAnalysis(options: UseFormAnalysisOptions): UseFormAnalysisReturn {
  const {
    exercise,
    voiceEnabled = true,
    visualEnabled = true,
    strictnessLevel = 'intermediate'
  } = options;

  // State
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>({
    isInitialized: false,
    isProcessing: false,
    fps: 0,
    error: null
  });
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<FormMetrics | null>(null);
  const [sessionSummary, setSessionSummary] = useState<any | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingIntervalRef = useRef<number | null>(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setCameraStatus(prev => ({ ...prev, error: null }));
      
      // Initialize camera service
      await cameraService.initialize({
        width: 640,
        height: 480,
        fps: 30,
        facing: 'user'
      });

      // Attach to DOM elements
      if (videoRef.current && canvasRef.current) {
        cameraService.attachToElements(videoRef.current, canvasRef.current);
      }

      setCameraStatus(prev => ({ ...prev, isInitialized: true }));

      // Set initial draw options
      cameraService.setDrawOptions({
        showSkeleton: visualEnabled,
        showAngles: true,
        showCorrections: true,
        showStats: true,
        confidenceThreshold: 0.5
      });

    } catch (error) {
      console.error('Failed to start camera:', error);
      setCameraStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Camera initialization failed'
      }));
    }
  }, [visualEnabled]);

  // Stop camera
  const stopCamera = useCallback(() => {
    cameraService.stopProcessing();
    cameraService.dispose();
    setCameraStatus({
      isInitialized: false,
      isProcessing: false,
      fps: 0,
      error: null
    });
  }, []);

  // Start form analysis session
  const startSession = useCallback(async () => {
    if (!cameraStatus.isInitialized) {
      await startCamera();
    }

    try {
      // Configure coaching service
      formCoaching.setConfig({
        voiceEnabled,
        visualEnabled,
        feedbackDelay: 3000,
        strictnessLevel
      });

      // Start coaching session
      await formCoaching.startSession(exercise);
      setIsSessionActive(true);
      
      // Start processing frames
      setCameraStatus(prev => ({ ...prev, isProcessing: true }));
      
      cameraService.startProcessing(async (canvas) => {
        const result = await formCoaching.processFrame(canvas);
        
        if (result && result.formAnalysis) {
          setCurrentMetrics({
            formScore: result.formAnalysis.formScore,
            repCount: result.formAnalysis.repCount,
            tempo: result.formAnalysis.tempo,
            errors: result.formAnalysis.errors,
            suggestions: result.formAnalysis.suggestions
          });
        }
        
        return result;
      });

      // Update FPS metrics
      processingIntervalRef.current = window.setInterval(() => {
        const metrics = cameraService.getMetrics();
        setCameraStatus(prev => ({ ...prev, fps: metrics.fps }));
      }, 1000);

    } catch (error) {
      console.error('Failed to start session:', error);
      setIsSessionActive(false);
    }
  }, [cameraStatus.isInitialized, exercise, voiceEnabled, visualEnabled, strictnessLevel, startCamera]);

  // End form analysis session
  const endSession = useCallback(async () => {
    if (!isSessionActive) return;

    try {
      // Stop camera processing
      cameraService.stopProcessing();
      setCameraStatus(prev => ({ ...prev, isProcessing: false }));

      // End coaching session and get summary
      const summary = await formCoaching.endSession();
      setSessionSummary(summary);
      setIsSessionActive(false);

      // Clear interval
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [isSessionActive]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    try {
      await cameraService.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }, []);

  // Take snapshot
  const takeSnapshot = useCallback(() => {
    return cameraService.takeSnapshot();
  }, []);

  // Set draw options
  const setDrawOptions = useCallback((options: any) => {
    cameraService.setDrawOptions(options);
  }, []);

  // Set coaching config
  const setCoachingConfig = useCallback((config: any) => {
    formCoaching.setConfig(config);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        endSession();
      }
      stopCamera();
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  // Update exercise when it changes
  useEffect(() => {
    if (isSessionActive) {
      // Restart session with new exercise
      endSession().then(() => {
        startSession();
      });
    }
  }, [exercise]);

  return {
    // Status
    cameraStatus,
    isSessionActive,
    
    // Metrics
    currentMetrics,
    sessionSummary,
    
    // Actions
    startCamera,
    stopCamera,
    startSession,
    endSession,
    switchCamera,
    takeSnapshot,
    
    // Settings
    setDrawOptions,
    setCoachingConfig,
    
    // Refs
    videoRef,
    canvasRef
  };
}