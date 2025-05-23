export interface Employee {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  departmentId?: string;
  position: string;
  role?: string;
  permissions: Record<string, Record<string, boolean>>;
  roledId: string | null;
  // isBlocked?: boolean;
  status: 'blocked' | 'active';
  [key: string]: any;
}

export interface EmployeeState {
  employees: Employee[];
  paginatedEmployees: Employee[];
  currentPage: number;
  employeesPerPage: number;
  recentEmployees: Employee[];
  searchEmployeesByEmail: string;
}
