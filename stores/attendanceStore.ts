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
  id: string;
  date: string;
  clockIns: Timestamp[];
  clockOuts: Timestamp[];
  totalSeconds: number;
  uid: string;
  role: string;
}

interface AttendanceState {
  todayRecord: DailyAttendance | null;
  weeklySummary: any[];
  loading: boolean;
  error: string | null;
}

const calculateDuration = (start: Timestamp, end: Timestamp): string => {
  const diff = end.toMillis() - start.toMillis();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// const formatTotalTime = (totalSeconds: number): string => {
//   const hours = Math.floor(totalSeconds / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const seconds = Math.floor(totalSeconds % 60);
//   return `${hours}h ${minutes}m ${seconds}s`;
// };

// // Convert seconds to minutes (for decimal display)
// const secondsToMinutes = (seconds: number): number => {
//   return seconds / 60;
// };

const calculateDurationInSeconds = (
  start: Timestamp,
  end: Timestamp
): number => {
  return (end.toMillis() - start.toMillis()) / 1000; // Convert milliseconds to seconds
};

const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds) return "-";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
    2,
    "0"
  )}m`;
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
            totalSeconds: 0,
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
        const durationSeconds = calculateDurationInSeconds(
          lastClockIn,
          Timestamp.now()
        );
        await updateDoc(docRef, {
          clockOuts: arrayUnion(Timestamp.now()),
          totalSeconds: increment(durationSeconds),
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
              totalSeconds: docSnap.data().totalSeconds || 0,
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
        const now = new Date();
        const todayUTC = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
        // Calculate last week's Monday (00:00 UTC)
        const lastWeekStart = new Date(todayUTC);
        lastWeekStart.setUTCDate(
          todayUTC.getUTCDate() - 7 - todayUTC.getUTCDay() + 1
        );
        // Set end to Sunday (23:59:59 UTC)
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setUTCDate(lastWeekStart.getUTCDate() + 6);
        lastWeekEnd.setUTCHours(23, 59, 59, 999);
        // Format query dates
        const startString = lastWeekStart.toISOString().split("T")[0];
        const endString = lastWeekEnd.toISOString().split("T")[0];
        // console.log('Querying between:', startString, '-', endString);
        const q = query(
          collection(db, "ems-attendance", authStore.user.uid, "daily-records"),
          where("date", ">=", startString),
          where("date", "<=", endString)
        );
        const snapshot = await getDocs(q);
        // console.log('Found documents:', snapshot.docs.map(d => d.data()));
        // Create week map
        const summaryMap = new Map();
        for (let i = 0; i < 7; i++) {
          const d = new Date(lastWeekStart);
          d.setUTCDate(lastWeekStart.getUTCDate() + i);
          const dateKey = d.toISOString().split("T")[0];
          summaryMap.set(dateKey, {
            date: dateKey,
            totalSeconds: 0,
            day: d
              .toLocaleDateString("en-US", {
                weekday: "short",
                timeZone: "UTC",
              })
              .split(",")[0],
          });
        }
        // Merge data
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (summaryMap.has(data.date)) {
            summaryMap.set(data.date, {
              ...summaryMap.get(data.date),
              totalSeconds: data.totalSeconds,
            });
          }
        });
        // console.log('Final Summary Data:', Array.from(summaryMap.values()));
        this.weeklySummary = Array.from(summaryMap.values());
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
