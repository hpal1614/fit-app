import React from 'react';

interface NimbusMacroRingProps {
  current: number;
  target: number;
  color: string;
  label: string;
  unit?: string;
  size?: number;
}

export const NimbusMacroRing: React.FC<NimbusMacroRingProps> = ({
  current,
  target,
  color,
  label,
  unit = '',
  size = 80
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const circumference = 2 * Math.PI * (size / 2 - 10);
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="nimbus-macro-ring relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          stroke="#E5E7EB"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {Math.round(current)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          / {target}{unit}
        </span>
      </div>
      
      {/* Label */}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 text-center">
        {label}
      </p>
    </div>
  );
}; 