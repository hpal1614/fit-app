import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Zap, Radio, Wifi, Chrome, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeVoice } from '../../hooks/useRealtimeVoice';
import { aiService } from '../../services/aiService';

interface VoiceMode {
  id: 'openai-realtime' | 'elevenlabs' | 'webrtc' | 'browser';
  name: string;
  description: string;
  latency: string;
  icon: React.ReactNode;
  color: string;
}

const voiceModes: VoiceMode[] = [
  {
    id: 'openai-realtime',
    name: 'OpenAI Realtime',
    description: 'Speech-to-speech AI coaching',
    latency: '<300ms',
    icon: <Zap size={20} />,
    color: 'bg-purple-600'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs Flash',
    description: 'Emotional voice adaptation',
    latency: '75ms',
    icon: <Volume2 size={20} />,
    color: 'bg-blue-600'
  },
  {
    id: 'webrtc',
    name: 'WebRTC Live',
    description: 'Ultra-low latency coaching',
    latency: '<100ms',
    icon: <Radio size={20} />,
    color: 'bg-green-600'
  },
  {
    id: 'browser',
    name: 'Browser TTS',
    description: 'Fallback voice mode',
    latency: '~150ms',
    icon: <Chrome size={20} />,
    color: 'bg-gray-600'
  }
];

interface WorkoutIntensity {
  level: 'low' | 'medium' | 'high';
  name: string;
  color: string;
  pulse: boolean;
}

const intensityLevels: WorkoutIntensity[] = [
  { level: 'low', name: 'Warm-up', color: 'bg-blue-500', pulse: false },
  { level: 'medium', name: 'Working', color: 'bg-yellow-500', pulse: false },
  { level: 'high', name: 'Intense', color: 'bg-red-500', pulse: true }
];

export const VoiceCoachInterface: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<VoiceMode>(voiceModes[0]);
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>(intensityLevels[1]);
  const [showMetrics, setShowMetrics] = useState(true);
  
  const {
    isInitialized,
    isListening,
    isSpeaking,
    currentMode,
    transcript,
    response,
    metrics,
    startListening,
    stopListening,
    speak,
    switchMode,
    updateWorkoutContext,
    setEmotionalTone
  } = useRealtimeVoice({
    mode: selectedMode.id,
    workoutIntensity: workoutIntensity.level,
    enableEmotionalAdaptation: true
  });

  // Update emotional tone when workout intensity changes
  useEffect(() => {
    if (isInitialized) {
      setEmotionalTone(workoutIntensity.level);
      updateWorkoutContext({ intensity: workoutIntensity.level });
      
      // Update AI service context
      aiService.updateWorkoutContext({
        intensity: workoutIntensity.level
      });
    }
  }, [workoutIntensity, isInitialized, setEmotionalTone, updateWorkoutContext]);

  const handleModeSwitch = async (mode: VoiceMode) => {
    setSelectedMode(mode);
    await switchMode(mode.id);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleIntensityChange = (intensity: WorkoutIntensity) => {
    setWorkoutIntensity(intensity);
    
    // Provide immediate voice feedback
    const feedback = {
      low: "Switching to warm-up mode. Let's take it easy and focus on form.",
      medium: "Moving to working intensity. Time to push yourself while maintaining control.",
      high: "High intensity mode! Let's give it everything you've got!"
    };
    
    speak(feedback[intensity.level]);
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="text-green-500" />
          AI Voice Coach
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isInitialized ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
          }`}>
            {isInitialized ? 'Ready' : 'Initializing...'}
          </span>
        </div>
      </div>

      {/* Voice Mode Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Voice Mode</h3>
        <div className="grid grid-cols-2 gap-3">
          {voiceModes.map((mode) => (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeSwitch(mode)}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                selectedMode.id === mode.id
                  ? 'border-green-500 bg-gray-800'
                  : 'border-gray-700 bg-gray-850 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${mode.color}`}>
                  {mode.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-white">{mode.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{mode.description}</p>
                  <p className="text-xs text-green-400 mt-1">{mode.latency} latency</p>
                </div>
              </div>
              {selectedMode.id === mode.id && (
                <motion.div
                  layoutId="selectedMode"
                  className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Workout Intensity Control */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Workout Intensity</h3>
        <div className="flex gap-2">
          {intensityLevels.map((intensity) => (
            <motion.button
              key={intensity.level}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleIntensityChange(intensity)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                workoutIntensity.level === intensity.level
                  ? `${intensity.color} text-white`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {intensity.name}
                {intensity.pulse && workoutIntensity.level === intensity.level && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Voice Control */}
      <div className="flex flex-col items-center space-y-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleListening}
          className={`relative p-8 rounded-full transition-all ${
            isListening
              ? 'bg-red-600 shadow-lg shadow-red-600/50'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          {isListening ? (
            <Mic size={40} className="text-white" />
          ) : (
            <MicOff size={40} className="text-gray-400" />
          )}
          
          {/* Listening animation */}
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-red-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.button>

        <p className="text-sm text-gray-400">
          {isListening ? 'Listening...' : 'Tap to start voice coaching'}
        </p>
      </div>

      {/* Transcript and Response */}
      <AnimatePresence>
        {(transcript || response) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {transcript && (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">You said:</p>
                <p className="text-white">{transcript}</p>
              </div>
            )}
            
            {response && (
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                <p className="text-xs text-green-400 mb-1">Coach:</p>
                <p className="text-green-100">{response}</p>
                {isSpeaking && (
                  <motion.div
                    className="mt-2 flex gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-4 bg-green-400 rounded-full"
                        animate={{ scaleY: [1, 1.5, 1] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: i * 0.1
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Metrics */}
      {showMetrics && metrics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Performance Metrics</h3>
            <button
              onClick={() => setShowMetrics(false)}
              className="text-gray-500 hover:text-gray-400"
            >
              <Wifi size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Latency</p>
              <p className="text-white font-mono">
                {metrics.averageLatency || metrics.latency || '---'}ms
              </p>
            </div>
            <div>
              <p className="text-gray-500">Quality</p>
              <p className="text-white capitalize">
                {currentMode === 'openai-realtime' && metrics.averageLatency < 300 ? 'High' :
                 currentMode === 'elevenlabs' && metrics.achievingTarget ? 'High' :
                 currentMode === 'webrtc' && metrics.averageLatency < 100 ? 'High' : 'Medium'}
              </p>
            </div>
            {metrics.emotionalAdaptations !== undefined && (
              <div>
                <p className="text-gray-500">Adaptations</p>
                <p className="text-white">{metrics.emotionalAdaptations}</p>
              </div>
            )}
            {metrics.interruptions !== undefined && (
              <div>
                <p className="text-gray-500">Interruptions</p>
                <p className="text-white">{metrics.interruptions}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick Voice Commands */}
      <div className="flex flex-wrap gap-2">
        {['Start workout', 'Check form', 'Rest timer', 'Next exercise'].map((command) => (
          <motion.button
            key={command}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => speak(command)}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-all"
          >
            {command}
          </motion.button>
        ))}
      </div>
    </div>
  );
};