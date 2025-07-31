import React from 'react';

export interface NimbusCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const NimbusCard: React.FC<NimbusCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  interactive = false,
}) => {
  const baseStyles = `
    rounded-2xl transition-all duration-200
    ${interactive || onClick ? 'cursor-pointer' : ''}
  `;
  
  const variantStyles = {
    default: `
      bg-white dark:bg-neutral-900
      ${interactive || onClick ? 'hover:bg-gray-50 dark:hover:bg-neutral-800' : ''}
    `,
    bordered: `
      bg-white dark:bg-neutral-900
      border border-neutral-200 dark:border-neutral-800
      ${interactive || onClick ? 'hover:border-neutral-300 dark:hover:border-neutral-700' : ''}
    `,
    elevated: `
      bg-white dark:bg-neutral-900
      shadow-lg hover:shadow-xl
    `,
    glass: `
      bg-white/80 dark:bg-neutral-900/80
      backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50
      ${interactive || onClick ? 'hover:bg-white/90 dark:hover:bg-neutral-900/90' : ''}
    `,
  };
  
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};