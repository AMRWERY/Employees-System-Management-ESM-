import { db } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { Employee, EmployeeState } from "@/types/employee";

export const useEmployeesStore = defineStore("employees", {
  state: (): EmployeeState => ({
    employees: [],
    paginatedEmployees: [],
    currentPage: 1,
    employeesPerPage: 8,
    recentEmployees: [],
    searchEmployeesByEmail: "",
  }),

  actions: {
    async fetchEmployees(): Promise<void> {
      // console.log("Fetching employees...");
      const employeesQuery = query(
        collection(db, "ems-users"),
        where("role", "==", "employee")
      );
      try {
        const querySnapshot = await getDocs(employeesQuery);
        // console.log(
        //   "Got snapshot with",
        //   querySnapshot.docs.length,
        //   "documents"
        // );
        this.employees = querySnapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              email: data.email || "",
              firstName: data.firstName,
              lastName: data.lastName,
              employeeId: data.employeeId,
              role: data.role,
              permissions: data.permissions || {},
              roledId: data.roledId || null,
              isBlocked: data.isBlocked,
              ...data,
            } satisfies Employee;
          }
        );
        this.employees = this.employees.filter(
          (user) => user.email !== "test-admin@ems.com"
        );
        // console.log("Filtered employees:", this.employees.length);
        this.updatePagination();
        // console.log("Updated pagination:", this.paginatedEmployees.length);
      } catch (error) {
        // console.error("Error fetching employees:", error);
        throw error;
      }
    },

    updatePagination(): void {
      const start = (this.currentPage - 1) * this.employeesPerPage;
      const end = this.currentPage * this.employeesPerPage;
      const filtered = this.filteredEmployees;
      this.paginatedEmployees = filtered.slice(start, end);
      const maxPage = Math.max(
        1,
        Math.ceil(filtered.length / this.employeesPerPage)
      );
      if (this.currentPage > maxPage) {
        this.currentPage = maxPage;
        this.paginatedEmployees = filtered.slice(
          (maxPage - 1) * this.employeesPerPage,
          maxPage * this.employeesPerPage
        );
      }
    },

    deleteEmployees(userId: string): Promise<void> {
      const docRef = doc(db, "ems-users", userId);
      return deleteDoc(docRef)
        .then(() => {
          this.employees = this.employees.filter((user) => user.id !== userId);
          this.updatePagination();
        })
        .catch((error) => {
          console.error("Error deleting employees:", error);
        });
    },

    blockEmployees(userId: string): Promise<void> {
      const userRef = doc(db, "ems-users", userId);
      return updateDoc(userRef, { isBlocked: true })
        .then(() => {
          const userIndex = this.employees.findIndex(
            (user) => user.id === userId
          );
          if (userIndex > -1) {
            this.employees[userIndex].isBlocked = true;
          } else {
            console.warn(
              "User not found in local store while blocking:",
              userId
            );
          }
        })
        .catch((error) => {
          console.error("Failed to block user:", error);
        });
    },

    toggleBlockEmployee(userId: string): Promise<void> {
      const userIndex = this.employees.findIndex((user) => user.id === userId);
      if (userIndex > -1) {
        const user = this.employees[userIndex];
        const newStatus = !user.isBlocked;
        const userRef = doc(db, "ems-users", userId);
        return updateDoc(userRef, { isBlocked: newStatus })
          .then(() => {
            this.employees[userIndex].isBlocked = newStatus;
          })
          .catch((error) => {
            console.error("Failed to toggle block status for user:", error);
          });
      } else {
        console.warn("User not found in local store:", userId);
        return Promise.resolve();
      }
    },

    async updateUserPermissions(
      userId: string,
      permissions: Record<string, Record<string, boolean>>
    ): Promise<void> {
      const userRef = doc(db, "ems-users", userId);
      try {
        await updateDoc(userRef, { permissions });
        const index = this.employees.findIndex((u) => u.id === userId);
        if (index > -1) {
          this.employees[index].permissions = permissions;
        }
      } catch (error) {
        console.error("Error updating permissions:", error);
        throw error;
      }
    },

    async updateUserRole(userId: string, roledId: string): Promise<void> {
      const userRef = doc(db, "ems-users", userId);
      try {
        await updateDoc(userRef, { roledId });
        const index = this.employees.findIndex((u) => u.id === userId);
        if (index > -1) {
          this.employees[index].roledId = roledId;
        }
      } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
      }
    },

    changePage(page: number): void {
      if (page > 0 && page <= this.totalPages) {
        this.currentPage = page;
        this.updatePagination();
      }
    },

    setSearchTerm(term: string): void {
      this.searchEmployeesByEmail = term.toLowerCase();
      this.currentPage = 1;
      this.updatePagination();
    },
  },

  getters: {
    totalPages(): number {
      return Math.ceil(this.filteredEmployees.length / this.employeesPerPage);
    },

    totalCustomers(): number {
      return this.employees.length;
    },

    filteredEmployees: (state: EmployeeState): Employee[] => {
      if (!state.searchEmployeesByEmail) return state.employees;
      return state.employees.filter((employee) => {
        const email = employee.email?.toLowerCase() || "";
        return email.includes(state.searchEmployeesByEmail);
      });
    },

    userPermissions:
      (state: EmployeeState) =>
      (userId: string): Record<string, Record<string, boolean>> | undefined => {
        const user = state.employees.find((u) => u.id === userId);
        const rolesStore = useRolesStore();
        if (!user?.roledId) return undefined;
        return rolesStore.getRolePermissions(user.roledId);
      },
  },
});
