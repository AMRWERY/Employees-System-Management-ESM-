export interface MentionedEmployee {
  uid: string;
  name: string;
}

export interface Reply {
  id: number;
  uid: string;
  author: string;
  avatar: string;
  comment: string;
  time: string;
}

export interface TaskComment {
  id?: string; // Firestore document ID
  uid: string; // Commenter UID
  author: string; // Commenter name
  avatar?: string; // Avatar URL
  comment: string; // The comment text
  time: string; // Display-friendly time string (e.g. "Just now")
  taskId: string; // Associated task ID
  createdAt?: any; // ✅ Firestore timestamp (optional)
  replies?: Reply[]; // Nested replies
  mentionedEmployee?: MentionedEmployee;
}
