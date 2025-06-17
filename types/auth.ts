export interface FirestoreTimestamp {
  toDate(): Date;
}

export type UserData = {
  [key: string]: any;
  uid: string;
  email: string | null;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  role?: string;
  profileImg?: string | null;
  phone?: string | null;
  birthDate?: string | FirestoreTimestamp | null;
  address?: string;
  apartment?: string;
  selectedCity?: string;
  loginType?: string;
  createdAt?: Date | FirestoreTimestamp;
  roledId?: string;
  permissions?: Record<string, any>;
  employeeId?: string;
  managerId?: string;
  teamId?: string;
  base_salary?: number;
  // netSalary: number;
};

export interface AuthState {
  user: UserData | null;
  error: string | null;
  role: string | null;
  isOverlayVisible: boolean;
  loading: boolean;
  welcomeType: "signup" | "login" | null;
}
