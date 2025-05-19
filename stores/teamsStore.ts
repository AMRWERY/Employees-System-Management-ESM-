import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import type { Teams, TeamState } from "@/types/teams";

const generateIdFromName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, "") // Remove special characters
    .substring(0, 20); // Limit length
};

export const useTeamStore = defineStore("teams", {
  state: () => ({
    teams: [] as Teams[],
    paginatedTeams: [] as Teams[],
    currentPage: 1,
    teamsPerPage: 8,
    currentTeam: null as any,
    members: [] as any[],
    loading: false,
    error: "",
    searchTeamsByName: "",
  }),

  actions: {
    fetchAll() {
      this.loading = true;
      onSnapshot(
        collection(db, "ems-teams"),
        (snap) => {
          this.teams = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              description: data.description,
              departmentId: data.departmentId,
              leadId: data.leadId,
              memberIds: data.memberIds,
              createdAt: data.createdAt?.toDate(),
            } as Teams;
          });
          this.updatePagination();
          this.loading = false;
        },
        (err) => {
          this.error = err.message;
          this.loading = false;
        }
      );
    },

    async fetchOne(teamId: string) {
      this.loading = true;
      const teamRef = doc(db, "ems-teams", teamId);
      const teamSnap = await getDoc(teamRef);
      this.currentTeam = { id: teamSnap.id, ...teamSnap.data() };
      const q = query(
        collection(db, "ems-users"),
        where("teamId", "==", teamId)
      );
      onSnapshot(
        q,
        (snap) => {
          this.members = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          this.loading = false;
        },
        (err) => {
          this.error = err.message;
          this.loading = false;
        }
      );
    },

    async createTeam(teamData: { name: string; description?: string }) {
      try {
        const baseId = generateIdFromName(teamData.name);
        const newTeam = {
          name: teamData.name,
          description: teamData.description || "",
          departmentId: `dept-${baseId}`,
          leadId: `lead-${baseId}`,
          memberIds: [],
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "ems-teams"), newTeam);
        return docRef.id;
      } catch (error) {
        console.error("Error creating team:", error);
        throw error;
      }
    },

    async updateTeam(teamId: string, updates: any) {
      const teamRef = doc(db, "ems-teams", teamId);
      await updateDoc(teamRef, updates);
      // If you also update users’ teamId fields, do so here or via Cloud Function
    },

    async addMember(teamId: string, userId: string) {
      const teamRef = doc(db, "ems-teams", teamId);
      await updateDoc(teamRef, {
        memberIds: [...this.currentTeam.memberIds, userId],
      });
      // optional: update user doc
      await updateDoc(doc(db, "ems-users", userId), { teamId });
    },

    async removeMember(teamId: string, userId: string) {
      const teamRef = doc(db, "ems-teams", teamId);
      const updated = this.currentTeam.memberIds.filter(
        (id: string) => id !== userId
      );
      await updateDoc(teamRef, { memberIds: updated });
      await updateDoc(doc(db, "ems-users", userId), { teamId: null });
    },

    setSearchTerm(term: string): void {
      this.searchTeamsByName = term.toLowerCase();
      this.currentPage = 1;
      this.updatePagination();
    },

    updatePagination(): void {
      const start = (this.currentPage - 1) * this.teamsPerPage;
      const end = this.currentPage * this.teamsPerPage;
      const filtered = this.filteredTeams;
      this.paginatedTeams = filtered.slice(start, end);
      const maxPage = Math.max(
        1,
        Math.ceil(filtered.length / this.teamsPerPage)
      );
      if (this.currentPage > maxPage) {
        this.currentPage = maxPage;
        this.paginatedTeams = filtered.slice(
          (maxPage - 1) * this.teamsPerPage,
          maxPage * this.teamsPerPage
        );
      }
    },
  },

  getters: {
    byDepartment: (state) => (deptId: string) =>
      state.teams.filter((t) => t.departmentId === deptId),

    totalPages(): number {
      return Math.ceil(this.filteredTeams.length / this.teamsPerPage);
    },

    filteredTeams: (state: TeamState): Teams[] => {
      if (!state.searchTeamsByName) return state.teams;
      return state.teams.filter((team) => {
        const name = team.name?.toLowerCase() || "";
        return name.includes(state.searchTeamsByName);
      });
    },
  },
});
