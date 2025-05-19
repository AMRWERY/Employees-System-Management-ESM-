export interface Teams {
  id: string;
  departmentId: string;
  name: string;
  leadId: string;
  memberIds: string[];
  description: string;
  createdAt: Date;
}

export interface TeamState {
  teams: Teams[];
  paginatedTeams: Teams[];
  currentPage: number;
  teamsPerPage: number;
  currentTeam: any | null;
  members: any[];
  loading: boolean;
  error: string;
  searchTeamsByName: string;
}
