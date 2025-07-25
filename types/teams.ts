export interface Teams {
  id: string;
  departmentId: string;
  name: string;
  leadId: string;
  memberIds: string[];
  description: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  teamId: string;
  managerId: string;
  departmentId: string;
  isBlocked: boolean;
  createdAt?: Date;
  role: string;
  profileImg: string;
  base_salary: number;
  netSalary: number;
  birthDate: string;
  status?: "blocked" | "active";
}

export interface TeamState {
  teams: Teams[];
  paginatedTeams: Teams[];
  currentPage: number;
  teamsPerPage: number;
  currentTeam: any | null;
  members: Member[];
  loading: boolean;
  error: string;
  searchTeamsByName: string;
  searchMembersByTerm: string;
}

export interface TeamMember {
  teamId?: string | null;
  [key: string]: any;
}
