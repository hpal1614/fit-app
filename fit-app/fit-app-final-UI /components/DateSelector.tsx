import React, { useRef, useEffect, createRef } from 'react';
import { WorkoutDay, WorkoutStatus } from '../types';
import { CrosshairIcon } from './Icons';

interface DateSelectorProps {
  week: WorkoutDay[];
  selectedDayIndex: number;
  onDaySelect: (index: number) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ week, selectedDayIndex, onDaySelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<React.RefObject<HTMLDivElement>[]>(week.map(() => createRef<HTMLDivElement>()));
  
  const getTodayIndex = () => {
    const today = new Date().getDate();
    const todayIndex = week.findIndex(d => d.date === today);
    return todayIndex > -1 ? todayIndex : Math.floor(week.length / 2);
  };
  const todayIndex = getTodayIndex();

  useEffect(() => {
    // We use a timeout to ensure the scroll happens after the initial render and layout.
    setTimeout(() => {
        scrollToDay(selectedDayIndex, 'auto');
    }, 100);
  }, []);

  const scrollToDay = (index: number, behavior: ScrollBehavior = 'smooth') => {
    dayRefs.current[index]?.current?.scrollIntoView({
      behavior,
      inline: 'center',
      block: 'nearest'
    });
  };

  const handleDaySelect = (index: number) => {
    onDaySelect(index);
    scrollToDay(index);
  };
  
  const handleGoToToday = () => {
      const todayIdx = getTodayIndex();
      onDaySelect(todayIdx);
      scrollToDay(todayIdx);
  };

  const getStatusClasses = (status: WorkoutStatus, isSelected: boolean, isToday: boolean) => {
    let classes = 'p-2 rounded-lg flex flex-col items-center justify-center transition-all duration-300 cursor-pointer font-semibold border-2 flex-shrink-0 w-16 h-20 ';
    
    let baseStyle = 'border-transparent';
    let selectedStyle = 'scale-105 shadow-lg';

    if (isToday && status === WorkoutStatus.Upcoming && !isSelected) {
        classes += ' ring-2 ring-offset-2 ring-offset-[var(--color-background-start)] ring-lime-400';
    }

    switch (status) {
      case WorkoutStatus.Completed:
        baseStyle += ' bg-lime-500/10 text-lime-300 hover:bg-lime-500/20';
        selectedStyle += ' bg-lime-500 text-black';
        break;
      case WorkoutStatus.Missed:
        baseStyle += ' bg-red-500/10 text-red-300 hover:bg-red-500/20';
        selectedStyle += ' bg-red-500 text-white';
        break;
      case WorkoutStatus.Upcoming:
      default:
        baseStyle += ' bg-white/5 text-gray-300 hover:bg-white/10';
        selectedStyle += ' bg-gray-200 text-black';
        break;
    }

    classes += isSelected ? selectedStyle : baseStyle;
    return classes;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-semibold text-gray-100">Your Week</h3>
          <button onClick={handleGoToToday} className="flex items-center space-x-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg">
              <CrosshairIcon className="w-4 h-4" />
              <span>Today</span>
          </button>
      </div>
      <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-3 py-2 -mx-2 px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {week.map((day, index) => (
            <div ref={dayRefs.current[index]} key={day.date} onClick={() => handleDaySelect(index)} className={getStatusClasses(day.status, selectedDayIndex === index, todayIndex === index)}>
              <span className="text-xs">{day.day}</span>
              <span className="text-xl font-bold mt-1">{day.date}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DateSelector;