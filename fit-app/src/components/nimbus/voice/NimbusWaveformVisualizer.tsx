/**
 * Nimbus Waveform Visualizer
 * Real-time audio waveform visualization with multiple styles
 */

import React, { useRef, useEffect } from 'react';
import { NimbusWaveformData } from '../../../services/nimbus/NimbusAdvancedVoiceService';

export interface NimbusWaveformVisualizerProps {
  waveformData: NimbusWaveformData | null;
  isListening: boolean;
  isSpeaking: boolean;
  style: 'bars' | 'wave' | 'circle' | 'spectrum';
  size: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  showNoiseLevel?: boolean;
  showVoiceActivity?: boolean;
}

export const NimbusWaveformVisualizer: React.FC<NimbusWaveformVisualizerProps> = ({
  waveformData,
  isListening,
  isSpeaking,
  style = 'bars',
  size = 'md',
  color = '#3B82F6',
  className = '',
  showNoiseLevel = true,
  showVoiceActivity = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const sizes = {
    sm: { width: 120, height: 60 },
    md: { width: 200, height: 80 },
    lg: { width: 300, height: 120 },
    xl: { width: 400, height: 160 }
  };

  const { width, height } = sizes[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (style === 'bars') {
        drawBars(ctx);
      } else if (style === 'wave') {
        drawWave(ctx);
      } else if (style === 'circle') {
        drawCircle(ctx);
      } else if (style === 'spectrum') {
        drawSpectrum(ctx);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveformData, isListening, isSpeaking, width, height, style, color]);

  const drawBars = (ctx: CanvasRenderingContext2D) => {
    const barCount = 32;
    const barWidth = (width - (barCount - 1) * 2) / barCount;
    
    for (let i = 0; i < barCount; i++) {
      let barHeight: number;
      
      if (waveformData && (isListening || isSpeaking)) {
        const dataIndex = Math.floor((i / barCount) * waveformData.volumes.length);
        barHeight = Math.max(4, waveformData.volumes[dataIndex] * height);
      } else {
        // Idle state - minimal bars
        barHeight = 4 + Math.random() * 8;
      }

      const x = i * (barWidth + 2);
      const y = height - barHeight;

      // Gradient based on activity
      const gradient = ctx.createLinearGradient(0, y, 0, height);
      if (isSpeaking) {
        gradient.addColorStop(0, '#10B981'); // Green for speaking
        gradient.addColorStop(1, '#059669');
      } else if (isListening) {
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');
      } else {
        gradient.addColorStop(0, '#6B7280'); // Gray for idle
        gradient.addColorStop(1, '#4B5563');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  };

  const drawWave = (ctx: CanvasRenderingContext2D) => {
    if (!waveformData || (!isListening && !isSpeaking)) {
      // Draw idle wave
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < width; x += 2) {
        const y = height / 2 + Math.sin(x * 0.02 + Date.now() * 0.001) * 10;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      return;
    }

    // Draw active waveform
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    if (isSpeaking) {
      gradient.addColorStop(0, '#10B981');
      gradient.addColorStop(0.5, '#34D399');
      gradient.addColorStop(1, '#10B981');
    } else {
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color + 'AA');
      gradient.addColorStop(1, color);
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const sliceWidth = width / waveformData.volumes.length;
    let x = 0;

    for (let i = 0; i < waveformData.volumes.length; i++) {
      const volume = waveformData.volumes[i];
      const y = height / 2 + (volume - 0.5) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 4;
    
    if (!waveformData || (!isListening && !isSpeaking)) {
      // Static circle for idle state
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }

    // Dynamic circle based on audio
    const avgVolume = waveformData.average;
    const radius = baseRadius + avgVolume * 30;
    
    // Create circular gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    if (isSpeaking) {
      gradient.addColorStop(0, '#10B981' + '40');
      gradient.addColorStop(1, '#10B981');
    } else {
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color);
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Voice activity indicator
    if (showVoiceActivity && waveformData.voiceActivity) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  };

  const drawSpectrum = (ctx: CanvasRenderingContext2D) => {
    if (!waveformData) return;

    const barCount = 64;
    const barWidth = width / barCount;

    for (let i = 0; i < barCount; i++) {
      const frequency = waveformData.frequencies[i] || 0;
      const barHeight = Math.max(2, (frequency + 140) * height / 100); // Convert dB to height

      const x = i * barWidth;
      const y = height - barHeight;

      // Color based on frequency range
      let barColor = color;
      if (i < barCount / 4) {
        barColor = '#EF4444'; // Red for low frequencies
      } else if (i < barCount / 2) {
        barColor = '#F59E0B'; // Orange for mid frequencies  
      } else {
        barColor = '#10B981'; // Green for high frequencies
      }

      ctx.fillStyle = barColor + (isListening || isSpeaking ? 'FF' : '60');
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  };

  return (
    <div className={`nimbus-waveform-visualizer ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg"
      />
      
      {/* Status indicators */}
      {(showNoiseLevel || showVoiceActivity) && waveformData && (
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          {showNoiseLevel && (
            <span>Noise: {Math.round(waveformData.noiseLevel * 100)}%</span>
          )}
          {showVoiceActivity && (
            <span className={waveformData.voiceActivity ? 'text-green-500' : 'text-gray-400'}>
              {waveformData.voiceActivity ? '🎤 Voice' : '🔇 Silent'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}; 