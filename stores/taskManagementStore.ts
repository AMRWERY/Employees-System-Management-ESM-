import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { Task } from "@/types/task-management";

export const useTaskManagementStore = defineStore("task-management", {
  state: () => ({
    tasks: [] as Task[],
  }),

  actions: {
    async fetchTasks() {
      const snapshot = await getDocs(collection(db, "ems-task-management"));
      this.tasks = snapshot.docs.map((doc) => ({
        ...(doc.data() as Task),
        id: doc.id,
      }));
    },

    async addTask(task: Omit<Task, "id">) {
      const authStore = useAuthStore();
      const taskWithUser = {
        ...task,
        userId: authStore.user ? authStore.user.uid : null,
      };
      const docRef = await addDoc(
        collection(db, "ems-task-management"),
        taskWithUser
      );
      this.tasks.push({ ...task, id: docRef.id });
    },

    async updateTask(taskId: string, updatedFields: Partial<Task>) {
      try {
        const taskRef = doc(db, "ems-task-management", taskId);
        await updateDoc(taskRef, {
          ...updatedFields,
          updatedAt: Timestamp.now(),
        });
        // Update local state
        const index = this.tasks.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          this.tasks[index] = { ...this.tasks[index], ...updatedFields };
        }
      } catch (error) {
        console.error("Error updating task:", error);
      }
    },

    async updateTaskElapsedTime(taskId: string, elapsedTime: number) {
      try {
        const taskRef = doc(db, "ems-task-management", taskId);
        await updateDoc(taskRef, {
          elapsedTime,
          updatedAt: Timestamp.now(),
        });
        // Update local state
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
          task.elapsedTime = elapsedTime;
        }
      } catch (error) {
        console.error("Error updating elapsed time:", error);
      }
    },

    async deleteTask(taskId: string) {
      await deleteDoc(doc(db, "ems-task-management", taskId));
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
    },
  },
});
