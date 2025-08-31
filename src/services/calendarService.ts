import { WorkoutTemplate } from '../types/workout';
import { getWorkoutService } from './workoutService';
import Dexie from 'dexie';

export interface CalendarDay {
  id: string;
  date: Date;
  dayName: string;
  dayNumber: number;
  workout: WorkoutTemplate | null;
  status: 'completed' | 'missed' | 'upcoming' | 'in-progress';
  isToday: boolean;
}

export interface WeekSchedule {
  weekStart: Date;
  weekEnd: Date;
  days: CalendarDay[];
  currentTemplate: WorkoutTemplate | null;
}

export class CalendarService {
  private currentSchedule: WeekSchedule | null = null;

  /**
   * Generate a week schedule based on the selected template and real workout history
   */
  async generateWeekSchedule(template: WorkoutTemplate | null, selectedDate?: Date): Promise<WeekSchedule> {
    const startDate = selectedDate || new Date();
    const weekStart = this.getWeekStart(startDate);
    const weekEnd = this.getWeekEnd(startDate);

    let ws = getWorkoutService();
    let history: any[] = [];
    try {
      history = (await ws.getWorkoutHistory(200)).filter(w => w.date >= weekStart && w.date <= weekEnd);
    } catch (e) {
      // Hard-recover Dexie schema issues (object store not found / closed DB)
      try { await Dexie.delete('FitnessCoachDB'); } catch {}
      ws = getWorkoutService();
      try {
        history = (await ws.getWorkoutHistory(200)).filter(w => w.date >= weekStart && w.date <= weekEnd);
      } catch {
        history = [];
      }
    }

    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const isToday = this.isSameDay(currentDate, new Date());
      const dayName = this.getDayName(currentDate);
      const dayNumber = currentDate.getDate();
      const workout = template ? template : null;
      const status = await this.resolveStatusForDay(currentDate, workout, history);
      days.push({
        id: `day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${dayNumber}`,
        date: currentDate,
        dayName,
        dayNumber,
        workout,
        status,
        isToday
      });
    }

    this.currentSchedule = { weekStart, weekEnd, days, currentTemplate: template };
    return this.currentSchedule;
  }

  /**
   * Recompute statuses for the existing schedule
   */
  private async recomputeStatuses(): Promise<void> {
    if (!this.currentSchedule) return;
    const { weekStart, weekEnd, currentTemplate } = this.currentSchedule;
    let ws = getWorkoutService();
    let history: any[] = [];
    try {
      history = (await ws.getWorkoutHistory(200)).filter(w => w.date >= weekStart && w.date <= weekEnd);
    } catch {
      try { await Dexie.delete('FitnessCoachDB'); } catch {}
      ws = getWorkoutService();
      try { history = (await ws.getWorkoutHistory(200)).filter(w => w.date >= weekStart && w.date <= weekEnd); } catch { history = []; }
    }
    this.currentSchedule.days = await Promise.all(
      this.currentSchedule.days.map(async d => ({
        ...d,
        workout: currentTemplate ? currentTemplate : d.workout,
        status: await this.resolveStatusForDay(d.date, currentTemplate || d.workout, history)
      }))
    );
  }

  /**
   * Select a specific day
   */
  selectDay(date: Date): void {
    // selection is handled in the component via selectedDay comparison
    return;
  }

  /**
   * Update workout status for a specific day
   */
  updateWorkoutStatus(date: Date, status: CalendarDay['status']): void {
    if (!this.currentSchedule) return;
    const day = this.currentSchedule.days.find(d => this.isSameDay(d.date, date));
    if (day) day.status = status;
  }

  /**
   * Change the template for the entire week and recompute statuses
   */
  async changeWeekTemplate(template: WorkoutTemplate | null): Promise<WeekSchedule> {
    if (!this.currentSchedule) {
      return await this.generateWeekSchedule(template);
    }
    this.currentSchedule.currentTemplate = template;
    this.currentSchedule.days.forEach(day => { day.workout = template; });
    await this.recomputeStatuses();
    return this.currentSchedule;
  }

  /** Helpers */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0,0,0,0);
    return start;
  }

  private getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);
    return weekEnd;
  }

  private isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  private async resolveStatusForDay(date: Date, workout: WorkoutTemplate | null, history: any[]): Promise<CalendarDay['status']> {
    const isPast = date < new Date(new Date().setHours(0,0,0,0));
    const completed = history.some(w => this.isSameDay(w.date, date) && (w.endTime || w.duration));
    if (completed) return 'completed';
    if (isPast && workout) return 'missed';
    return 'upcoming';
  }

  /** Navigation */
  async nextWeek(): Promise<WeekSchedule | null> {
    if (!this.currentSchedule) return null;
    const nextWeekStart = new Date(this.currentSchedule.weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return await this.generateWeekSchedule(this.currentSchedule.currentTemplate, nextWeekStart);
  }

  async previousWeek(): Promise<WeekSchedule | null> {
    if (!this.currentSchedule) return null;
    const prevWeekStart = new Date(this.currentSchedule.weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    return await this.generateWeekSchedule(this.currentSchedule.currentTemplate, prevWeekStart);
  }

  async goToToday(): Promise<WeekSchedule | null> {
    if (!this.currentSchedule) return null;
    return await this.generateWeekSchedule(this.currentSchedule.currentTemplate, new Date());
  }
}

export const calendarService = new CalendarService();
