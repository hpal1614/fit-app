import React from 'react';
import { NimbusTheme } from '../theme';

export interface NimbusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const NimbusButton: React.FC<NimbusButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;
  
  const variantStyles = {
    primary: `
      bg-primary-500 text-white
      hover:bg-primary-600 active:bg-primary-700
      focus:ring-primary-500
    `,
    secondary: `
      bg-secondary-500 text-white
      hover:bg-secondary-600 active:bg-secondary-700
      focus:ring-secondary-500
    `,
    ghost: `
      bg-transparent text-neutral-700 dark:text-neutral-300
      hover:bg-neutral-100 dark:hover:bg-neutral-800
      active:bg-neutral-200 dark:active:bg-neutral-700
      focus:ring-neutral-500
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-600 active:bg-red-700
      focus:ring-red-500
    `,
    success: `
      bg-green-500 text-white
      hover:bg-green-600 active:bg-green-700
      focus:ring-green-500
    `,
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-4 py-2 text-base rounded-lg gap-2',
    lg: 'px-6 py-3 text-lg rounded-xl gap-2.5',
    xl: 'px-8 py-4 text-xl rounded-2xl gap-3',
  };
  
  const loadingSpinner = (
    <svg
      className={`animate-spin ${
        size === 'sm' ? 'h-3 w-3' : 
        size === 'md' ? 'h-4 w-4' : 
        size === 'lg' ? 'h-5 w-5' : 
        'h-6 w-6'
      }`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
  
  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && iconPosition === 'left' && loadingSpinner}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
      {loading && iconPosition === 'right' && loadingSpinner}
    </button>
  );
};