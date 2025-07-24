import { useState, useEffect, useCallback, useRef } from 'react';
import { terraService, BiometricData, WorkoutBiometrics, RecoveryMetrics, SleepData } from '../services/terraService';
import { biometricAnalysis } from '../services/biometricAnalysisService';

interface UseBiometricsOptions {
  userAge?: number;
  autoConnect?: boolean;
  provider?: 'GARMIN' | 'FITBIT' | 'APPLE' | 'WHOOP' | 'OURA' | 'GOOGLE_FIT';
}

interface UseBiometricsReturn {
  // Connection status
  isConnected: boolean;
  isConnecting: boolean;
  provider: string | null;
  error: string | null;
  
  // Real-time data
  currentBiometrics: BiometricData | null;
  heartRateTrend: { timestamps: Date[]; values: number[] };
  insights: any[];
  
  // Recovery data
  recoveryMetrics: RecoveryMetrics | null;
  sleepData: SleepData | null;
  workoutAdaptation: any | null;
  
  // Actions
  connectWearable: (provider: string) => Promise<void>;
  disconnect: () => void;
  refreshRecoveryData: () => Promise<void>;
  getSleepAnalysis: () => Promise<any>;
  
  // Zone tracking
  zoneTargets: any[];
  updateZoneTargets: (workoutType: string) => void;
}

export function useBiometrics(options: UseBiometricsOptions = {}): UseBiometricsReturn {
  const { userAge = 30, autoConnect = false, provider: defaultProvider } = options;
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Biometric data
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData | null>(null);
  const [heartRateTrend, setHeartRateTrend] = useState<{ timestamps: Date[]; values: number[] }>({
    timestamps: [],
    values: []
  });
  const [insights, setInsights] = useState<any[]>([]);
  
  // Recovery data
  const [recoveryMetrics, setRecoveryMetrics] = useState<RecoveryMetrics | null>(null);
  const [sleepData, setSleepData] = useState<SleepData | null>(null);
  const [workoutAdaptation, setWorkoutAdaptation] = useState<any | null>(null);
  
  // Zone tracking
  const [zoneTargets, setZoneTargets] = useState<any[]>([]);
  
  // Refs
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set user age for biometric analysis
  useEffect(() => {
    biometricAnalysis.setUserAge(userAge);
  }, [userAge]);

  // Connect to wearable device
  const connectWearable = useCallback(async (providerName: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Generate auth URL for the provider
      const authUrl = await terraService.generateAuthUrl(providerName as any);
      
      // In production, this would open the auth URL
      // For simulation, we'll auto-connect
      if (authUrl.includes('simulation')) {
        // Simulate successful connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = await terraService.getUser('simulated-user-id');
        setProvider(user.provider);
        setIsConnected(true);
        
        // Start biometric monitoring
        startBiometricMonitoring();
        
        // Load initial recovery data
        await refreshRecoveryData();
      } else {
        // In production, redirect to auth URL
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('Failed to connect wearable:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wearable
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    setIsConnected(false);
    setProvider(null);
    setCurrentBiometrics(null);
    setRecoveryMetrics(null);
    setSleepData(null);
    setWorkoutAdaptation(null);
  }, []);

  // Start biometric monitoring
  const startBiometricMonitoring = useCallback(() => {
    // Subscribe to real-time biometrics
    unsubscribeRef.current = biometricAnalysis.startMonitoring(userAge);
    
    // Update UI every second
    updateIntervalRef.current = setInterval(() => {
      // Get current biometrics
      const current = biometricAnalysis.getCurrentBiometrics();
      setCurrentBiometrics(current);
      
      // Update heart rate trend
      const trend = biometricAnalysis.getHeartRateTrend();
      setHeartRateTrend(trend);
      
      // Update insights
      const recentInsights = biometricAnalysis.getRecentInsights();
      setInsights(recentInsights);
      
      // Update zone progress if active
      if (current?.heart_rate && zoneTargets.length > 0) {
        const updated = biometricAnalysis.updateZoneProgress(zoneTargets, current.heart_rate);
        setZoneTargets(updated);
      }
    }, 1000);
  }, [userAge, zoneTargets]);

  // Refresh recovery data
  const refreshRecoveryData = useCallback(async () => {
    try {
      // Get recovery metrics
      const recovery = await terraService.getRecoveryMetrics();
      setRecoveryMetrics(recovery);
      
      // Get sleep data
      const sleep = await terraService.getSleepData(new Date(Date.now() - 24 * 60 * 60 * 1000));
      setSleepData(sleep);
      
      // Get workout adaptation
      const adaptation = await biometricAnalysis.getWorkoutAdaptation();
      setWorkoutAdaptation(adaptation);
      
      // Add recovery recommendations to recovery metrics
      const recommendations = terraService.getPersonalizedRecommendations(
        recovery,
        await terraService.getWorkoutData(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date()
        )
      );
      
      setRecoveryMetrics({
        ...recovery,
        recommendations
      });
    } catch (err) {
      console.error('Failed to refresh recovery data:', err);
    }
  }, []);

  // Get sleep analysis
  const getSleepAnalysis = useCallback(async () => {
    try {
      return await biometricAnalysis.getSleepAnalysis();
    } catch (err) {
      console.error('Failed to get sleep analysis:', err);
      return null;
    }
  }, []);

  // Update zone targets
  const updateZoneTargets = useCallback((workoutType: string) => {
    const targets = biometricAnalysis.getZoneTargets(workoutType as any);
    setZoneTargets(targets);
  }, []);

  // Auto-connect on mount if requested
  useEffect(() => {
    if (autoConnect && defaultProvider && !isConnected) {
      connectWearable(defaultProvider);
    }
  }, [autoConnect, defaultProvider, isConnected, connectWearable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection status
    isConnected,
    isConnecting,
    provider,
    error,
    
    // Real-time data
    currentBiometrics,
    heartRateTrend,
    insights,
    
    // Recovery data
    recoveryMetrics,
    sleepData,
    workoutAdaptation,
    
    // Actions
    connectWearable,
    disconnect,
    refreshRecoveryData,
    getSleepAnalysis,
    
    // Zone tracking
    zoneTargets,
    updateZoneTargets
  };
}