export interface LeaveRequest {
  id?: string;
  userId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  type: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  submittedAt: Date;
  durationDays: number;
  attachments?: string[];
  manager?: string;
  decisionAt?: Date;
  decisionBy?: string;
}
