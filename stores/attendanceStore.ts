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
import type {
  DailyAttendance,
  MonthlyRecord,
  AttendanceState,
} from "@/types/attendance";

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

const getUTCDateString = (date?: Date) => {
  const now = date || new Date();
  // Always use start of day in user's timezone to ensure consistent date handling
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDate = new Date(
    now.toLocaleString("en-US", { timeZone: userTimezone })
  );
  localDate.setHours(0, 0, 0, 0);
  return localDate.toISOString().split("T")[0];
};

export const useAttendanceStore = defineStore("attendance", {
  state: (): AttendanceState => ({
    todayRecord: null,
    weeklySummary: [],
    monthlySummary: [],
    loading: false,
    error: null,
  }),

  actions: {
    async clockIn() {
      const authStore = useAuthStore();
      if (!authStore.user) throw new Error("User not authenticated");
      this.loading = true;
      try {
        const currentTime = new Date();
        const date = getUTCDateString(currentTime);
        const docRef = doc(
          db,
          "ems-attendance",
          authStore.user.uid,
          "daily-records",
          date
        );
        // First get the existing record
        const docSnap = await getDoc(docRef);
        const clockInTime = Timestamp.fromDate(currentTime);
        if (docSnap.exists()) {
          // Document exists, just add new clock in
          await updateDoc(docRef, {
            clockIns: arrayUnion(clockInTime),
          });
        } else {
          // Create new document
          await setDoc(
            docRef,
            {
              date,
              uid: authStore.user.uid,
              role: authStore.user.role || "employee",
              clockIns: [clockInTime],
              clockOuts: [],
              totalSeconds: 0,
            },
            { merge: true }
          );
        }
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
      if (!authStore.user) throw new Error("User not authenticated");
      this.loading = true;
      try {
        // Get start and end of past week
        const today = new Date();
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() - 1); // Yesterday
        const startOfWeek = new Date(endOfWeek);
        startOfWeek.setDate(endOfWeek.getDate() - 6); // 7 days before yesterday
        // Initialize weekly summary
        this.weeklySummary = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          return {
            date: getUTCDateString(date),
            day: date.toLocaleString("en-US", { weekday: "short" }),
            totalSeconds: 0,
          };
        });
        // Fetch attendance records for the week
        const q = query(
          collection(db, "ems-attendance", authStore.user.uid, "daily-records"),
          where("date", ">=", getUTCDateString(startOfWeek)),
          where("date", "<=", getUTCDateString(endOfWeek))
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const dayIndex = this.weeklySummary.findIndex(
            (day) => day.date === data.date
          );
          if (dayIndex !== -1) {
            this.weeklySummary[dayIndex].totalSeconds = data.totalSeconds || 0;
          }
        });
      } catch (error) {
        this.handleError(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchMonthlySummary(year: number, month: number) {
      try {
        this.loading = true;
        const auth = useAuthStore();
        if (!auth.user?.uid) {
          throw new Error("User not authenticated");
        }
        const startDate = new Date(year, month - 1, 1); // month is 1-based
        startDate.setHours(0, 0, 0, 0);
        // Get last day of the current month
        const endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59, 999); // Get the collection of daily records for this user
        const dailyRecordsRef = collection(
          db,
          "ems-attendance",
          auth.user.uid,
          "daily-records"
        );
        const q = query(
          dailyRecordsRef,
          where("date", ">=", startDate.toISOString().split("T")[0]),
          where("date", "<=", endDate.toISOString().split("T")[0])
        );
        const querySnapshot = await getDocs(q);
        const monthData: MonthlyRecord[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as DailyAttendance;
          let totalSeconds = 0;
          // Calculate total seconds from all clock in/out pairs
          if (data.clockIns && data.clockOuts) {
            for (
              let i = 0;
              i < Math.min(data.clockIns.length, data.clockOuts.length);
              i++
            ) {
              const clockIn = data.clockIns[i];
              const clockOut = data.clockOuts[i];
              totalSeconds += calculateDurationInSeconds(clockIn, clockOut);
            }
          }
          return {
            date: data.date,
            totalSeconds: totalSeconds,
          };
        });
        this.monthlySummary = monthData;
      } catch (error) {
        console.error("Error fetching monthly summary:", error);
        this.error = "Failed to fetch monthly summary";
      } finally {
        this.loading = false;
      }
    },
  },

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
});
