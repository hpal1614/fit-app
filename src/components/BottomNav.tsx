import React from 'react';

type TabKey = 'dashboard' | 'workouts' | 'nutrition' | 'ai';

interface BottomNavProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

const iconClasses = 'w-5 h-5';

const HomeIcon = ({ className = iconClasses }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 11l9-8 9 8" /><path d="M9 22V12h6v10" />
  </svg>
);

const DumbbellIcon = ({ className = iconClasses }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6.5 6.5l11 11" /><path d="M4 7l3-3" /><path d="M17 20l3-3" /><path d="M2 12h4" /><path d="M18 12h4" />
  </svg>
);

const AppleIcon = ({ className = iconClasses }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.365 1.43a4.6 4.6 0 0 1-1.03 3.34 4.23 4.23 0 0 1-3.18 1.53 4.74 4.74 0 0 1 1.02-3.38 4.9 4.9 0 0 1 3.19-1.49h-.01z" />
    <path d="M19.68 13.13c-.06-3.24 2.64-4.79 2.76-4.87-1.51-2.2-3.86-2.5-4.7-2.53-2.01-.2-3.93 1.15-4.96 1.15-1.04 0-2.55-1.13-4.2-1.1-2.16.03-4.17 1.26-5.27 3.2-2.25 3.9-.58 9.68 1.61 12.85 1.07 1.54 2.35 3.26 4.02 3.2 1.61-.07 2.22-1.03 4.17-1.03 1.95 0 2.49 1.03 4.2.99 1.74-.03 2.84-1.57 3.9-3.12 1.23-1.81 1.74-3.56 1.77-3.65-.04-.02-3.39-1.29-3.4-5.09z" />
  </svg>
);

const SparklesIcon = ({ className = iconClasses }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.94 15.5A2 2 0 0 0 8.5 14.06L2.36 12.48a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z" />
    <path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v4" /><path d="M2 19h4" />
  </svg>
);

const BottomNav: React.FC<BottomNavProps> = ({ active, onChange }) => {
  const Item: React.FC<{ k: TabKey; label: string; icon: React.ReactNode }> = ({ k, label, icon }) => {
    const isActive = active === k;
    return (
      <button
        onClick={() => onChange(k)}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
          isActive ? 'text-accent bg-white/10' : 'text-gray-300 hover:text-white'
        }`}
        aria-label={label}
      >
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </button>
    );
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="w-full bg-gray-800/60 backdrop-blur-xl border-t border-white/10 rounded-t-2xl shadow-2xl">
        <div className="flex items-center px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0)+8px)]">
          <Item k="dashboard" label="Dashboard" icon={<HomeIcon />} />
          <Item k="workouts" label="Workouts" icon={<DumbbellIcon />} />
          <Item k="nutrition" label="Nutrition" icon={<AppleIcon />} />
          <Item k="ai" label="AI Coach" icon={<SparklesIcon />} />
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
export type { TabKey };

