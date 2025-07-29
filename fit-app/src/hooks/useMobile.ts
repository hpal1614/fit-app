import { useState, useEffect, useCallback, useRef } from 'react';
import { mobileService, SwipeGesture, HapticPattern } from '../services/mobileService';

interface UseMobileOptions {
  enableWakeLock?: boolean;
  enableSwipeGestures?: boolean;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
}

interface UseMobileReturn {
  // Device info
  isMobile: boolean;
  isInstalled: boolean;
  orientation: 'portrait' | 'landscape';
  networkStatus: { online: boolean; effectiveType?: string };
  batteryLevel: number | null;
  
  // Capabilities
  capabilities: {
    touch: boolean;
    motion: boolean;
    orientation: boolean;
    vibration: boolean;
    wakeLock: boolean;
    camera: boolean;
    microphone: boolean;
  };
  
  // Actions
  vibrate: (pattern?: HapticPattern) => void;
  requestWakeLock: () => Promise<boolean>;
  releaseWakeLock: () => Promise<void>;
  requestMotionPermission: () => Promise<boolean>;
  
  // Swipe handling
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  
  lastSwipe: SwipeGesture | null;
}

export function useMobile(options: UseMobileOptions = {}): UseMobileReturn {
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [networkStatus, setNetworkStatus] = useState({ online: true });
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [capabilities, setCapabilities] = useState(mobileService.getDeviceCapabilities());
  const [lastSwipe, setLastSwipe] = useState<SwipeGesture | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Initialize mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
      
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if installed as PWA
  useEffect(() => {
    setIsInstalled(mobileService.isInstalledPWA());
  }, []);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = (e: Event) => {
      const event = e as CustomEvent;
      setOrientation(event.detail.orientation);
    };

    setOrientation(mobileService.getOrientation());
    window.addEventListener('orientationChanged', handleOrientationChange);
    
    return () => window.removeEventListener('orientationChanged', handleOrientationChange);
  }, []);

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(mobileService.getNetworkStatus());
    };

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Monitor battery status
  useEffect(() => {
    const updateBatteryStatus = async () => {
      const battery = await mobileService.getBatteryStatus();
      if (battery) {
        setBatteryLevel(battery.level);
      }
    };

    updateBatteryStatus();
    const interval = setInterval(updateBatteryStatus, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Enable wake lock if requested
  useEffect(() => {
    if (options.enableWakeLock && isMobile) {
      mobileService.requestWakeLock();
      
      return () => {
        mobileService.releaseWakeLock();
      };
    }
  }, [options.enableWakeLock, isMobile]);

  // Vibrate function
  const vibrate = useCallback((pattern: HapticPattern = { type: 'selection', intensity: 'light' }) => {
    if (capabilities.vibration) {
      mobileService.triggerHaptic(pattern);
    }
  }, [capabilities.vibration]);

  // Wake lock functions
  const requestWakeLock = useCallback(async () => {
    return await mobileService.requestWakeLock();
  }, []);

  const releaseWakeLock = useCallback(async () => {
    return await mobileService.releaseWakeLock();
  }, []);

  // Motion permission
  const requestMotionPermission = useCallback(async () => {
    return await mobileService.requestMotionPermission();
  }, []);

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (options.enableSwipeGestures) {
      mobileService.handleTouchStart(e.nativeEvent);
    }
  }, [options.enableSwipeGestures]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (options.enableSwipeGestures) {
      mobileService.handleTouchEnd(e.nativeEvent, (gesture) => {
        setLastSwipe(gesture);
        vibrate({ type: 'selection', intensity: 'light' });
      });
    }
  }, [options.enableSwipeGestures, vibrate]);

  // Pull to refresh
  useEffect(() => {
    if (options.enablePullToRefresh && options.onRefresh && containerRef.current) {
      const cleanup = mobileService.enablePullToRefresh(
        containerRef.current,
        options.onRefresh
      );
      
      return cleanup;
    }
  }, [options.enablePullToRefresh, options.onRefresh]);

  // Handle virtual keyboard
  useEffect(() => {
    if (isMobile) {
      mobileService.handleVirtualKeyboard();
    }
  }, [isMobile]);

  return {
    // Device info
    isMobile,
    isInstalled,
    orientation,
    networkStatus,
    batteryLevel,
    
    // Capabilities
    capabilities,
    
    // Actions
    vibrate,
    requestWakeLock,
    releaseWakeLock,
    requestMotionPermission,
    
    // Swipe handling
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd
    },
    
    lastSwipe
  };
}

// Specific mobile hooks
export function useDeviceMotion(onMotion: (data: DeviceMotionEvent) => void) {
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const startTracking = useCallback(async () => {
    const permission = await mobileService.requestMotionPermission();
    setHasPermission(permission);
    
    if (permission) {
      const cleanup = mobileService.startMotionTracking(onMotion);
      setIsTracking(true);
      
      return cleanup;
    }
  }, [onMotion]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  return {
    isTracking,
    hasPermission,
    startTracking,
    stopTracking
  };
}

export function usePullToRefresh(
  containerRef: React.RefObject<HTMLElement>,
  onRefresh: () => Promise<void>
) {
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = mobileService.enablePullToRefresh(
        containerRef.current,
        onRefresh
      );
      
      return cleanup;
    }
  }, [containerRef, onRefresh]);
}

export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void
) {
  const handleSwipe = useCallback((gesture: SwipeGesture) => {
    switch (gesture.direction) {
      case 'left':
        onSwipeLeft?.();
        break;
      case 'right':
        onSwipeRight?.();
        break;
      case 'up':
        onSwipeUp?.();
        break;
      case 'down':
        onSwipeDown?.();
        break;
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    mobileService.handleTouchStart(e.nativeEvent);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    mobileService.handleTouchEnd(e.nativeEvent, handleSwipe);
  }, [handleSwipe]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  };
}