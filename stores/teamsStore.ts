import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { Teams, TeamState, Member } from "@/types/teams";

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
    paginatedMembers: [] as Member[],
    currentMemberPage: 1,
    membersPerPage: 8,
    searchTeamsByName: "",
    searchMembersByTerm: "",
    loading: false,
    error: "",
    unsubscribeListeners: [] as (() => void)[],
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
          // console.log(this.teams)
          this.updateTeamPagination();
          this.loading = false;
        },
        (err) => {
          this.error = err.message;
          this.loading = false;
        }
      );
    },

    async fetchUsersByDepartment(departmentId: string) {
      this.loading = true;
      try {
        if (departmentId.startsWith("dept-")) {
          const teamsQuery = query(
            collection(db, "ems-teams"),
            where("departmentId", "==", departmentId)
          );
          const teamsSnapshot = await getDocs(teamsQuery);
          if (teamsSnapshot.empty) {
            this.members = [];
            this.loading = false;
            return;
          }
          let allMemberIds: string[] = [];
          teamsSnapshot.forEach((teamDoc) => {
            const teamData = teamDoc.data();
            const memberIds = teamData.memberIds || [];
            allMemberIds = [...allMemberIds, ...memberIds];
          });
          // Remove duplicates (in case an employee is in multiple teams)
          allMemberIds = [...new Set(allMemberIds)];
          if (allMemberIds.length === 0) {
            this.members = [];
            this.loading = false;
            return;
          }
          // Fetch all users who are members of teams in this department
          const memberPromises = allMemberIds.map((id: string) => {
            return getDoc(doc(db, "ems-users", id));
          });
          const memberDocs = await Promise.all(memberPromises);
          const existingDocs = memberDocs.filter((doc) => doc.exists());
          this.members = existingDocs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              position: data.position,
              employeeId: data.employeeId,
              departmentId: data.departmentId,
              teamId: data.teamId,
              isBlocked: data.isBlocked,
              status: data.status,
              role: data.role,
              createdAt: data.createdAt?.toDate(),
            } as Member;
          });
          this.loading = false;
          this.updateMemberPagination();
          return;
        } else {
          const teamRef = doc(db, "ems-teams", departmentId);
          const teamDoc = await getDoc(teamRef);
          if (teamDoc.exists()) {
            const teamData = teamDoc.data();
            // Get memberIds from team document
            const memberIds = teamData.memberIds || [];
            if (memberIds.length === 0) {
              this.members = [];
              this.loading = false;
              return;
            }
            // Fetch members using the memberIds
            const memberPromises = memberIds.map((id: string) => {
              return getDoc(doc(db, "ems-users", id));
            });
            const memberDocs = await Promise.all(memberPromises);
            const existingDocs = memberDocs.filter((doc) => doc.exists());
            this.members = existingDocs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                position: data.position,
                employeeId: data.employeeId,
                departmentId: data.departmentId,
                teamId: departmentId,
                isBlocked: data.isBlocked,
                status: data.status,
                role: data.role,
                createdAt: data.createdAt?.toDate(),
              } as Member;
            });
            this.loading = false;
            return;
          } else {
            console.log("No team found with ID:", departmentId);
          }
        }
        // Fallback to querying by departmentId directly
        const q = query(
          collection(db, "ems-users"),
          where("departmentId", "==", departmentId)
        );
        const unsubscribe = onSnapshot(q, (snap) => {
          this.members = snap.docs.map((d) => {
            const data = d.data();
            console.log("User data for ID", d.id, ":", data);
            return {
              id: d.id,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              position: data.position,
              employeeId: data.employeeId,
              departmentId: data.departmentId,
              isBlocked: data.isBlocked,
              status: data.status,
              role: data.role,
              createdAt: data.createdAt?.toDate(),
            } as Member;
          });
          this.loading = false;
        });
        this.unsubscribeListeners.push(unsubscribe);
      } catch (err) {
        this.error = (err as Error).message;
        this.loading = false;
      }
    },

    async fetchEmployeeById(employeeId: string): Promise<Member | null> {
      this.loading = true;
      try {
        const employeeDoc = await getDoc(doc(db, "ems-users", employeeId));
        if (!employeeDoc.exists()) return null;
        const data = employeeDoc.data();
        const employee = {
          id: employeeDoc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          position: data.position,
          employeeId: data.employeeId,
          departmentId: data.departmentId,
          teamId: data.teamId,
          managerId: data.managerId,
          isBlocked: data.isBlocked,
          status: data.status,
          manager: data.manager,
          profileImg: data.profileImg,
          createdAt: data.createdAt?.toDate(),
          role: data.role,
        } as Member;
        // Ensure we have department data loaded
        if (data.departmentId && this.teams.length === 0) {
          // If teams aren't loaded yet, fetch them
          const teamsQuery = query(collection(db, "ems-teams"));
          const teamsSnapshot = await getDocs(teamsQuery);
          this.teams = teamsSnapshot.docs.map((d) => {
            const teamData = d.data();
            return {
              id: d.id,
              name: teamData.name,
              description: teamData.description,
              departmentId: teamData.departmentId,
              leadId: teamData.leadId,
              memberIds: teamData.memberIds,
              createdAt: teamData.createdAt?.toDate(),
            } as Teams;
          });
        }
        // Add to members array
        this.members.push(employee);
        return employee;
      } catch (error) {
        console.error("Error fetching employee:", error);
        return null;
      } finally {
        this.loading = false;
      }
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

    async addMember(teamId: string, employeeUID: string) {
      const teamRef = doc(db, "ems-teams", teamId);
      try {
        // Using transaction for atomic update
        await runTransaction(db, async (transaction) => {
          const teamDoc = await transaction.get(teamRef);
          if (!teamDoc.exists()) throw new Error("Team not found");
          const currentMembers = teamDoc.data()?.memberIds || [];
          if (!currentMembers.includes(employeeUID)) {
            transaction.update(teamRef, {
              memberIds: [...currentMembers, employeeUID],
            });
          }
        });
        // Update employee's team reference
        await updateDoc(doc(db, "ems-users", employeeUID), {
          teamId: teamId,
        });
      } catch (error) {
        console.error("Error adding team member:", error);
        throw error;
      }
    },

    async removeMember(teamId: string, userId: string) {
      const teamRef = doc(db, "ems-teams", teamId);
      const updated = this.currentTeam.memberIds.filter(
        (id: string) => id !== userId
      );
      await updateDoc(teamRef, { memberIds: updated });
      await updateDoc(doc(db, "ems-users", userId), { teamId: null });
    },

    setTeamSearchTerm(term: string): void {
      this.searchTeamsByName = term.toLowerCase();
      this.currentPage = 1;
      this.updateTeamPagination();
    },

    setMemberSearchTerm(term: string): void {
      this.searchMembersByTerm = term.toLowerCase();
      this.currentMemberPage = 1;
      this.updateMemberPagination();
    },

    setTeamCurrentPage(page: number) {
      this.currentPage = page;
      this.updateTeamPagination();
    },

    setMemberCurrentPage(page: number) {
      this.currentMemberPage = page;
      this.updateMemberPagination();
    },

    updateTeamPagination(): void {
      const start = (this.currentPage - 1) * this.teamsPerPage;
      const end = start + this.teamsPerPage;
      this.paginatedTeams = this.filteredTeams.slice(start, end);
    },

    updateMemberPagination(): void {
      const start = (this.currentMemberPage - 1) * this.membersPerPage;
      const end = start + this.membersPerPage;
      this.paginatedMembers = this.filteredMembers.slice(start, end);
    },
  },

  getters: {
    byDepartment: (state) => (deptId: string) =>
      state.teams.filter((t) => t.departmentId === deptId),

    totalTeamPages(): number {
      return Math.ceil(this.filteredTeams.length / this.teamsPerPage);
    },

    filteredTeams: (state: TeamState): Teams[] => {
      if (!state.searchTeamsByName) return state.teams;
      return state.teams.filter((team) =>
        team.name?.toLowerCase().includes(state.searchTeamsByName)
      );
    },

    totalMemberPages(): number {
      return Math.ceil(this.filteredMembers.length / this.membersPerPage);
    },

    filteredMembers: (state: TeamState): Member[] => {
      if (!state.searchMembersByTerm) return state.members;
      const term = state.searchMembersByTerm;
      return state.members.filter(
        (e) =>
          e.email?.toLowerCase().includes(term) ||
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(term) ||
          e.employeeId?.toLowerCase().includes(term)
      );
    },

    getDepartmentName: (state) => (departmentId: string, teamId?: string) => {
      if (!departmentId && !teamId) return "Not Assigned";
      let department = state.teams.find(
        (team) => team.departmentId === departmentId
      );
      if (!department && teamId && state.teams.length > 0) {
        department = state.teams.find((team) => team.id === teamId);
      }
      if (!department && state.teams.length > 0) {
        // Log for debugging
        console.log(
          `Department not found. DepartmentId: ${departmentId}, TeamId: ${teamId}, Teams available: ${state.teams.length}`
        );
      }
      return department?.name || "Unknown Department";
    },
  },
});
