import { useState, useEffect, useCallback } from 'react';
import { calendarService, CalendarDay, WeekSchedule } from '../services/calendarService';
import { WorkoutTemplate } from '../types/workout';

export function useCalendar() {
  const [currentSchedule, setCurrentSchedule] = useState<WeekSchedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const buildLocalWeek = (anchor?: Date): WeekSchedule => {
    const base = anchor ? new Date(anchor) : new Date();
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(base.setDate(diff));
    weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

    const days: CalendarDay[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        id: `day-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        workout: null,
        status: 'upcoming',
        isToday: sameDay(d, new Date())
      } as CalendarDay;
    });

    return { weekStart, weekEnd, days, currentTemplate: null } as WeekSchedule;
  };

  const sameDay = (a: Date, b: Date) => a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear();

  // Initialize calendar with no template
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const schedule = await calendarService.generateWeekSchedule(null);
        if (!mounted) return;
        setCurrentSchedule(schedule);
        const today = schedule.days.find(day => day.isToday) || schedule.days[0];
        setSelectedDay(today);
      } catch (e) {
        // Fallback to local-only week so UI always renders
        if (!mounted) return;
        const schedule = buildLocalWeek();
        setCurrentSchedule(schedule);
        const today = schedule.days.find(day => day.isToday) || schedule.days[0];
        setSelectedDay(today);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Select a specific day
  const selectDay = useCallback((day: CalendarDay) => {
    setSelectedDay(day);
    calendarService.selectDay(day.date);
  }, []);

  // Change the template for the entire week
  const changeWeekTemplate = useCallback(async (template: WorkoutTemplate | null) => {
    setIsLoading(true);
    try {
      const newSchedule = await calendarService.changeWeekTemplate(template);
      if (newSchedule) {
        setCurrentSchedule({ ...newSchedule });
        if (selectedDay) {
          const updatedDay = newSchedule.days.find(d => sameDay(d.date, selectedDay.date));
          if (updatedDay) setSelectedDay(updatedDay);
        }
      } else {
        const schedule = buildLocalWeek();
        setCurrentSchedule(schedule);
        setSelectedDay(schedule.days[0]);
      }
    } catch {
      const schedule = buildLocalWeek();
      setCurrentSchedule(schedule);
      setSelectedDay(schedule.days[0]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDay]);

  // Update workout status for a specific day
  const updateWorkoutStatus = useCallback((date: Date, status: CalendarDay['status']) => {
    calendarService.updateWorkoutStatus(date, status);
    if (currentSchedule) {
      const updated = { ...currentSchedule, days: currentSchedule.days.map(d => ({ ...d })) };
      const day = updated.days.find(d => sameDay(d.date, date));
      if (day) {
        day.status = status;
        setCurrentSchedule(updated);
        if (selectedDay && sameDay(selectedDay.date, date)) setSelectedDay({ ...day });
      }
    }
  }, [currentSchedule, selectedDay]);

  // Navigation helpers use service with fallback
  const nextWeek = useCallback(async () => {
    try {
      const newSchedule = await calendarService.nextWeek();
      if (newSchedule) {
        setCurrentSchedule({ ...newSchedule });
        setSelectedDay(newSchedule.days[0]);
        return;
      }
    } catch {}
    const schedule = buildLocalWeek(new Date((currentSchedule?.weekEnd || new Date()).getTime() + 24*60*60*1000));
    setCurrentSchedule(schedule);
    setSelectedDay(schedule.days[0]);
  }, [currentSchedule]);

  const previousWeek = useCallback(async () => {
    try {
      const newSchedule = await calendarService.previousWeek();
      if (newSchedule) {
        setCurrentSchedule({ ...newSchedule });
        setSelectedDay(newSchedule.days[0]);
        return;
      }
    } catch {}
    const schedule = buildLocalWeek(new Date((currentSchedule?.weekStart || new Date()).getTime() - 7*24*60*60*1000));
    setCurrentSchedule(schedule);
    setSelectedDay(schedule.days[0]);
  }, [currentSchedule]);

  const goToToday = useCallback(async () => {
    try {
      const newSchedule = await calendarService.goToToday();
      if (newSchedule) {
        setCurrentSchedule({ ...newSchedule });
        const today = newSchedule.days.find(day => day.isToday) || newSchedule.days[0];
        setSelectedDay(today);
        return;
      }
    } catch {}
    const schedule = buildLocalWeek();
    setCurrentSchedule(schedule);
    setSelectedDay(schedule.days[0]);
  }, []);

  const getTodayWorkout = useCallback(() => {
    if (!currentSchedule) return null;
    return currentSchedule.days.find(day => day.isToday)?.workout || null;
  }, [currentSchedule]);

  const hasTodayWorkout = useCallback(() => {
    const todayWorkout = getTodayWorkout();
    return todayWorkout !== null;
  }, [getTodayWorkout]);

  const getDayWorkout = useCallback((date: Date) => {
    if (!currentSchedule) return null;
    return currentSchedule.days.find(day => sameDay(day.date, date))?.workout || null;
  }, [currentSchedule]);

  return {
    currentSchedule,
    selectedDay,
    isLoading,
    selectDay,
    changeWeekTemplate,
    updateWorkoutStatus,
    nextWeek,
    previousWeek,
    goToToday,
    getTodayWorkout,
    hasTodayWorkout,
    getDayWorkout,
    currentTemplate: currentSchedule?.currentTemplate || null
  };
}
