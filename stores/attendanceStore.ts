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
  arrayUnion,
  increment,
  getDoc,
} from "firebase/firestore";

interface DailyAttendance {
  date: string; // "YYYY-MM-DD"
  clockIns: Timestamp[];
  clockOuts: Timestamp[];
  totalHours: number;
  uid: string;
  role: string;
}

interface AttendanceState {
  todayRecord: DailyAttendance | null;
  weeklySummary: any[];
  loading: boolean;
  error: string | null;
}

interface DailyAttendance {
  id: string;
  date: string;
  clockIns: Timestamp[];
  clockOuts: Timestamp[];
  totalHours: number;
  uid: string;
  role: string;
}

const calculateDuration = (start: Timestamp, end: Timestamp): string => {
  const diff = end.toMillis() - start.toMillis();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const calculateDurationInHours = (start: Timestamp, end: Timestamp): number => {
  return (end.toMillis() - start.toMillis()) / (1000 * 60 * 60);
};

const getUTCDateString = () => new Date().toISOString().substring(0, 10);

export const useAttendanceStore = defineStore("attendance", {
  state: (): AttendanceState => ({
    todayRecord: null,
    weeklySummary: [],
    loading: false,
    error: null,
  }),

  actions: {
    async clockIn() {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("User not authenticated");
      this.loading = true;
      try {
        const date = getUTCDateString();
        const docRef = doc(
          db,
          "ems-attendance",
          authStore.user.uid,
          "daily-records",
          date
        );
        await setDoc(
          docRef,
          {
            date,
            uid: authStore.user.uid,
            role: authStore.user.role || "employee",
            clockIns: arrayUnion(Timestamp.now()),
            clockOuts: [],
            totalHours: 0,
          },
          { merge: true }
        );
        await this.fetchTodayRecord();
      } catch (error) {
        this.handleError(error);
      } finally {
        this.loading = false;
      }
    },

    async clockOut() {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("User not authenticated");
      this.loading = true;
      try {
        const date = getUTCDateString();
        const docRef = doc(
          db,
          "ems-attendance",
          authStore.user.uid,
          "daily-records",
          date
        );
        const lastClockIn =
          this.todayRecord?.clockIns.slice(-1)[0] || Timestamp.now();
        const duration = calculateDurationInHours(lastClockIn, Timestamp.now());
        const roundedDuration = Math.ceil(duration);
        await updateDoc(docRef, {
          clockOuts: arrayUnion(Timestamp.now()),
          totalHours: increment(roundedDuration),
        });
        await this.fetchTodayRecord();
      } catch (error) {
        this.handleError(error);
      } finally {
        this.loading = false;
      }
    },

    handleError(error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.error = errorMessage;
      console.error("Attendance error:", error);
    },

    calculateLastSessionHours(): number {
      if (!this.todayRecord) return 0;
      const lastClockIn = this.todayRecord.clockIns.slice(-1)[0];
      return (
        (Timestamp.now().toMillis() - lastClockIn.toMillis()) / (1000 * 60 * 60)
      );
    },

    async fetchTodayRecord() {
      const authStore = useAuthStore();
      if (!authStore.user?.uid) {
        this.error = "User not authenticated";
        return;
      }
      this.loading = true;
      try {
        const date = getUTCDateString();
        const docRef = doc(
          db,
          "ems-attendance",
          authStore.user.uid,
          "daily-records",
          date
        );
        const docSnap = await getDoc(docRef);
        this.todayRecord = docSnap.exists()
          ? {
              id: docSnap.id,
              date: docSnap.data().date,
              clockIns: docSnap.data().clockIns || [],
              clockOuts: docSnap.data().clockOuts || [],
              totalHours: docSnap.data().totalHours || 0,
              uid: docSnap.data().uid,
              role: docSnap.data().role || "employee",
            }
          : null;
      } catch (error) {
        this.handleError(error);
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
        const dateString = oneWeekAgo.toISOString().substring(0, 10);
        const q = query(
          collection(db, "ems-attendance", authStore.user.uid, "daily-records"),
          where("date", ">=", dateString) // <-- Use ISO string
        );
        const snapshot = await getDocs(q);
        this.weeklySummary = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        this.handleError(error);
      } finally {
        this.loading = false;
      }
    },
  },

  getters: {
    clockedIn: (state) => {
      return state.todayRecord
        ? state.todayRecord.clockIns.length > state.todayRecord.clockOuts.length
        : false;
    },

    formattedTodayEntries(state) {
      if (!state.todayRecord) return [];
      return state.todayRecord.clockIns.map((clockIn, index) => ({
        time: clockIn.toDate(),
        type: "in" as const,
        ...(state.todayRecord?.clockOuts[index] && {
          clockOut: state.todayRecord.clockOuts[index].toDate(),
          duration: calculateDuration(
            clockIn,
            state.todayRecord.clockOuts[index]
          ),
        }),
      }));
    },
  },
});
