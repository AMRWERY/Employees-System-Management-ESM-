export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasAttendance: boolean;
  totalSeconds: number;
}
