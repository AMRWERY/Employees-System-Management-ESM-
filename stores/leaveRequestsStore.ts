import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "~/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { LeaveRequest } from "@/types/leaveRequest";

export const useLeaveRequestsStore = defineStore("leave-requests", {
  state: () => ({
    myRequests: [] as LeaveRequest[],
    allRequests: [] as LeaveRequest[],
    paginatedRequests: [] as LeaveRequest[],
    currentPage: 1,
    requestsPerPage: 8,
    loading: false,
    error: "",
    searchTerm: "",
    activeFilter: "all",
  }),

  actions: {
    async getRequestById(id: string) {
      let request = this.allRequests.find((request) => request.id === id);
      if (!request) {
        const docRef = doc(db, "ems-leave-requests", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          request = {
            id: docSnap.id,
            userId: data.userId,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            startDate: data.startDate?.toDate(),
            endDate: data.endDate?.toDate(),
            type: data.type,
            reason: data.reason,
            status: data.status,
            submittedAt: data.submittedAt?.toDate(),
            durationDays: data.durationDays,
            manager: data.manager,
            managerId: data.managerId,
            teamId: data.teamId,
            attachments: data.attachments || [],
            rejectionReason: data.rejectionReason,
            decisionAt: data.decisionAt?.toDate(),
            decisionBy: data.decisionBy,
          };
        }
      }
      return request;
    },

    async fetchAllRequests() {
      try {
        this.loading = true;
        const q = query(
          collection(db, "ems-leave-requests"),
          orderBy("submittedAt", "desc")
        );
        const unsubscribe = onSnapshot(
          q,
          (snapshot: QuerySnapshot<DocumentData>) => {
            this.allRequests = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                userId: data.userId,
                employeeId: data.employeeId,
                employeeName: data.employeeName,
                startDate: data.startDate?.toDate(),
                endDate: data.endDate?.toDate(),
                type: data.type,
                reason: data.reason,
                status: data.status,
                submittedAt: data.submittedAt?.toDate(),
                durationDays: data.durationDays,
                manager: data.manager,
                managerId: data.managerId || null,
                teamId: data.teamId || null,
                attachments: data.attachments || [],
                rejectionReason: data.rejectionReason,
                decisionAt: data.decisionAt?.toDate(),
                decisionBy: data.decisionBy,
              };
            });
            this.updatePagination();
            this.loading = false;
          },
          (error: Error) => {
            this.error = error.message;
            this.loading = false;
          }
        );
        return unsubscribe;
      } catch (error) {
        this.loading = false;
        if (error instanceof Error) {
          this.error = error.message;
        }
      }
    },

    fetchMyRequests() {
      try {
        this.loading = true;
        if (!auth.currentUser?.uid) {
          throw new Error("User not authenticated");
        }
        const q = query(
          collection(db, "ems-leave-requests"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("submittedAt", "desc")
        );
        const unsubscribe = onSnapshot(
          q,
          (snapshot: QuerySnapshot<DocumentData>) => {
            this.myRequests = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                userId: data.userId,
                employeeId: data.employeeId,
                employeeName: data.employeeName,
                startDate: data.startDate?.toDate(),
                endDate: data.endDate?.toDate(),
                type: data.type,
                reason: data.reason,
                status: data.status,
                submittedAt: data.submittedAt?.toDate(),
                durationDays: data.durationDays,
                manager: data.manager,
                managerId: data.managerId,
                teamId: data.teamId,
                attachments: data.attachments || [],
                rejectionReason: data.rejectionReason,
                decisionAt: data.decisionAt?.toDate(),
                decisionBy: data.decisionBy,
              };
            });
            this.loading = false;
          },
          (error: Error) => {
            this.error = error.message;
            this.loading = false;
          }
        );
        return unsubscribe;
      } catch (error) {
        this.loading = false;
        if (error instanceof Error) {
          this.error = error.message;
        }
      }
    },

    async submitRequest(requestData: Omit<LeaveRequest, "id">) {
      const docRef = await addDoc(collection(db, "ems-leave-requests"), {
        ...requestData,
        submittedAt: serverTimestamp(),
      });
      return docRef.id;
    },

    async uploadAttachment(file: File) {
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `leave-attachments/${auth.currentUser?.uid}/${Date.now()}_${file.name}`
      );
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    },

    async approveRequest(id: string) {
      try {
        this.loading = true;
        const ref = doc(db, "ems-leave-requests", id);
        await updateDoc(ref, {
          status: "approved",
          decisionAt: serverTimestamp(),
          decisionBy: auth.currentUser?.uid,
        });
      } catch (error) {
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async rejectRequest(id: string, reason?: string) {
      try {
        this.loading = true;
        const ref = doc(db, "ems-leave-requests", id);
        await updateDoc(ref, {
          status: "rejected",
          decisionAt: serverTimestamp(),
          decisionBy: auth.currentUser?.uid,
          rejectionReason: reason || null,
        });
      } catch (error) {
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async cancelRequest(id: string) {
      const ref = doc(db, "ems-leave-requests", id);
      await updateDoc(ref, {
        status: "cancelled",
        decisionAt: serverTimestamp(),
        decisionBy: auth.currentUser?.uid,
      });
    },

    async deleteRequest(id: string) {
      try {
        this.loading = true;
        const ref = doc(db, "ems-leave-requests", id);
        // First check if the document exists
        const docSnap = await getDoc(ref);
        if (!docSnap.exists()) {
          throw new Error("Leave request not found");
        }
        // Then try to delete it
        await deleteDoc(ref);
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to delete leave request";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async withdrawRequest(id: string) {
      try {
        this.loading = true;
        const ref = doc(db, "ems-leave-requests", id);
        // First check if the document exists and get its data
        const docSnap = await getDoc(ref);
        if (!docSnap.exists()) {
          throw new Error("Leave request not found");
        }
        const data = docSnap.data();
        // Check if the request can be withdrawn
        if (data.status !== "pending") {
          throw new Error("Only pending requests can be withdrawn");
        }
        if (data.userId !== auth.currentUser?.uid) {
          throw new Error("You can only withdraw your own requests");
        }
        // Update the request status to withdrawn
        await updateDoc(ref, {
          status: "cancelled",
          decisionAt: serverTimestamp(),
          decisionBy: auth.currentUser?.uid,
        });
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to withdraw leave request";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setSearchTerm(term: string) {
      this.searchTerm = term.toLowerCase(); // Store search term, usually in lowercase
      this.currentPage = 1; // Reset to first page on new search
      this.updatePagination(); // Re-apply pagination with new search results
    },

    setFilter(filter: string) {
      this.activeFilter = filter;
      this.currentPage = 1; // Reset to first page when filter changes
      this.updatePagination();
    },

    setCurrentPage(page: number) {
      this.currentPage = page;
      this.updatePagination();
    },

    updatePagination(): void {
      const start = (this.currentPage - 1) * this.requestsPerPage;
      const end = this.currentPage * this.requestsPerPage;
      // Use the store's filteredRequests getter
      const filtered = this.filteredAndSearchedRequests;
      this.paginatedRequests = filtered.slice(start, end);
      const maxPage = Math.max(
        1,
        Math.ceil(filtered.length / this.requestsPerPage)
      );
      if (this.currentPage > maxPage) {
        this.currentPage = maxPage;
        // Recalculate if page number was out of bounds
        const newStart = (this.currentPage - 1) * this.requestsPerPage;
        this.paginatedRequests = filtered.slice(
          newStart,
          this.currentPage * this.requestsPerPage
        );
      }
    },
  },

  getters: {
    pending: (state) => state.myRequests.filter((r) => r.status === "pending"),

    upcoming: (state) =>
      state.myRequests.filter((r) => new Date(r.startDate) >= new Date()),

    history: (state) =>
      state.myRequests.filter((r) => new Date(r.endDate) < new Date()),

    allPending: (state) =>
      state.allRequests.filter((r) => r.status === "pending"),

    allApproved: (state) =>
      state.allRequests.filter((r) => r.status === "approved"),

    allRejected: (state) =>
      state.allRequests.filter((r) => r.status === "rejected"),

    filteredAndSearchedRequests: (state): LeaveRequest[] => {
      let requests = state.allRequests;
      // 1. Filter by active status filter (e.g., "pending", "approved")
      if (state.activeFilter !== "all" && state.activeFilter !== "") {
        requests = requests.filter(
          (request) => request.status === state.activeFilter
        );
      }
      // 2. Filter by search term (employeeName or employeeId)
      if (state.searchTerm.trim() !== "") {
        requests = requests.filter((request) => {
          const nameMatch = request.employeeName
            ? request.employeeName.toLowerCase().includes(state.searchTerm)
            : false;
          const idMatch = request.employeeId
            ? request.employeeId.toLowerCase().includes(state.searchTerm)
            : false;
          // You could also add other fields to search here if needed
          return nameMatch || idMatch;
        });
      }
      return requests;
    },

    totalPages(): number {
      // Use the combined filter and search getter for total pages
      return Math.ceil(this.filteredAndSearchedRequests.length / this.requestsPerPage);
    },
    
    // totalPages(): number {
    //   return Math.ceil(this.filteredRequests.length / this.requestsPerPage);
    // },

    filteredRequests: (state) => {
      let requests = state.allRequests;
      // Filter by active tab
      if (state.activeFilter !== "all") {
        requests = requests.filter(
          (request) => request.status === state.activeFilter
        );
      }
      return requests;
    },
  },
});
