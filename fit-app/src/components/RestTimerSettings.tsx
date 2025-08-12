import React, { useState } from 'react';
import { Clock, Settings } from 'lucide-react';

interface RestTimerSettingsProps {
  onSave: (settings: any) => void;
  className?: string;
}

const RestTimerSettings: React.FC<RestTimerSettingsProps> = ({ onSave, className = '' }) => {
  const [settings, setSettings] = useState({
    defaultRestTime: 90,
    autoStart: false,
    soundEnabled: true
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <Clock className="text-fitness-blue" size={24} />
        <h2 className="text-xl font-bold text-gray-900">Rest Timer Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Rest Time (seconds)
          </label>
          <input
            type="number"
            value={settings.defaultRestTime}
            onChange={(e) => setSettings(prev => ({ ...prev, defaultRestTime: Number(e.target.value) }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fitness-blue"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Auto-start timer</span>
          <input
            type="checkbox"
            checked={settings.autoStart}
            onChange={(e) => setSettings(prev => ({ ...prev, autoStart: e.target.checked }))}
            className="h-4 w-4 text-fitness-blue focus:ring-fitness-blue border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Sound notifications</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
            className="h-4 w-4 text-fitness-blue focus:ring-fitness-blue border-gray-300 rounded"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-fitness-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default RestTimerSettings;

