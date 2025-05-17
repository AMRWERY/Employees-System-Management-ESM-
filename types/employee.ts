export interface Employee {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  role?: string;
  permissions: Record<string, Record<string, boolean>>;
  roledId: string | null;
  isBlocked?: boolean;
  [key: string]: any; // For other possible fields
}

export interface EmployeeState {
  employees: Employee[];
  paginatedEmployees: Employee[];
  currentPage: number;
  employeesPerPage: number;
  recentEmployees: Employee[];
  searchEmployeesByEmail: string;
}
