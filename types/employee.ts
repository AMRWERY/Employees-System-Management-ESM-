import type { Payroll, PayrollSummary } from "@/types/payroll";

export interface Employee {
  id: string;
  uid?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  departmentId?: string;
  position: string;
  role?: string;
  permissions: Record<string, Record<string, boolean>>;
  roledId: string | null;
  managerId: string | null;
  teamId: string | null;
  // isBlocked?: boolean;
  status: "blocked" | "active";
  payrolls?: PayrollSummary[];
  // payrolls?: (PayrollSummary | Payroll)[];
  [key: string]: any;
}

export interface EmployeeState {
  employees: Employee[];
  paginatedEmployees: Employee[];
  currentPage: number;
  employeesPerPage: number;
  recentEmployees: Employee[];
  searchEmployeesByEmail: string;
  managerId: string | null;
  teamId: string | null;
  selectedEmployeeDetails: Employee | null;
}
