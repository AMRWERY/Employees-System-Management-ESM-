export interface LeaveRequest {
  id?: string;
  userId: string;
  employeeId: string;
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
  managerId?: string;
  teamId?: string;
  decisionAt?: Date | null;
  decisionBy?: string;
  rejectionReason?: string;
  availableBalance?: number | null;
}
