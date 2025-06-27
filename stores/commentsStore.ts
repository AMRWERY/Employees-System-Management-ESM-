import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { TaskComment, Reply } from "@/types/task-comments";

export const useCommentsStore = defineStore("comments", {
  state: () => ({
    comments: [] as any[],
  }),

  actions: {
    async fetchComments(taskId: string) {
      const q = query(
        collection(db, "ems-comments"),
        where("taskId", "==", taskId),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      this.comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    },

    async addCommentOrReply(taskId: string, commentText: string) {
      const authStore = useAuthStore();
      const employeesStore = useEmployeesStore();
      const user = authStore.user;
      // ✅ 1. Extract mention info and clean comment text
      const mentionRegex = /<span[^>]*>(.*?)<\/span>&nbsp;/;
      const match = commentText.match(mentionRegex);
      let cleanComment = commentText.replace(mentionRegex, "").trim();
      let mentionedEmployee;
      if (match) {
        const name = match[1]; // E.g., "Amr Mohamed Sayed"
        const found = employeesStore.allUsers.find(
          (user) => user.fullName === name
        );
        if (found) {
          mentionedEmployee = {
            uid: found.id,
            name: found.fullName,
          };
        }
      }
      // ✅ 2. Build comment object to store in Firestore
      const newComment: TaskComment = {
        uid: user?.uid || "",
        author:
          user && user.firstName && user.middleName
            ? user.firstName + " " + user.middleName
            : "Anonymous",
        comment: cleanComment,
        taskId,
        time: "Just now",
        createdAt: serverTimestamp(),
        ...(user?.photoURL ? { avatar: user.photoURL } : {}),
        ...(mentionedEmployee ? { mentionedEmployee } : {}),
      };
      // ✅ 3. Save to Firestore
      await addDoc(collection(db, "ems-comments"), newComment);
      // ✅ 4. Refresh local state
      await this.fetchComments(taskId);
    },

    addReplyTo(commentId: string | number, replyText: string) {
      const user = useAuthStore().user;
      const reply: Reply = {
        id: Date.now(),
        uid: user?.uid || "",
        author: user?.displayName || "Anonymous",
        avatar: user?.photoURL || "/dummy-profile-img.jpg",
        comment: replyText,
        time: "Just now",
      };
      const comment = this.comments.find((c) => c.id === commentId);
      if (comment) {
        comment.replies = comment.replies || [];
        comment.replies.push(reply);
      }
    },
  },
});
