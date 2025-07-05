export interface Manager {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  position: string;
  role?: string;
  permissions: Record<string, Record<string, boolean>>;
  roledId: string | null;
  status: "blocked" | "active";
  password?: string;
  uid?: string;
  createdAt?: Date;
  profileImg: string;
  teamId: string | null;
  base_salary: number;
  netSalary: number;
  birthDate?: Date;
}

export interface ManagerState {
  managers: Manager[];
  paginatedManagers: Manager[];
  currentPage: number;
  managersPerPage: number;
  recentManagers: Manager[];
  searchManagersByEmail: string;
}
