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
  runTransaction
} from "firebase/firestore";
import { db, auth } from "@/firebase";
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
    loading: false,
    error: "",
    searchTeamsByName: "",
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
          this.updatePagination();
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
        const q = query(
          collection(db, "ems-users"),
          where("departmentId", "==", departmentId)
        );
        const unsubscribe = onSnapshot(q, (snap) => {
          this.members = snap.docs.map(
            (d) =>
              ({
                id: d.id,
                firstName: d.data().firstName,
                lastName: d.data().lastName,
                email: d.data().email,
                position: d.data().position,
                employeeId: d.data().employeeId,
                departmentId: d.data().departmentId,
                isBlocked: d.data().isBlocked,
                role: d.data().role,
                createdAt: d.data().createdAt?.toDate(),
              } as Member)
          );
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
        // Check existing members first
        const existing = this.members.find((m) => m.id === employeeId);
        if (existing) return existing;
        // Fetch from Firestore
        const docRef = doc(db, "ems-users", employeeId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        const employee = {
          id: docSnap.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          position: data.position,
          employeeId: data.employeeId,
          departmentId: data.departmentId,
          isBlocked: data.isBlocked,
          createdAt: data.createdAt?.toDate(),
          role: data.role,
        } as Member;
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

    // async addMember(teamId: string, employeeId: string) {
    //   try {
    //     const teamRef = doc(db, "ems-teams", teamId);
    //     const teamSnap = await getDoc(teamRef);
    //     if (!teamSnap.exists()) {
    //       throw new Error("Team not found");
    //     }
    //     const teamData = teamSnap.data();
    //     const currentMembers = teamData?.memberIds || [];
    //     // Prevent duplicates
    //     if (!currentMembers.includes(employeeId)) {
    //       await updateDoc(teamRef, {
    //         memberIds: [...currentMembers, employeeId],
    //       });
    //     }
    //     // Update employee document
    //     await updateDoc(doc(db, "ems-users", employeeId), {
    //       teamId: teamId,
    //     });
    //   } catch (error) {
    //     console.error("Error adding team member:", error);
    //     throw error;
    //   }
    // },
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
          memberIds: [...currentMembers, employeeUID]
        });
      }
    });
    // Update employee's team reference
    await updateDoc(doc(db, "ems-users", employeeUID), {
      teamId: teamId
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    throw error;
  }
},
    
    // async addMember(teamId: string, userId: string) {
    //   const teamRef = doc(db, "ems-teams", teamId);
    //   await updateDoc(teamRef, {
    //     memberIds: [...this.currentTeam.memberIds, userId],
    //   });
    //   // optional: update user doc
    //   await updateDoc(doc(db, "ems-users", userId), { teamId });
    // },

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

    getDepartmentName: (state) => (departmentId: string) => {
      const department = state.teams.find(
        (team) => team.departmentId === departmentId
      );
      return department?.name || "Unknown Department";
    },
  },
});
