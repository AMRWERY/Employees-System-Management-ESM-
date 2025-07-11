import type { LeaveRequest } from "@/types/leaveRequest";

export interface Tab<T extends string = string> {
  id: T
  label: string
}

// export interface Tab {
//   id: LeaveRequest["status"] | "all";
//   label: string;
// }
