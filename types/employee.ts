import type { Payroll, PayrollSummary } from "@/types/payroll";

export interface FirestoreTimestamp {
  toDate(): Date;
}

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
  createdAt?: Date;
  birthDate?: Date;
  profileImg?: string | null;
  payrolls?: PayrollSummary[];
  base_salary: number;
  netSalary: number;
  [key: string]: any;
}

export interface EmployeeWithPayrolls extends Omit<Employee, 'payrolls'> {
  payrolls: Payroll[];
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
  selectedEmployeeDetails: EmployeeWithPayrolls | null
  // selectedEmployeeDetails: Employee | null;
}
