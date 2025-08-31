import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        bg-gray-800/30 backdrop-blur-2xl border border-white/5 rounded-2xl 
        shadow-2xl shadow-black/40 w-full overflow-hidden
        ${className}
      `}
    >
      <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none"></div>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{title: string; children?: React.ReactNode;}> = ({ title, children }) => (
    <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        {children}
    </div>
);

export const CardContent: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

export default Card;