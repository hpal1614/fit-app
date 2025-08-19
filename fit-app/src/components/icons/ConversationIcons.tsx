interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const defaultColor = '#a5e635';

export const ExperienceIcons = {
  Beginner: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  ),
  Intermediate: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      <path fill={color} d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" transform="translate(0, 8) scale(0.6)"/>
    </svg>
  ),
  Advanced: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      <path fill={color} d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" transform="translate(-6, 8) scale(0.4)"/>
      <path fill={color} d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" transform="translate(6, 8) scale(0.4)"/>
    </svg>
  )
};

export const GoalIcons = {
  WeightLoss: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M16.5 11H13V7.5C13 6.67 12.33 6 11.5 6S10 6.67 10 7.5V11H6.5C5.67 11 5 11.67 5 12.5S5.67 14 6.5 14H10V17.5C10 18.33 10.67 19 11.5 19S13 18.33 13 17.5V14H16.5C17.33 14 18 13.33 18 12.5S17.33 11 16.5 11Z"/>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
      <path stroke={color} strokeWidth="2" d="M8 16L16 8"/>
    </svg>
  ),
  MuscleBuilding: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z"/>
    </svg>
  ),
  Strength: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M2,12V10H4V7H6V10H18V7H20V10H22V12H20V15H18V12H6V15H4V12H2M11,9A1,1 0 0,1 12,8A1,1 0 0,1 13,9A1,1 0 0,1 12,10A1,1 0 0,1 11,9M11,15A1,1 0 0,1 12,14A1,1 0 0,1 13,15A1,1 0 0,1 12,16A1,1 0 0,1 11,15Z"/>
    </svg>
  ),
  GeneralFitness: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,8.5A3.5,3.5 0 0,0 8.5,12A3.5,3.5 0 0,0 12,15.5A3.5,3.5 0 0,0 15.5,12A3.5,3.5 0 0,0 12,8.5M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10Z"/>
    </svg>
  )
};

export const MiscIcons = {
  Returning: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6 0 1.01-.25 1.96-.69 2.8l1.46 1.46A7.963 7.963 0 0020 13c0-4.42-3.58-8-8-8zm-6.77.23L3.77 6.69C2.66 8.03 2 9.73 2 11.5 2 15.64 5.36 19 9.5 19c1.77 0 3.47-.66 4.81-1.77l-1.46-1.46A5.985 5.985 0 019.5 17C6.46 17 4 14.54 4 11.5c0-1.62.65-3.09 1.7-4.17z"/>
    </svg>
  ),
  MentalHealth: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  Mobility: ({ size = 24, color = defaultColor, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M7 6a5 5 0 0110 0v5a5 5 0 11-10 0V6zm-2 5a7 7 0 0014 0V6a7 7 0 10-14 0v5z"/>
    </svg>
  )
};

