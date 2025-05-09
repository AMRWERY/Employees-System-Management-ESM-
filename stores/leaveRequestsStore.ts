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
} from "firebase/firestore";
import { db, auth } from "~/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { LeaveRequest } from "@/types/leaveRequest";

export const useLeaveRequestsStore = defineStore("leave-requests", {
  state: () => ({
    myRequests: [] as any[],
    loading: false,
    error: "",
  }),

  actions: {
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
          (snapshot) => {
            if (snapshot.empty) {
              // console.warn('No documents found in collection');
            }
            this.myRequests = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                userId: data.userId,
                employeeName: data.employeeName,
                startDate: data.startDate?.toDate(),
                endDate: data.endDate?.toDate(),
                type: data.type,
                reason: data.reason,
                status: data.status,
                submittedAt: data.submittedAt?.toDate(),
                durationDays: data.durationDays,
                manager: data.manager,
                attachments: data.attachments || [],
              };
            });
            this.loading = false;
          },
          (error) => {
            console.error("[9] Firestore error:", error);
            this.error = error.message;
            this.loading = false;
          }
        );
        return unsubscribe;
      } catch (error) {
        console.error("[10] Store error:", error);
        this.loading = false;
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

    async cancelRequest(id: string) {
      // only allow cancel while still pending
      const ref = doc(db, "ems-leave-requests", id);
      await updateDoc(ref, {
        status: "cancelled",
        decisionAt: serverTimestamp(),
        decisionBy: auth.currentUser!.uid,
      });
    },
  },

  getters: {
    pending: (state) => state.myRequests.filter((r) => r.status === "pending"),

    upcoming: (state) =>
      state.myRequests.filter((r) => new Date(r.startDate) >= new Date()),

    history: (state) =>
      state.myRequests.filter((r) => new Date(r.endDate) < new Date()),
  },
});
