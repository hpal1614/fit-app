import React, { useState } from 'react';
import { FixedVoiceButton } from './FixedVoiceButton';
import { NimbusCard } from '../../nimbus/components/NimbusCard';

export const SimpleVoiceTest: React.FC = () => {
  const [transcripts, setTranscripts] = useState<string[]>([]);

  const handleTranscript = (transcript: string) => {
    console.log('🎤 Received transcript:', transcript);
    setTranscripts(prev => [transcript, ...prev.slice(0, 9)]); // Keep last 10
  };

  const clearTranscripts = () => {
    setTranscripts([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎤 Voice System Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the fixed voice recognition system
          </p>
        </div>

        {/* Voice Button */}
        <NimbusCard variant="glass" padding="lg">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Voice Recognition</h2>
            <FixedVoiceButton 
              onTranscript={handleTranscript}
              className="mx-auto"
            />
          </div>
        </NimbusCard>

        {/* Instructions */}
        <NimbusCard variant="bordered" padding="lg">
          <h3 className="text-lg font-semibold mb-3">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>Click the microphone button to start listening</li>
            <li>Allow microphone permission when prompted</li>
            <li>Speak clearly into your microphone</li>
            <li>Check the transcript appears below</li>
            <li>Try the "Test Speech" button to test text-to-speech</li>
          </ol>
        </NimbusCard>

        {/* Transcript History */}
        {transcripts.length > 0 && (
          <NimbusCard variant="bordered" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Transcripts</h3>
              <button
                onClick={clearTranscripts}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {transcripts.map((transcript, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Transcript #{transcripts.length - index}:
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    "{transcript}"
                  </p>
                </div>
              ))}
            </div>
          </NimbusCard>
        )}

        {/* Troubleshooting */}
        <NimbusCard variant="bordered" padding="lg">
          <h3 className="text-lg font-semibold mb-3">Troubleshooting</h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>No microphone access:</strong> Check browser permissions and allow microphone access</p>
            <p><strong>Not hearing speech:</strong> Check your system volume and browser audio settings</p>
            <p><strong>Poor recognition:</strong> Speak clearly and ensure good microphone quality</p>
            <p><strong>HTTPS required:</strong> Voice features require HTTPS in production</p>
          </div>
        </NimbusCard>
      </div>
    </div>
  );
}; 