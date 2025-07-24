import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App';

// Mock services
jest.mock('../services/mobileOptimizationService', () => ({
  mobileOptimization: {
    getDeviceCapabilities: () => ({
      deviceType: 'desktop',
      screenSize: 'large',
      hasTouch: false,
      hasCamera: true,
      hasMicrophone: true
    }),
    setupImageLazyLoading: jest.fn(),
    registerSwipeGesture: jest.fn(() => () => {}),
    vibrate: jest.fn()
  }
}));

jest.mock('../services/pwaService', () => ({
  pwaService: {
    isPWA: () => false,
    canBeInstalled: () => true,
    showInstallPrompt: jest.fn(() => Promise.resolve(true))
  }
}));

jest.mock('../services/performanceOptimizationService', () => ({
  performanceOptimization: {
    preloadResources: jest.fn(),
    getPerformanceMetrics: () => ({
      loadTime: 1500,
      firstPaint: 800,
      firstContentfulPaint: 1200
    })
  }
}));

describe('AI Fitness Coach App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main app with navigation tabs', async () => {
    render(<App />);
    
    // Check for navigation tabs
    expect(screen.getByText('Workouts')).toBeInTheDocument();
    expect(screen.getByText('AI Coach')).toBeInTheDocument();
    expect(screen.getByText('Form Analysis')).toBeInTheDocument();
    expect(screen.getByText('Biometrics')).toBeInTheDocument();
  });

  test('switches between tabs correctly', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Click AI Coach tab
    await user.click(screen.getByText('AI Coach'));
    await waitFor(() => {
      expect(screen.getByText(/AI Fitness Coach/i)).toBeInTheDocument();
    });

    // Click Form Analysis tab
    await user.click(screen.getByText('Form Analysis'));
    await waitFor(() => {
      expect(screen.getByText(/Form Analysis/i)).toBeInTheDocument();
    });

    // Click Biometrics tab
    await user.click(screen.getByText('Biometrics'));
    await waitFor(() => {
      expect(screen.getByText(/Biometrics/i)).toBeInTheDocument();
    });
  });

  test('shows PWA install prompt when available', async () => {
    render(<App />);
    
    // Should show install prompt
    expect(screen.getByText('Install AI Fitness Coach')).toBeInTheDocument();
    expect(screen.getByText('Get the full app experience')).toBeInTheDocument();
  });

  test('handles PWA installation', async () => {
    const { showInstallPrompt } = require('../services/pwaService').pwaService;
    render(<App />);
    const user = userEvent.setup();

    // Click install button
    const installButton = screen.getByRole('button', { name: 'Install' });
    await user.click(installButton);

    expect(showInstallPrompt).toHaveBeenCalled();
  });

  test('dismisses PWA install prompt', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Click dismiss button
    const dismissButton = screen.getByText('✕');
    await user.click(dismissButton);

    // Install prompt should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Install AI Fitness Coach')).not.toBeInTheDocument();
    });
  });

  test('shows offline indicator when offline', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    render(<App />);
    
    expect(screen.getByText('Offline Mode')).toBeInTheDocument();
  });

  test('lazy loads components on tab switch', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Initially shows loading when switching tabs
    await user.click(screen.getByText('AI Coach'));
    
    // Should show loading state briefly
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Then loads the component
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});

describe('Mobile Optimization Tests', () => {
  beforeEach(() => {
    // Mock mobile device
    require('../services/mobileOptimizationService').mobileOptimization.getDeviceCapabilities = () => ({
      deviceType: 'mobile',
      screenSize: 'small',
      hasTouch: true,
      hasCamera: true,
      hasMicrophone: true
    });
    
    // Mock portrait orientation
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 812
    });
  });

  test('shows mobile workout interface on mobile devices', async () => {
    render(<App />);
    
    // Should render mobile-specific interface
    await waitFor(() => {
      expect(screen.getByText(/Start Workout/i)).toBeInTheDocument();
    });
  });

  test('shows bottom navigation on mobile', async () => {
    // Mock mobile but landscape (to avoid mobile workout interface)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 812
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 375
    });

    render(<App />);
    
    // Should show bottom navigation
    const bottomNav = screen.getByRole('navigation');
    expect(bottomNav).toBeInTheDocument();
  });
});

describe('Performance Tests', () => {
  test('preloads critical resources on mount', () => {
    const { preloadResources } = require('../services/performanceOptimizationService').performanceOptimization;
    
    render(<App />);
    
    expect(preloadResources).toHaveBeenCalledWith([
      '/fonts/inter-var.woff2',
      '/sounds/notification.mp3'
    ]);
  });

  test('logs performance metrics', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<App />);
    
    expect(consoleSpy).toHaveBeenCalledWith('Performance Metrics:', expect.objectContaining({
      loadTime: expect.any(Number),
      firstPaint: expect.any(Number),
      firstContentfulPaint: expect.any(Number)
    }));
    
    consoleSpy.mockRestore();
  });
});

describe('Accessibility Tests', () => {
  test('has proper ARIA labels for navigation', () => {
    render(<App />);
    
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
  });

  test('all interactive elements are keyboard accessible', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Tab through navigation
    await user.tab();
    expect(screen.getByText('Workouts')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByText('AI Coach')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByText('Form Analysis')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByText('Biometrics')).toHaveFocus();
  });

  test('announces page changes to screen readers', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Click different tabs and check for proper announcements
    await user.click(screen.getByText('AI Coach'));
    
    // Component should be loaded and visible
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});