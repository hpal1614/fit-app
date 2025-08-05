import React, { useState } from 'react';
import { X, Settings, Play, Pause, Timer, Volume2, Bell, Shield, Database, Zap } from 'lucide-react';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  settings: {
    autoAdvanceEnabled: boolean;
    defaultRestTime: number;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    voiceCommandsEnabled: boolean;
    aiCoachingEnabled: boolean;
    offlineMode: boolean;
    debugMode: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
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

  const settingGroups = [
    {
      title: "Workout Settings",
      icon: <Play className="w-5 h-5" />,
      settings: [
        {
          key: 'autoAdvanceEnabled',
          label: 'Auto-Advance Exercises',
          description: 'Automatically move to next exercise when all sets are completed',
          type: 'toggle',
          icon: <Play className="w-4 h-4" />
        },
        {
          key: 'defaultRestTime',
          label: 'Default Rest Timer',
          description: 'Default rest time between exercises',
          type: 'select',
          options: [
            { value: 60, label: '1 minute' },
            { value: 90, label: '1.5 minutes' },
            { value: 120, label: '2 minutes' },
            { value: 180, label: '3 minutes' },
            { value: 300, label: '5 minutes' }
          ],
          icon: <Timer className="w-4 h-4" />
        }
      ]
    },
    {
      title: "Audio & Notifications",
      icon: <Volume2 className="w-5 h-5" />,
      settings: [
        {
          key: 'soundEnabled',
          label: 'Sound Effects',
          description: 'Play sounds for timer completion and actions',
          type: 'toggle',
          icon: <Volume2 className="w-4 h-4" />
        },
        {
          key: 'notificationsEnabled',
          label: 'Push Notifications',
          description: 'Receive workout reminders and progress updates',
          type: 'toggle',
          icon: <Bell className="w-4 h-4" />
        }
      ]
    },
    {
      title: "AI & Voice",
      icon: <Zap className="w-5 h-5" />,
      settings: [
        {
          key: 'voiceCommandsEnabled',
          label: 'Voice Commands',
          description: 'Enable "Hey Coach" voice control system',
          type: 'toggle',
          icon: <Volume2 className="w-4 h-4" />
        },
        {
          key: 'aiCoachingEnabled',
          label: 'AI Coaching',
          description: 'Enable AI-powered workout suggestions and form analysis',
          type: 'toggle',
          icon: <Zap className="w-4 h-4" />
        }
      ]
    },
    {
      title: "Advanced",
      icon: <Settings className="w-5 h-5" />,
      settings: [
        {
          key: 'offlineMode',
          label: 'Offline Mode',
          description: 'Work without internet connection',
          type: 'toggle',
          icon: <Database className="w-4 h-4" />
        },
        {
          key: 'debugMode',
          label: 'Debug Mode',
          description: 'Show detailed logs and error information',
          type: 'toggle',
          icon: <Shield className="w-4 h-4" />
        }
      ]
    }
  ];

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <div className="space-y-8">
            {settingGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-800">
                  <div className="text-green-400">
                    {group.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                </div>

                {/* Group Settings */}
                <div className="space-y-4">
                  {group.settings.map((setting, settingIndex) => (
                    <div key={settingIndex} className="flex items-center justify-between p-4 glass rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-gray-400 mt-0.5">
                          {setting.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{setting.label}</div>
                          <div className="text-sm text-gray-400 mt-1">{setting.description}</div>
                        </div>
                      </div>

                      {/* Setting Control */}
                      <div className="ml-4">
                        {setting.type === 'toggle' && (
                          <button
                            onClick={() => handleSettingChange(setting.key, !localSettings[setting.key as keyof typeof localSettings])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              localSettings[setting.key as keyof typeof localSettings]
                                ? 'bg-green-500'
                                : 'bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                localSettings[setting.key as keyof typeof localSettings]
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}

                        {setting.type === 'select' && (
                          <select
                            value={localSettings[setting.key as keyof typeof localSettings]}
                            onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value))}
                            className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-green-500 focus:outline-none"
                          >
                            {setting.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 