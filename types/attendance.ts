import { Timestamp } from "firebase/firestore";

export interface DailyAttendance {
  id: string;
  date: string;
  clockIns: Timestamp[];
  clockOuts: Timestamp[];
  totalSeconds: number;
  uid: string;
  role: string;
}

export interface WeekRecord {
  id: string;
  date: string;
  clockIns: Timestamp[];
  clockOuts: Timestamp[];
  totalSeconds: number;
  uid: string;
  role: string;
}

export interface WeekSummaryRecord {
  date: string;
  day: string;
  totalSeconds: number;
}

export interface MonthlyRecord {
  date: string;
  totalSeconds: number;
}

export interface AttendanceState {
  todayRecord: DailyAttendance | null;
  weeklySummary: WeekSummaryRecord[];
  monthlySummary: MonthlyRecord[];
  loading: boolean;
  error: string | null;
}
