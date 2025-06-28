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
      // Explicitly map Firestore data to the TaskComment interface
      this.comments = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamp to JS Date for 'time' calculation if needed
        // For now, assuming you handle 'time: "Just now"' logic elsewhere or it's just a string
        const createdAtDate = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date();
        // const timeAgo = /* a function to calculate time ago from createdAtDate */; // e.g., using a composable
        return {
          id: doc.id, // required string (comes from doc.id)
          uid: data.uid || "", // required string
          author: data.author, // required string
          avatar: data.avatar, // optional string
          comment: data.comment || "", // required string
          time: data.time || "some time ago", // required string (provide a sensible default)
          taskId: data.taskId || "", // required string
          createdAt: data.createdAt, // optional any (Firestore Timestamp)
          replies: data.replies || [], // optional Reply[]
          mentionedEmployee: data.mentionedEmployee, // optional MentionedEmployee
        } as TaskComment; // Cast after ensuring all required fields are present
      });
      // console.log(
      //   `Fetched ${this.comments.length} comments for task ${taskId}`
      // );
    },

    async addCommentOrReply(taskId: string, commentHtml: string) {
      // console.log("Raw comment HTML from editor:", JSON.stringify(commentHtml));
      const authStore = useAuthStore();
      const employeesStore = useEmployeesStore();
      const user = authStore.user;
      if (!user?.uid) {
        // console.error("Cannot add comment: User not authenticated.");
        return;
      }
      let cleanCommentText = "";
      let mentionedEmployee: MentionedEmployee | undefined = undefined;
      // Regular expression to find the mention pattern: @<span ...>Name</span>
      const mentionRegex = /@<span[^>]*>([\w\s]+)<\/span>/g; // Use global flag to handle multiple (though we only process first for now)
      const mentionMatch = commentHtml.match(mentionRegex);
      if (mentionMatch && mentionMatch[0]) {
        // --- Logic for comments WITH a mention ---
        const fullMentionHtml = mentionMatch[0]; // The entire matched string, e.g., "@<span...>Amr</span>"
        // Extract the name from the first capture group of the first match
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
            console.warn(
              `Could not find an employee with the name: "${mentionedName}"`
            );
          }
        }
        // Remove the mention HTML part to get the remaining text
        cleanCommentText = commentHtml.replace(fullMentionHtml, "");
      } else {
        // --- Logic for comments WITHOUT a mention ---
        cleanCommentText = commentHtml;
      }
      cleanCommentText = cleanCommentText
        .replace(/&nbsp;/g, " ") // Replace all &nbsp; with space
        .replace(/<[^>]+>/g, "") // Remove all HTML tags
        .replace(/\s+/g, " ") // Collapse multiple spaces
        .trim(); // Trim leading/trailing whitespace
      // console.log("Final Cleaned Comment:", cleanCommentText);
      // console.log("Final Mentioned Employee:", mentionedEmployee);
      // If the final comment text is empty AND no one was mentioned, do not proceed.
      if (cleanCommentText === "" && !mentionedEmployee) {
        // console.log("Skipping save because comment is effectively empty.");
        return;
      }
      // Build the comment object to store in Firestore
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
      // console.log("Saving new comment object to Firestore:", newCommentData);
      await addDoc(collection(db, "ems-comments"), newCommentData);
      await this.fetchComments(taskId); // Refresh
    },

    addReplyTo(commentId: string | number, replyText: string) {
      const user = useAuthStore().user;
      const reply: Reply = {
        id: Date.now(),
        uid: user?.uid || "",
        author: user?.displayName,
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
