import type { LeaveRequest } from "@/types/leaveRequest";

export interface Tab {
  id: LeaveRequest["status"] | "all";
  label: string;
}
