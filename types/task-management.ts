export type Status = "todo" | "in-progress" | "done" | "on-hold" | "cancelled";

export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: Status;
  elapsedTime: number;
  priority: Priority;
  assignedTo?: string;
  tagged?: boolean;
}
