import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Clock, Bell, Zap } from 'lucide-react';

interface RestTimerSettingsProps {
  isVisible: boolean;
  onClose: () => void;
  settings: {
    soundEnabled: boolean;
    defaultRestTime: number;
    completionSound: 'whistle' | 'bell' | 'chime' | 'custom';
    showMotivationalMessages: boolean;
    autoStartNextSet: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export const RestTimerSettings: React.FC<RestTimerSettingsProps> = ({
  isVisible,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const soundOptions = [
    { value: 'whistle', label: 'Whistle', icon: '🔊' },
    { value: 'bell', label: 'Bell', icon: '🔔' },
    { value: 'chime', label: 'Chime', icon: '🎵' },
    { value: 'custom', label: 'Custom', icon: '🎧' }
  ];

  const defaultRestTimes = [
    { value: 60, label: '1 minute' },
    { value: 90, label: '1.5 minutes' },
    { value: 120, label: '2 minutes' },
    { value: 180, label: '3 minutes' },
    { value: 300, label: '5 minutes' }
  ];

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-2xl shadow-2xl p-6 w-full max-w-md animate-slide-up-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        <div className="text-center">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Settings size={24} className="text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Rest Timer Settings</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close Settings"
            >
              ✕
            </button>
          </div>

          {/* Sound Settings */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Volume2 size={16} className="mr-2" />
              Sound Settings
            </h4>
            
            <div className="space-y-3">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Enable Sounds</span>
                <button
                  onClick={() => handleSettingChange('soundEnabled', !localSettings.soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localSettings.soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    localSettings.soundEnabled ? 'transform translate-x-6' : 'transform translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Completion Sound */}
              {localSettings.soundEnabled && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Completion Sound</label>
                  <div className="grid grid-cols-2 gap-2">
                    {soundOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleSettingChange('completionSound', option.value)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          localSettings.completionSound === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{option.icon}</div>
                        <div className="text-xs">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timer Settings */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Clock size={16} className="mr-2" />
              Timer Settings
            </h4>
            
            <div className="space-y-3">
              {/* Default Rest Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Default Rest Time</label>
                <select
                  value={localSettings.defaultRestTime}
                  onChange={(e) => handleSettingChange('defaultRestTime', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {defaultRestTimes.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto Start Next Set */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Auto-start next set</span>
                <button
                  onClick={() => handleSettingChange('autoStartNextSet', !localSettings.autoStartNextSet)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localSettings.autoStartNextSet ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    localSettings.autoStartNextSet ? 'transform translate-x-6' : 'transform translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Bell size={16} className="mr-2" />
              Display Settings
            </h4>
            
            <div className="space-y-3">
              {/* Motivational Messages */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Show motivational messages</span>
                <button
                  onClick={() => handleSettingChange('showMotivationalMessages', !localSettings.showMotivationalMessages)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localSettings.showMotivationalMessages ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    localSettings.showMotivationalMessages ? 'transform translate-x-6' : 'transform translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Reset to defaults
                const defaultSettings = {
                  soundEnabled: true,
                  defaultRestTime: 120,
                  completionSound: 'whistle' as const,
                  showMotivationalMessages: true,
                  autoStartNextSet: false
                };
                setLocalSettings(defaultSettings);
                onSettingsChange(defaultSettings);
              }}
              className="flex-1 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestTimerSettings; 