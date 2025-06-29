import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase";
import type {
  TaskComment,
  Reply,
  MentionedEmployee,
} from "@/types/task-comments";

export const useCommentsStore = defineStore("comments", {
  state: () => ({
    comments: [] as TaskComment[],
  }),

  actions: {
    async fetchComments(taskId: string) {
      const q = query(
        collection(db, "ems-comments"),
        where("taskId", "==", taskId),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      this.comments = snapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAtDate = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date();
        return {
          id: doc.id,
          uid: data.uid || "",
          author: data.author,
          avatar: data.avatar,
          comment: data.comment || "",
          time: data.time || "some time ago",
          taskId: data.taskId || "",
          createdAt: data.createdAt,
          replies: (data.replies || []).map((reply: any) => ({
            ...reply,
            likes: reply.likes || [],
          })),
          likes: data.likes || [],
          mentionedEmployee: data.mentionedEmployee,
        } as TaskComment;
      });
    },

    async addCommentOrReply(taskId: string, commentHtml: string) {
      // console.log("Raw comment HTML from editor:", JSON.stringify(commentHtml));
      const authStore = useAuthStore();
      const employeesStore = useEmployeesStore();
      const user = authStore.user;
      if (!user?.uid) return;
      let cleanCommentText = "";
      let mentionedEmployee: MentionedEmployee | undefined = undefined;
      // Regular expression to find the mention pattern: @<span ...>Name</span>
      const mentionRegex = /@<span[^>]*>([\w\s]+)<\/span>/g;
      const mentionMatch = commentHtml.match(mentionRegex);
      if (mentionMatch && mentionMatch[0]) {
        const fullMentionHtml = mentionMatch[0];
        const mentionedName = /@<span[^>]*>([\w\s]+)<\/span>/
          .exec(commentHtml)?.[1]
          ?.trim();
        if (mentionedName) {
          // console.log("Regex matched. Mentioned Name:", mentionedName);
          const found = employeesStore.allUsers.find(
            (u) => `${u.firstName} ${u.lastName}`.trim() === mentionedName
          );
          if (found && found.id) {
            mentionedEmployee = {
              uid: found.id,
              name: mentionedName,
            };
            // console.log("Found mentioned employee:", mentionedEmployee);
          } else {
            // console.warn(
            //   `Could not find an employee with the name: "${mentionedName}"`
            // );
          }
        }
        cleanCommentText = commentHtml.replace(fullMentionHtml, "");
      } else {
        cleanCommentText = commentHtml;
      }
      cleanCommentText = cleanCommentText
        .replace(/&nbsp;/g, " ") // Replace all &nbsp; with space
        .replace(/<[^>]+>/g, "") // Remove all HTML tags
        .replace(/\s+/g, " ") // Collapse multiple spaces
        .trim(); // Trim leading/trailing whitespace
      if (cleanCommentText === "" && !mentionedEmployee) return;
      const newCommentData: Omit<TaskComment, "id"> = {
        uid: user.uid,
        author: `${user.firstName || ""} ${user.middleName || ""} ${
          user.lastName || ""
        }`.trim(),
        comment: cleanCommentText, // The final cleaned text
        taskId,
        time: "Just now", // This should be a serverTimestamp
        createdAt: serverTimestamp(),
        // Conditionally add properties
        ...(user.profileImg ? { avatar: user.profileImg } : {}),
        ...(mentionedEmployee ? { mentionedEmployee: mentionedEmployee } : {}),
        replies: [],
      };
      await addDoc(collection(db, "ems-comments"), newCommentData);
      await this.fetchComments(taskId);
    },

    async addReplyTo(commentId: string, replyText: string) {
      const user = useAuthStore().user;
      const reply: Reply = {
        id: Date.now(),
        uid: user?.uid || "",
        author: `${user?.firstName || ""} ${user?.middleName || ""} ${
          user?.lastName || ""
        }`.trim(),
        comment: replyText,
        time: "Just now",
        avatar: user?.profileImg || "",
        createdAt: new Date(),
        likes: [],
      };
      const ref = doc(db, "ems-comments", commentId);
      await updateDoc(ref, {
        replies: arrayUnion(reply),
      });
      const taskId = this.comments.find((c) => c.id === commentId)?.taskId;
      if (taskId) await this.fetchComments(taskId);
    },

    async likeOrDislike(commentId: string) {
      const authStore = useAuthStore();
      const uid = authStore.user?.uid;
      if (!uid) return;
      const commentIndex = this.comments.findIndex((c) => c.id === commentId);
      if (commentIndex === -1) return;
      const comment = this.comments[commentIndex];
      const isLiked = comment.likes?.includes(uid);
      const commentRef = doc(db, "ems-comments", commentId);
      if (isLiked) {
        // Dislike (remove UID from likes)
        await updateDoc(commentRef, {
          likes: arrayRemove(uid),
        });
        this.comments[commentIndex].likes = this.comments[
          commentIndex
        ].likes?.filter((id) => id !== uid);
      } else {
        // Like (add UID to likes)
        await updateDoc(commentRef, {
          likes: arrayUnion(uid),
        });
        if (!this.comments[commentIndex].likes)
          this.comments[commentIndex].likes = [];
        this.comments[commentIndex].likes.push(uid);
      }
    },

    async toggleReplyLike(commentId: string, replyId: number) {
      const authStore = useAuthStore();
      const userId = authStore.user?.uid;
      if (!userId || !commentId) return;
      const commentRef = doc(db, "ems-comments", commentId);
      const comment = this.comments.find((c) => c.id === commentId);
      if (!comment || !comment.replies) return;
      // Find the reply index
      const replyIndex = comment.replies.findIndex((r) => r.id === replyId);
      if (replyIndex === -1) return;
      // Create updated replies array
      const updatedReplies = [...comment.replies];
      // Initialize likes array if needed
      if (!updatedReplies[replyIndex].likes) {
        updatedReplies[replyIndex].likes = [];
      }
      // Check if user has liked this reply
      const isLiked = updatedReplies[replyIndex].likes!.includes(userId);
      // Update likes array
      if (isLiked) {
        updatedReplies[replyIndex].likes = updatedReplies[
          replyIndex
        ].likes!.filter((id) => id !== userId);
      } else {
        updatedReplies[replyIndex].likes = [
          ...updatedReplies[replyIndex].likes!,
          userId,
        ];
      }
      try {
        // Update Firestore
        await updateDoc(commentRef, {
          replies: updatedReplies,
        });
        // Update local state
        const commentIndex = this.comments.findIndex((c) => c.id === commentId);
        if (commentIndex !== -1) {
          this.comments[commentIndex].replies = updatedReplies;
        }
      } catch (error) {
        console.error("Error toggling reply like:", error);
      }
    },
  },
});
