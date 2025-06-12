import { Timestamp } from "firebase/firestore";

export type AppTimestamp = Timestamp;

export enum PayrollAllStatus {
  Pending = "pending",
  Paid = "paid",
  Failed = "failed",
}

export interface Payroll {
  id?: string; // Firestore document ID (optional, will be set after fetch/add)
  uid: string;
  employeeName: string;
  department_id: string;
  pay_period: string; // YYYY-MM
  base_salary: number;
  working_days: number;
  days_present: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
  tax_percent: number;
  netSalary: number; // Calculated
  status: PayrollAllStatus;
  paidOn: AppTimestamp | null;
  paidBy?: string;
  created_by: string;
  created_at: AppTimestamp;
  updated_at?: AppTimestamp;
  notes?: string;
  failureReason?: string;
}

export interface PayrollInputData {
  // Fields a user would input when creating/editing
  // Omitting id, netSalary, status, paidOn, created_at, updated_at
  // as these are typically set by the system/store logic
  uid: string;
  employeeName: string;
  department_id: string;
  pay_period: string;
  base_salary: number;
  working_days: number;
  days_present: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
  tax_percent: number;
  created_by: string; // Typically current admin user's ID
  notes?: string;
}

export interface FetchPayrollParams {
  payPeriod?: string; // YYYY-MM
  // No searchTerm here, store fetches based on payPeriod, parent filters by searchTerm
  // No pagination params here, store fetches all matching payPeriod, parent paginates
}

export interface PayrollState {
  allPayrolls: Payroll[]; // Holds all payrolls matching the broad filter (e.g., payPeriod)
  paginatedItems: Payroll[]; // Payrolls for the current page after search & pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number; // Total items matching search and filters
  searchTerm: string;
  filterPayPeriod: string; // Store the current pay period filter
  isLoading: boolean;
  error: string | null;
}

export interface PayrollSummary {
  payrollDocId: string; // The ID of the document in 'ems-payrolls'
  pay_period: string;
  netSalary: number;
  status: PayrollAllStatus;
  created_at: AppTimestamp; // Or Date if you convert it before embedding
  failureReason?: string | null;
}