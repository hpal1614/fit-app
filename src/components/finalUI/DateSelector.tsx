import React, { useRef, useEffect, createRef } from 'react';
import type { CalendarDay } from '../../services/calendarService';
import { ChevronLeftIcon, ChevronRightIcon, CrosshairIcon } from './Icons';

interface DateSelectorProps {
  days: CalendarDay[];
  selectedDay: CalendarDay | null;
  onDaySelect: (day: CalendarDay) => void;
  onNextWeek: () => void;
  onPreviousWeek: () => void;
  onGoToToday: () => void;
  isLoading?: boolean;
}

const DateSelector: React.FC<DateSelectorProps> = ({ 
  days, 
  selectedDay, 
  onDaySelect, 
  onNextWeek, 
  onPreviousWeek, 
  onGoToToday,
  isLoading = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<React.RefObject<HTMLDivElement>[]>(days.map(() => createRef<HTMLDivElement>()));
  
  const today = days.find(d => d.isToday);
  const selectedDayIndex = days.findIndex(d => d.id === selectedDay?.id);
  const isOnToday = selectedDay?.id === today?.id;

  useEffect(() => {
    setTimeout(() => {
        if (selectedDayIndex > -1) {
            scrollToDay(selectedDayIndex, 'auto');
        }
    }, 100);
  }, [selectedDayIndex]);

  const scrollToDay = (index: number, behavior: ScrollBehavior = 'smooth') => {
    dayRefs.current[index]?.current?.scrollIntoView({
      behavior,
      inline: 'center',
      block: 'nearest'
    });
  };

  const handleDaySelect = (day: CalendarDay) => {
    onDaySelect(day);
    const index = days.findIndex(d => d.id === day.id);
    if (index > -1) {
      scrollToDay(index);
    }
  };

  // Exact class mapping per spec + interaction polish
  const getStatusClasses = (day: CalendarDay) => {
    const isSelected = selectedDay?.id === day.id;
    let classes = 'p-2 rounded-lg flex flex-col items-center justify-center transition-all duration-300 ease-out transform-gpu cursor-pointer font-semibold border-2 flex-shrink-0 w-16 h-20 focus:outline-none focus:ring-0 ';
    
    let baseStyle = 'border-transparent hover:scale-105 hover:shadow-md active:scale-95 active:shadow-sm';
    let selectedStyle = 'scale-105 shadow-lg hover:shadow-xl active:scale-95';

    // Remove CTA ring/outline entirely per request
    // (no ring around current date regardless of status)

    switch (day.status) {
      case 'completed':
        baseStyle += ' bg-lime-500/10 text-lime-300 hover:bg-lime-500/20';
        selectedStyle += ' bg-lime-500 text-black border-2 border-[#e4e6eb]';
        break;
      case 'missed':
        baseStyle += ' bg-red-500/10 text-red-300 hover:bg-red-500/20';
        selectedStyle += ' bg-red-500 text-white';
        break;
      case 'in-progress':
        baseStyle += ' bg-white/5 text-gray-300 hover:bg-white/10';
        selectedStyle += ' bg-gray-200 text-black';
        break;
      case 'upcoming':
      default:
        if (day.isToday && day.workout && !isSelected) {
          baseStyle += ' bg-lime-500/10 text-lime-300 hover:bg-lime-500/20';
        } else {
          baseStyle += ' bg-white/5 text-gray-300 hover:bg-white/10';
        }
        selectedStyle += ' bg-gray-200 text-black';
        break;
    }

    // If selected tile is the current day, add green hover/active feedback
    if (isSelected && day.isToday) {
      selectedStyle += ' hover:bg-lime-500 active:bg-lime-600';
    }

    classes += isSelected ? selectedStyle : baseStyle;
    return classes;
  };

  const getDotClass = (_day: CalendarDay) => {
    return 'hidden';
  };

  const formatWeekRange = () => {
    if (days.length === 0) return '';
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return `${formatDate(firstDay.date)} - ${formatDate(lastDay.date)}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-2">
          <div className="flex items-center space-x-4">
              <h3 className="text-xl font-semibold text-gray-100">Your Week</h3>
              <span className="text-sm text-gray-400">{formatWeekRange()}</span>
          </div>
          
          <div className="flex items-center space-x-2">
              <button 
                onClick={onPreviousWeek}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                  <ChevronLeftIcon className="w-4 h-4" />
              </button>
              
              <button 
                onClick={onNextWeek}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                  <ChevronRightIcon className="w-4 h-4" />
              </button>
              
              <button 
                onClick={onGoToToday} 
                disabled={isLoading}
                className={`flex items-center space-x-2 text-sm font-semibold text-gray-900 bg-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-all duration-200 hover:bg-[#334a18] hover:text-[#bdf164] hover:font-bold active:bg-[#a4e635] active:text-black active:font-bold ${isOnToday ? 'bg-[#a4e635] text-black font-bold' : ''}`}
              >
                  <CrosshairIcon className="w-4 h-4" />
                  <span>Today</span>
              </button>
          </div>
      </div>
      
      <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-3 py-2 -mx-2 px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {days.map((day, index) => (
            <div 
              ref={dayRefs.current[index]} 
              key={`${day.date.getTime()}-${day.dayName}`} 
              onClick={() => handleDaySelect(day)} 
              className={getStatusClasses(day)}
            >
              <span className="text-xs">{day.dayName}</span>
              <span className="text-xl font-bold mt-1">{day.dayNumber}</span>
              {/* status dot removed per request */}
            </div>
          ))}
      </div>
    </div>
  );
};

export default DateSelector;
