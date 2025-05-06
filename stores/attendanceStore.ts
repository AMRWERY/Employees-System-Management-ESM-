import { db } from "~/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

interface AttendanceRecord {
  uid: string;
  role: string;
  date: string;
  clockIn: Timestamp;
  clockOut?: Timestamp;
  status: "active" | "completed";
}

interface AttendanceDocument extends AttendanceRecord {
  id: string;
}

interface AttendanceState {
  todayEntries: AttendanceDocument[];
  weeklySummary: any[];
  loading: boolean;
  error: string | null;
  currentAttendanceId: string | null;
}

export const useAttendanceStore = defineStore("attendance", {
  state: (): AttendanceState => ({
    todayEntries: [],
    weeklySummary: [],
    loading: false,
    error: null,
    currentAttendanceId: null,
  }),

  actions: {
    async clockIn() {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("User not authenticated");
      this.loading = true;
      this.error = null;
      try {
        const newRecord: Partial<AttendanceRecord> = {
          uid: authStore.user.uid,
          role: authStore.user.role || "employee",
          date: new Date().toISOString().split("T")[0],
          clockIn: Timestamp.now(),
          status: "active",
        };
        const docRef = doc(collection(db, "ems-attendance"));
        await setDoc(docRef, newRecord);
        this.currentAttendanceId = docRef.id;
        await this.fetchTodayEntries();
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async clockOut() {
      if (!this.currentAttendanceId)
        throw new Error("No active attendance record");
      this.loading = true;
      this.error = null;
      try {
        const docRef = doc(db, "ems-attendance", this.currentAttendanceId);
        await updateDoc(docRef, {
          clockOut: Timestamp.now(),
          status: "completed",
        });
        this.currentAttendanceId = null;
        await this.fetchTodayEntries();
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchTodayEntries() {
      const authStore = useAuthStore();
      if (!authStore.user) return;
      this.loading = true;
      try {
        const today = new Date().toISOString().split("T")[0];
        const q = query(
          collection(db, "ems-attendance"),
          where("uid", "==", authStore.user.uid),
          where("date", "==", today)
        );
        const snapshot = await getDocs(q);
        this.todayEntries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as AttendanceRecord),
        }));
        // Check for active session
        const activeRecord = this.todayEntries.find(
          (record) => record.status === "active"
        );
        this.currentAttendanceId = activeRecord?.id || null;
      } catch (error) {
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async fetchWeeklySummary() {
      const authStore = useAuthStore();
      if (!authStore.user) return;
      this.loading = true;
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const q = query(
          collection(db, "ems-attendance"),
          where("uid", "==", authStore.user.uid),
          where("date", ">=", oneWeekAgo.toISOString().split("T")[0])
        );
        const snapshot = await getDocs(q);
        const records = snapshot.docs.map((doc) =>
          doc.data()
        ) as AttendanceRecord[];
        // Process weekly summary
        this.weeklySummary = this.processWeeklyData(records);
      } catch (error) {
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    processWeeklyData(records: AttendanceRecord[]) {
      // Implementation for processing weekly data
      // This should calculate hours per day
      return [];
    },

    calculateDuration(start: Timestamp, end: Timestamp): string {
      const diff = end.toMillis() - start.toMillis();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    },
  },

  getters: {
    clockedIn: (state) => !!state.currentAttendanceId,

    formattedTodayEntries(state) {
      const calculateDuration = (start: Timestamp, end: Timestamp): string => {
        const diff = end.toMillis() - start.toMillis();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      };
      return state.todayEntries.map((entry) => ({
        time: entry.clockIn.toDate(),
        type: "in" as const,
        ...(entry.clockOut && {
          clockOut: entry.clockOut.toDate(),
          duration: calculateDuration(entry.clockIn, entry.clockOut),
        }),
      }));
    },
  },
});
