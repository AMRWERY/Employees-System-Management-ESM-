export interface FirestoreTimestamp {
  toDate(): Date;
}

export type UserData = {
  [key: string]: any;
  uid: string;
  email: string | null;
  firstName?: string;
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
  employeeId?: string; // Add the employeeId field
};

export interface AuthState {
  user: UserData | null;
  error: string | null;
  role: string | null;
  isOverlayVisible: boolean;
  loading: boolean;
  welcomeType: "signup" | "login" | null;
}
