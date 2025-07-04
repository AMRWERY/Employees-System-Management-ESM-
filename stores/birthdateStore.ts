import { db } from "~/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";

export const useBirthdateStore = defineStore("birthdate", {
  state: () => ({
    todaysBirthdays: [] as {
      id: string;
      firstName: string;
      lastName: string;
      profileImg: string | null;
    }[],
    loading: false,
    error: null as string | null,
    currentIndex: 0, // For carousel navigation
  }),

  actions: {
    async checkTodaysBirthdays() {
      this.loading = true;
      this.error = null;
      this.todaysBirthdays = [];
      this.currentIndex = 0;
      try {
        const usersRef = collection(db, "ems-users");
        const snapshot = await getDocs(usersRef);
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();
        snapshot.docs.forEach((doc) => {
          const userData = doc.data();
          if (userData.birthDate) {
            let birthDate: Date | null = null;
            if (userData.birthDate instanceof Timestamp) {
              birthDate = userData.birthDate.toDate();
            } else if (typeof userData.birthDate === "string") {
              const [year, month, day] = userData.birthDate
                .split("-")
                .map(Number);
              birthDate = new Date(year, month - 1, day);
            } else if (userData.birthDate instanceof Date) {
              birthDate = userData.birthDate;
            }
            if (birthDate instanceof Date && !isNaN(birthDate.getTime())) {
              if (
                birthDate.getMonth() === todayMonth &&
                birthDate.getDate() === todayDate
              ) {
                this.todaysBirthdays.push({
                  id: doc.id,
                  firstName: userData.firstName || "",
                  lastName: userData.lastName || "",
                  profileImg: userData.profileImg || null,
                });
              }
            }
          }
        });
      } catch (error: any) {
        this.error = error.message || "Failed to check birthdays";
        // console.error("Birthdate check error:", error);
      } finally {
        this.loading = false;
      }
    },

    nextEmployee() {
      this.currentIndex = (this.currentIndex + 1) % this.todaysBirthdays.length;
    },

    prevEmployee() {
      this.currentIndex =
        (this.currentIndex - 1 + this.todaysBirthdays.length) %
        this.todaysBirthdays.length;
    },
  },

  getters: {
    currentEmployee: (state) => {
      return state.todaysBirthdays.length > 0
        ? state.todaysBirthdays[state.currentIndex]
        : null;
    },

    hasMultipleEmployees: (state) => state.todaysBirthdays.length > 1,
  },
});
