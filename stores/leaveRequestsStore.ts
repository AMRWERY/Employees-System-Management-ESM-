import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc,
  deleteDoc,
  arrayUnion,
  getDocs,
  where,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "~/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { LeaveRequest } from "@/types/leaveRequest";

const maxVacationDays = 21;

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
    async getRequestFromUserDocument(
      requestId: string
    ): Promise<LeaveRequest | null> {
      try {
        if (!auth.currentUser?.uid) return null;
        const userDocRef = doc(db, "ems-users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const requestInArray = userData.requests?.find(
            (r: any) => r.id === requestId
          );
          if (requestInArray) {
            return {
              id: requestInArray.id,
              userId: auth.currentUser.uid,
              employeeId: userData.employeeId,
              employeeName: userData.employeeName,
              startDate: requestInArray.startDate?.toDate?.(),
              endDate: requestInArray.endDate?.toDate?.(),
              type: requestInArray.type,
              reason: requestInArray.reason || "",
              status: requestInArray.status,
              submittedAt: requestInArray.submittedAt?.toDate?.(),
              durationDays: requestInArray.durationDays,
              managerId: userData.managerId,
              teamId: userData.teamId,
              attachments: requestInArray.attachments || [],
              manager: undefined,
              rejectionReason: undefined,
              decisionAt: undefined,
              decisionBy: undefined,
              availableBalance: undefined,
            };
          }
        }
        return null;
      } catch (error) {
        console.error("Error fetching request from user document:", error);
        return null;
      }
    },

    async getRequestById(id: string): Promise<LeaveRequest | null> {
      // First try to find in store
      let request: LeaveRequest | null =
        this.allRequests.find((r) => r.id === id) ||
        this.myRequests.find((r) => r.id === id) ||
        null;
      if (request) return request;
      // Try main collection
      try {
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
            reason: data.reason || "",
            status: data.status,
            submittedAt: data.submittedAt?.toDate(),
            durationDays: data.durationDays,
            manager: data.manager || undefined,
            managerId: data.managerId || undefined,
            teamId: data.teamId || undefined,
            attachments: data.attachments || [],
            rejectionReason: data.rejectionReason || undefined,
            decisionAt: data.decisionAt?.toDate() || undefined,
            decisionBy: data.decisionBy || undefined,
            availableBalance: data.availableBalance ?? undefined,
          } as LeaveRequest;
          return request;
        }
      } catch (error) {
        console.error("Error fetching from ems-leave-requests:", error);
      }
      const userDocRequest = await this.getRequestFromUserDocument(id);
      return userDocRequest;
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

    async fetchMyRequests() {
      try {
        this.loading = true;
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("User not authenticated");
        const docRef = doc(db, "ems-leave-requests", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const requests = data.requests || [];
          // Convert timestamps to JS Date
          this.myRequests = requests.map((req: any) => ({
            ...req,
            startDate: req.startDate?.toDate?.() || new Date(req.startDate),
            endDate: req.endDate?.toDate?.() || new Date(req.endDate),
            submittedAt:
              req.submittedAt?.toDate?.() || new Date(req.submittedAt),
          }));
        } else {
          this.myRequests = [];
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error);
      } finally {
        this.loading = false;
      }
    },

    async calculateLeaveBalance(userId: string): Promise<number> {
      try {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);

        const q = query(
          collection(db, "ems-leave-requests"),
          where("userId", "==", userId),
          where("status", "in", ["approved", "pending"]),
          where("startDate", ">=", yearStart),
          where("startDate", "<=", yearEnd)
        );

        const querySnapshot = await getDocs(q);
        let totalUsedDays = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          totalUsedDays += data.durationDays;
        });

        return maxVacationDays - totalUsedDays;
      } catch (error) {
        console.error("Error calculating vacation balance:", error);
        return maxVacationDays;
      }
    },

    async submitRequest(requestData: Omit<LeaveRequest, "id">) {
      try {
        this.loading = true;
        const userBalanceRef = doc(
          db,
          "ems-leave-requests",
          requestData.userId
        );
        const userBalanceSnap = await getDoc(userBalanceRef);
        // 1. Calculate available balance first
        const availableBalance = await this.calculateLeaveBalance(
          requestData.userId
        );
        // 2. Validate vacation balance
        if (
          requestData.type === "vacation" &&
          requestData.durationDays > availableBalance
        ) {
          throw new Error(
            `Exceeds available vacation days. Max: ${availableBalance}`
          );
        }
        // 3. Prepare request data
        const requestSummary = {
          id: crypto.randomUUID(),
          startDate: requestData.startDate,
          endDate: requestData.endDate,
          type: requestData.type,
          durationDays: requestData.durationDays,
          status: "pending",
          submittedAt: new Date(),
          attachments: requestData.attachments || [],
        };
        // 4. Create or update user leave balance doc
        if (!userBalanceSnap.exists()) {
          await setDoc(userBalanceRef, {
            userId: requestData.userId,
            employeeId: requestData.employeeId,
            employeeName: requestData.employeeName,
            managerId: requestData.managerId || null,
            teamId: requestData.teamId || null,
            availableBalance: availableBalance - requestData.durationDays,
            requests: [requestSummary],
          });
        } else {
          await updateDoc(userBalanceRef, {
            requests: arrayUnion(requestSummary),
            availableBalance: availableBalance - requestData.durationDays,
          });
        }
        return requestSummary.id;
      } catch (error) {
        console.error("Error submitting leave request:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Fix approveRequest action
    async approveRequest(id: string) {
      try {
        this.loading = true;
        const ref = doc(db, "ems-leave-requests", id);
        const docSnap = await getDoc(ref);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // For approved vacation requests, maintain the available balance
          if (data.type === "vacation" && data.status === "pending") {
            // Use the calculated availableBalance if exists, otherwise preserve existing value
            const currentBalance = data.availableBalance ?? maxVacationDays;
            await updateDoc(ref, {
              status: "approved",
              availableBalance: currentBalance, // Keep the same balance
              decisionAt: serverTimestamp(),
              decisionBy: auth.currentUser?.uid,
            });
          } else {
            // For non-vacation or already processed requests
            await updateDoc(ref, {
              status: "approved",
              decisionAt: serverTimestamp(),
              decisionBy: auth.currentUser?.uid,
            });
          }
        }
      } catch (error) {
        throw error;
      } finally {
        this.loading = false;
      }
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
      return Math.ceil(
        this.filteredAndSearchedRequests.length / this.requestsPerPage
      );
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
