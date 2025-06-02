import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db, auth } from "@/firebase";
import type { Manager } from "@/types/managers";

export const useManagerStore = defineStore("managers", {
  state: () => ({
    managers: [] as Manager[],
    paginatedManagers: [] as Manager[],
    currentPage: 1,
    managersPerPage: 8,
    loading: false,
    error: null as string | null,
    searchManagersByEmail: "",
  }),

  actions: {
    async fetchManagers(): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const managersQuery = query(
          collection(db, "ems-users"),
          where("role", "==", "manager")
        );
        const querySnapshot = await getDocs(managersQuery);
        const managers: Manager[] = querySnapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              uid: data.uid,
              profileImg: data.profileImg,
              email: data.email || "",
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              employeeId: data.employeeId || "",
              role: data.role || "manager",
              position: data.position || "",
              roledId: data.roledId || null,
              permissions: data.permissions || {},
              status: data.status || "active",
              createdAt: data.createdAt?.toDate?.() || new Date(),
              teamId: data.teamId || null,
            };
          }
        );
        this.managers = managers.filter(
          (manager) => manager.email !== "test-admin@ems.com"
        );
        this.updatePagination();
      } catch (error) {
        // console.error("Error fetching managers:", error);
        this.error = "Failed to fetch managers";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchManagerById(managerId: string): Promise<Manager | null> {
      this.loading = true;
      this.error = null;
      try {
        if (!managerId) return null;
        const managerRef = doc(db, "ems-users", managerId);
        const managerSnap = await getDoc(managerRef);
        if (managerSnap.exists() && managerSnap.data().role === "manager") {
          const data = managerSnap.data();
          const manager: Manager = {
            id: managerSnap.id,
            uid: data.uid,
            profileImg: data.profileImg,
            email: data.email || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            employeeId: data.employeeId || "",
            role: data.role || "manager",
            position: data.position || "",
            roledId: data.roledId || null,
            permissions: data.permissions || {},
            status: data.status || "active",
            createdAt: data.createdAt?.toDate?.() || new Date(),
            teamId: data.teamId || null,
          };
          return manager;
        } else {
          // console.warn(`No manager found with id: ${managerId}`);
          return null;
        }
      } catch (error) {
        // console.error("Error fetching manager by ID:", error);
        this.error = "Failed to fetch manager";
        return null;
      } finally {
        this.loading = false;
      }
    },

    async createManager(managerData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      teamId?: string;
      position?: string;
    }) {
      const originalUser = auth.currentUser;
      const originalUserJSON = sessionStorage.getItem("user");
      let userCredential: Awaited<
        ReturnType<typeof createUserWithEmailAndPassword>
      > | null = null;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          managerData.email,
          managerData.password
        );
        const rolesStore = useRolesStore();
        await rolesStore.fetchRoles();
        const employeeRole = rolesStore.roles.find((r) => r.name === "manager");
        if (!employeeRole) throw new Error("Employee role not configured");
        const employeeId = `ems-${Math.floor(1000 + Math.random() * 9000)}`;
        const userData = {
          uid: userCredential.user.uid,
          employeeId,
          firstName: managerData.firstName,
          lastName: managerData.lastName,
          email: managerData.email,
          position: managerData.position || "Manager",
          role: "manager",
          roledId: employeeRole.id,
          permissions: employeeRole.permissions || {},
          status: "active",
          loginType: "email",
          createdAt: serverTimestamp(),
          teamId: managerData.teamId || null,
        };
        // Save to ems-users
        await setDoc(doc(db, "ems-users", userCredential.user.uid), userData);
        // Save to ems-managers
        await addDoc(collection(db, "ems-managers"), {
          ...userData,
        });
        // assign to team
        if (managerData.teamId) {
          try {
            const teamRef = doc(db, "ems-teams", managerData.teamId);
            const teamDoc = await getDoc(teamRef);
            if (teamDoc.exists()) {
              const memberIds = teamDoc.data().memberIds || [];
              const newMemberIds = [...memberIds, userCredential.user.uid];
              await updateDoc(teamRef, { memberIds: newMemberIds });
            } else {
              console.warn("Team not found, skipping team assignment");
            }
          } catch (teamError) {
            console.error("Error adding user to team:", teamError);
          }
        }
        // Restore original auth user
        if (originalUserJSON) {
          sessionStorage.setItem("user", originalUserJSON);
        }
        if (originalUser) {
          await auth.updateCurrentUser(originalUser);
        }
        return userCredential.user.uid;
      } catch (error) {
        // console.error("Employee creation failed:", error);
        if (userCredential?.user) {
          try {
            await userCredential.user.delete();
          } catch (deleteError) {
            console.error(
              "Failed to clean up auth user after error:",
              deleteError
            );
          }
        }
        throw error;
      }
    },

    async updateManager(managerId: string, updates: Partial<Manager>) {
      // Implement update logic
    },

    async deleteManager(managerId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, "ems-users", managerId));
        // Query and delete from "ems-managers" where uid === managerId
        const managersRef = collection(db, "ems-managers");
        const q = query(managersRef, where("uid", "==", managerId));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, "ems-managers", docSnap.id))
        );
        await Promise.all(deletePromises);
        this.managers = this.managers.filter((user) => user.id !== managerId);
        this.updatePagination();
      } catch (error) {
        // console.error("Error deleting manager from both collections:", error);
        this.error = "Failed to delete manager";
      }
    },

    async toggleBlockManager(managerId: string): Promise<void> {
      try {
        const manager = this.managers.find((u) => u.id === managerId);
        if (!manager) throw new Error("Manager not found");
        const newStatus = manager.status === "active" ? "blocked" : "active";
        const userRef = doc(db, "ems-users", managerId);
        await updateDoc(userRef, { status: newStatus });
        manager.status = newStatus;
        this.updatePagination();
      } catch (error) {
        // console.error("Toggle block failed:", error);
        throw error;
      }
    },

    setCurrentPage(page: number) {
      this.currentPage = page;
      this.updatePagination();
    },

    updatePagination(): void {
      const start = (this.currentPage - 1) * this.managersPerPage;
      const end = this.currentPage * this.managersPerPage;
      const filtered = this.filteredManagers;
      this.paginatedManagers = filtered.slice(start, end);
      const maxPage = Math.max(
        1,
        Math.ceil(filtered.length / this.managersPerPage)
      );
      if (this.currentPage > maxPage) {
        this.currentPage = maxPage;
        this.paginatedManagers = filtered.slice(
          (maxPage - 1) * this.managersPerPage,
          maxPage * this.managersPerPage
        );
      }
    },

    setSearchTerm(term: string): void {
      this.searchManagersByEmail = term.toLowerCase();
      this.currentPage = 1;
      this.updatePagination();
    },
  },

  getters: {
    activeManagers: (state) =>
      state.managers.filter((m) => m.status === "active"),

    blockedManagers: (state) =>
      state.managers.filter((m) => m.status === "blocked"),

    getManagerById: (state) => (id: string) =>
      state.managers.find((m) => m.id === id),

    totalPages(): number {
      return Math.ceil(this.filteredManagers.length / this.managersPerPage);
    },

    filteredManagers(state): Manager[] {
      if (!state.searchManagersByEmail) return state.managers;
      const term = state.searchManagersByEmail.toLowerCase();
      return state.managers.filter((employee) => {
        const email = employee.email?.toLowerCase() || "";
        const firstName = employee.firstName?.toLowerCase() || "";
        const lastName = employee.lastName?.toLowerCase() || "";
        const employeeId = employee.employeeId?.toLowerCase() || "";
        return (
          email.includes(term) ||
          firstName.includes(term) ||
          lastName.includes(term) ||
          employeeId.includes(term) ||
          `${firstName} ${lastName}`.includes(term)
        );
      });
    },
  },
});
