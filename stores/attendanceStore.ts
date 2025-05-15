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

interface WeekRecord {
  id: string;
  date: string;
  clockIns: Timestamp[];
  clockOuts: Timestamp[];
  totalSeconds: number;
  uid: string;
  role: string;
}

interface WeekSummaryRecord {
  date: string;
  day: string;
  totalSeconds: number;
}

interface MonthlyRecord {
  date: string;
  totalSeconds: number;
}

interface AttendanceState {
  todayRecord: DailyAttendance | null;
  weeklySummary: WeekSummaryRecord[];
  monthlySummary: MonthlyRecord[];
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
    monthlySummary: [],
    loading: false,
    error: null,
  }),

  getters: {
    clockedIn: (state) =>
      state.todayRecord
        ? state.todayRecord.clockIns.length > state.todayRecord.clockOuts.length
        : false,

    formattedTodayEntries: (state) => {
      if (!state.todayRecord) return [];

      return state.todayRecord.clockIns.map((clockIn, index) => ({
        time: clockIn.toDate(),
        type: "in",
        ...(state.todayRecord?.clockOuts[index] && {
          clockOut: state.todayRecord.clockOuts[index].toDate(),
        }),
      }));
    },
  },

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
      try {
        this.loading = true;
        const auth = useAuthStore();
        if (!auth.user?.uid) {
          throw new Error('User not authenticated');
        }

        const now = new Date();
        const today = now.getDay(); // 0-6, where 0 is Sunday
        const firstDay = new Date(now);
        firstDay.setDate(now.getDate() - 6); // Get 6 days before today
        firstDay.setHours(0, 0, 0, 0);

        const lastDay = new Date(now); // Today
        lastDay.setHours(23, 59, 59, 999);

        const attendanceRef = collection(db, 'attendance');
        const q = query(
          attendanceRef,
          where('userId', '==', auth.user.uid),
          where('date', '>=', firstDay.toISOString().split('T')[0]),
          where('date', '<=', lastDay.toISOString().split('T')[0])
        );

        const querySnapshot = await getDocs(q);
        const records: Record<string, DailyAttendance> = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as DailyAttendance;
          records[data.date] = data;
        });

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        this.weeklySummary = Array(7)
          .fill(null)
          .map((_, index) => {
            const date = new Date(firstDay);
            date.setDate(firstDay.getDate() + index);
            const dateString = date.toISOString().split('T')[0];
            const record = records[dateString];

            return {
              date: dateString,
              day: days[date.getDay()],
              totalSeconds: record?.totalSeconds || 0,
            };
          });
      } catch (error) {
        console.error("Error fetching weekly summary:", error);
        this.error = "Failed to fetch weekly summary";
      } finally {
        this.loading = false;
      }
    },

    async fetchMonthlySummary(year: number, month: number) {
      try {
        this.loading = true;
        const auth = useAuthStore();
        if (!auth.user?.uid) {
          throw new Error('User not authenticated');
        }

        // Create start and end dates for the month
        const startDate = new Date(year, month - 1, 1); // month is 1-based
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(year, month, 0); // Last day of the month
        endDate.setHours(23, 59, 59, 999);

        const attendanceRef = collection(db, 'attendance');
        const q = query(
          attendanceRef,
          where('userId', '==', auth.user.uid),
          where('date', '>=', startDate.toISOString().split('T')[0]),
          where('date', '<=', endDate.toISOString().split('T')[0])
        );

        const querySnapshot = await getDocs(q);
        const monthData: MonthlyRecord[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as DailyAttendance;
          return {
            date: data.date,
            totalSeconds: data.totalSeconds || 0
          };
        });

        this.monthlySummary = monthData;
      } catch (error) {
        console.error("Error fetching monthly summary:", error);
        this.error = "Failed to fetch monthly summary";
      } finally {
        this.loading = false;
      }
    }
  }
});
