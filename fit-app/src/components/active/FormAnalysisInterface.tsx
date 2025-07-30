import React, { useState, useEffect } from 'react';
import { Camera, CameraOff, Volume2, VolumeX, SwitchCamera, Download, Play, Square, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormAnalysis } from '../../hooks/useFormAnalysis';

interface Exercise {
  id: string;
  name: string;
  category: string;
  targetReps: number;
}

const exercises: Exercise[] = [
  { id: 'squat', name: 'Squat', category: 'Lower Body', targetReps: 12 },
  { id: 'pushup', name: 'Push-up', category: 'Upper Body', targetReps: 10 },
  { id: 'deadlift', name: 'Deadlift', category: 'Full Body', targetReps: 8 },
  { id: 'bicepCurl', name: 'Bicep Curl', category: 'Arms', targetReps: 12 },
  { id: 'shoulderPress', name: 'Shoulder Press', category: 'Shoulders', targetReps: 10 }
];

interface FormAnalysisInterfaceProps {
  onClose?: () => void;
}

export const FormAnalysisInterface: React.FC<FormAnalysisInterfaceProps> = ({ onClose }) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showVisualOverlays, setShowVisualOverlays] = useState(true);
  const [strictnessLevel, setStrictnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [showTips, setShowTips] = useState(true);

  const {
    cameraStatus,
    isSessionActive,
    currentMetrics,
    sessionSummary,
    startCamera,
    stopCamera,
    startSession,
    endSession,
    switchCamera,
    takeSnapshot,
    setDrawOptions,
    setCoachingConfig,
    videoRef,
    canvasRef
  } = useFormAnalysis({
    exercise: selectedExercise.id,
    voiceEnabled,
    visualEnabled: showVisualOverlays,
    strictnessLevel
  });

  // Update settings when they change
  useEffect(() => {
    setCoachingConfig({
      voiceEnabled,
      visualEnabled: showVisualOverlays,
      feedbackDelay: 3000,
      strictnessLevel
    });
  }, [voiceEnabled, strictnessLevel, setCoachingConfig]);

  useEffect(() => {
    setDrawOptions({
      showSkeleton: showVisualOverlays,
      showAngles: showVisualOverlays,
      showCorrections: showVisualOverlays,
      showStats: true,
      confidenceThreshold: 0.5
    });
  }, [showVisualOverlays, setDrawOptions]);

  const handleExerciseChange = (exercise: Exercise) => {
    if (isSessionActive) {
      endSession();
    }
    setSelectedExercise(exercise);
  };

  const handleTakeSnapshot = () => {
    const snapshot = takeSnapshot();
    if (snapshot) {
      // Download the snapshot
      const link = document.createElement('a');
      link.download = `form-check-${selectedExercise.id}-${Date.now()}.png`;
      link.href = snapshot;
      link.click();
    }
  };

  const getFormScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFormScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Camera className="text-blue-500" />
            AI Form Analysis
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Panel - Camera View */}
          <div className="flex-1 bg-black relative">
            {/* Video and Canvas */}
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* Camera not initialized overlay */}
              {!cameraStatus.isInitialized && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                  <div className="text-center">
                    <CameraOff size={64} className="mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 mb-4">Camera not started</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Camera
                    </button>
                    {cameraStatus.error && (
                      <p className="text-red-500 mt-2 text-sm">{cameraStatus.error}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Session Summary Overlay */}
              <AnimatePresence>
                {sessionSummary && !isSessionActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 p-8"
                  >
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
                      <h3 className="text-xl font-bold text-white mb-4">Session Summary</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Exercise:</span>
                          <span className="text-white">{sessionSummary.exercise}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-white">{sessionSummary.duration}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Reps:</span>
                          <span className="text-white">{sessionSummary.totalReps}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Form Score:</span>
                          <span className={`font-bold ${getFormScoreColor(sessionSummary.avgFormScore)}`}>
                            {sessionSummary.avgFormScore}%
                          </span>
                        </div>
                      </div>

                      {sessionSummary.topIssues.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-400 mb-2">Areas to Improve:</p>
                          <ul className="list-disc list-inside text-sm text-gray-300">
                            {sessionSummary.topIssues.map((issue: string, index: number) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {sessionSummary.aiInsights && (
                        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">AI Coach Tips:</p>
                          <p className="text-sm text-white">{sessionSummary.aiInsights}</p>
                        </div>
                      )}

                      <button
                        onClick={() => window.location.reload()}
                        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start New Session
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Camera Controls */}
              {cameraStatus.isInitialized && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-gray-800 bg-opacity-75 text-white rounded-full hover:bg-opacity-100 transition-all"
                  >
                    <SwitchCamera size={20} />
                  </button>
                  
                  {isSessionActive && (
                    <button
                      onClick={handleTakeSnapshot}
                      className="p-3 bg-gray-800 bg-opacity-75 text-white rounded-full hover:bg-opacity-100 transition-all"
                    >
                      <Download size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Controls and Metrics */}
          <div className="w-96 bg-gray-800 p-6 overflow-y-auto">
            {/* Exercise Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Select Exercise</h3>
              <div className="space-y-2">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => handleExerciseChange(exercise)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedExercise.id === exercise.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-xs opacity-75">{exercise.category}</p>
                      </div>
                      <span className="text-sm opacity-75">{exercise.targetReps} reps</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="mb-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Settings</h3>
              
              {/* Voice Feedback */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Voice Feedback</span>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-lg transition-all ${
                    voiceEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>

              {/* Visual Overlays */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Visual Overlays</span>
                <button
                  onClick={() => setShowVisualOverlays(!showVisualOverlays)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    showVisualOverlays ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {showVisualOverlays ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Strictness Level */}
              <div>
                <span className="text-sm text-gray-300 block mb-2">Strictness Level</span>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setStrictnessLevel(level)}
                      className={`flex-1 px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                        strictnessLevel === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Session Control */}
            <div className="mb-6">
              {!isSessionActive ? (
                <button
                  onClick={startSession}
                  disabled={!cameraStatus.isInitialized}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Start Session
                </button>
              ) : (
                <button
                  onClick={endSession}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Square size={20} />
                  End Session
                </button>
              )}
            </div>

            {/* Live Metrics */}
            {isSessionActive && currentMetrics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Form Score */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Form Score</span>
                    <span className={`text-3xl font-bold ${getFormScoreColor(currentMetrics.formScore)}`}>
                      {currentMetrics.formScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getFormScoreBg(currentMetrics.formScore)}`}
                      style={{ width: `${currentMetrics.formScore}%` }}
                    />
                  </div>
                </div>

                {/* Rep Count */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Reps Completed</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">{currentMetrics.repCount}</span>
                      <span className="text-sm text-gray-400 ml-1">/ {selectedExercise.targetReps}</span>
                    </div>
                  </div>
                </div>

                {/* Tempo */}
                {currentMetrics.tempo > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Rep Tempo</span>
                      <span className="text-lg font-medium text-white">{currentMetrics.tempo}s</span>
                    </div>
                  </div>
                )}

                {/* Current Errors */}
                {currentMetrics.errors.length > 0 && (
                  <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-400 mb-2">Form Corrections</p>
                    <ul className="space-y-1">
                      {currentMetrics.errors.slice(0, 2).map((error: any, index: number) => (
                        <li key={index} className="text-xs text-red-300">
                          • {error.correction}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {currentMetrics.suggestions.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-400 mb-2">Tips</p>
                    <ul className="space-y-1">
                      {currentMetrics.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-xs text-gray-300">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Camera Stats */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Camera FPS</span>
                    <span className="text-sm font-mono text-gray-300">{cameraStatus.fps}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tips */}
            {showTips && !isSessionActive && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">Pro Tips</p>
                    <ul className="text-xs text-blue-300 space-y-1">
                      <li>• Stand 6-8 feet from camera for full body view</li>
                      <li>• Ensure good lighting on your body</li>
                      <li>• Wear fitted clothing for better detection</li>
                      <li>• Keep the area clear of obstructions</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};