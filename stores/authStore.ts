import { auth, db } from "~/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  // deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { UserData } from "@/types/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as UserData | null,
    error: null as string | null,
    role: null as string | null,
    isOverlayVisible: false,
    loading: false,
    welcomeType: null as "signup" | "login" | null,
    // showWelcomeToast: false,
  }),

  actions: {
    handleError(
      error: { code?: string; message?: string } | Error | unknown,
      customMessage = ""
    ) {
      const errorCode = (error as any).code || "";
      let errorMessage = (error as any).message || "An unknown error occurred";
      // Map Firebase auth error codes to user-friendly messages
      switch (errorCode) {
        case "auth/email-already-in-use":
          errorMessage =
            "This email is already registered. Try logging in instead.";
          break;
        case "auth/invalid-email":
          errorMessage = "The email address is not valid.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters.";
          break;
        case "auth/popup-closed-by-user":
          errorMessage =
            "Sign-in popup was closed before completing the operation.";
          break;
        case "auth/requires-recent-login":
          errorMessage =
            "This operation requires recent authentication. Please log in again.";
          break;
        case "auth/network-request-failed":
          errorMessage =
            "Network error. Please check your internet connection.";
          break;
        case "permission-denied":
          errorMessage = "You don't have permission to perform this action";
          break;
      }
      this.error = customMessage
        ? `${customMessage}: ${errorMessage}`
        : errorMessage;
      this.loading = false;
      this.isOverlayVisible = false;
      // console.error(`Error: ${this.error}`, error);
      return this.error;
    },

    async init() {
      try {
        this.loading = true;
        await setPersistence(auth, browserSessionPersistence);
        return new Promise<void>(async (resolve) => {
          const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe();
            if (user) {
              // Retry mechanism for document read
              let retries = 3;
              while (retries > 0) {
                try {
                  await this.fetchUserData(user.uid);
                  break;
                } catch (error) {
                  retries--;
                  if (retries === 0) {
                    await this.createBasicUserDocument(user);
                  }
                  await new Promise((r) => setTimeout(r, 1000));
                }
              }
              // Session storage update
              sessionStorage.setItem(
                "user",
                JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  firstName: this.user?.firstName,
                  lastName: this.user?.lastName,
                  birthDate: this.user?.birthDate,
                  role: this.role,
                  roledId: this.user?.roledId,
                  permissions: this.user?.permissions,
                  employeeId: this.user?.employeeId,
                  managerId: this.user?.managerId,
                  teamId: this.user?.teamId,
                  base_salary: this.user?.base_salary,
                  // netSalary: this.user?.netSalary,
                })
              );
            }
            resolve();
          });
        });
      } catch (error) {
        this.handleError(error, "Initialization failed");
      } finally {
        this.loading = false;
      }
    },

    async createBasicUserDocument(user: UserData) {
      await setDoc(doc(db, "ems-users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: "employee",
        createdAt: serverTimestamp(),
        birthDate: null,
      });
    },

    async fetchUserData(uid: string) {
      try {
        this.loading = true;
        const userDocRef = doc(db, "ems-users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          if (
            userData.birthDate &&
            typeof userData.birthDate !== "string" &&
            "toDate" in userData.birthDate
          ) {
            const date = userData.birthDate.toDate();
            userData.birthDate = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          }
          this.user = userData;
          this.role = userData.role || "employee";
        } else {
          throw new Error("User data not found");
        }
      } catch (error) {
        this.handleError(error, "Failed to fetch user data");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async registerUser(
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      role = "employee",
      base_salary = 0
    ) {
      this.isOverlayVisible = true;
      this.loading = true;
      try {
        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const rolesRef = collection(db, "ems-roles");
        const q = query(rolesRef, where("name", "==", role));
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error("Role document not found");
        }
        const roleDoc = snap.docs[0];
        const roleData = roleDoc.data();
        const user = userCredential.user; // Generate random 4-digit number for employee ID
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const employeeId = `ems-${randomNum}`;
        const userData = {
          uid: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          employeeId: employeeId,
          role: role || "employee",
          loginType: "email",
          createdAt: new Date(),
          roledId: roleDoc.id,
          permissions: roleData.permissions,
          base_salary: base_salary,
        };
        await setDoc(doc(db, "ems-users", user.uid), {
          ...userData,
          uid: user.uid,
        });
        sessionStorage.setItem("user", JSON.stringify(userData));
        this.role = role;
        await this.fetchUserData(user.uid);
        this.error = null;
        this.setWelcomeType("signup");
        return user;
      } catch (error) {
        this.handleError(error, "Registration failed");
        throw error;
      } finally {
        this.loading = false;
        this.isOverlayVisible = false;
      }
    },

    async loginUser(email: string, password: string) {
      this.isOverlayVisible = true;
      this.loading = true;
      try {
        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        // Check if user is blocked in Firestore
        const userDocRef = doc(db, "ems-users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.status === "blocked") {
            await signOut(auth);
            throw new Error(
              "Your account has been blocked. Please contact an administrator."
            );
          }
          this.role = userData?.role || "employee";
          this.user = user;
          const saveUserData = {
            uid: userData.uid,
            email: userData.email,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            role: userData.role,
            status: userData.status,
            loginType: userData.loginType,
            roledId: userData.roledId,
            permissions: userData.permissions,
            employeeId: userData.employeeId,
            base_salary: userData.base_salary || 0,
          };
          sessionStorage.setItem("user", JSON.stringify(saveUserData));
        } else {
          this.role = "employee";
          this.user = user;
        }
        await this.fetchUserData(user.uid);
        this.error = null;
        this.setWelcomeType("login");
      } catch (error) {
        this.handleError(error, "Login failed");
        throw error;
      } finally {
        this.loading = false;
        setTimeout(() => {
          this.isOverlayVisible = false;
        }, 3000);
      }
    },

    async logoutUser() {
      this.isOverlayVisible = true;
      this.loading = true;
      try {
        await signOut(auth);
        this.user = null;
        this.role = null;
        this.error = null;
        ["user"].forEach((key) => {
          sessionStorage.removeItem(key);
        });
      } catch (error) {
        this.handleError(error, "Logout failed");
        throw error;
      } finally {
        this.loading = false;
        setTimeout(() => {
          this.isOverlayVisible = false;
        }, 3000);
      }
    },

    async saveProfile(file: File | null, birthDate?: string | null) {
      return new Promise((resolve, reject) => {
        if (!this.user) {
          this.handleError({ message: "User not authenticated" });
          reject(new Error("User not authenticated"));
          return;
        }
        this.loading = true;
        const storage = getStorage();
        const userDocRef = doc(db, "ems-users", this.user.uid);
        let profileImgUrl = this.user.profileImg || null;
        // Add birthDate to update payload
        const updateProfile = () => {
          if (!this.user) {
            this.loading = false;
            reject(new Error("User not authenticated"));
            return;
          }
          const updatedProfile: Partial<UserData> = {
            // ...existing properties
            birthDate:
              birthDate !== undefined ? birthDate : this.user.birthDate || null,
          };
          // Rest of the update logic remains the same
          updateDoc(userDocRef, updatedProfile)
            .then(() => {
              // Update local state including birthDate
              if (this.user) {
                this.user = {
                  ...this.user,
                  ...updatedProfile,
                  birthDate:
                    birthDate !== undefined ? birthDate : this.user.birthDate,
                };
                // Update sessionStorage with birthDate
                const sessionUserData = JSON.parse(
                  sessionStorage.getItem("user") || "{}"
                );
                sessionStorage.setItem(
                  "user",
                  JSON.stringify({
                    ...sessionUserData,
                    ...updatedProfile,
                    birthDate:
                      birthDate !== undefined ? birthDate : this.user.birthDate,
                    profileImg: profileImgUrl,
                  })
                );
              }
              this.loading = false;
              this.error = null;
              resolve("Profile updated successfully");
            })
            .catch((error) => {
              this.loading = false;
              this.handleError(error, "Failed to update profile");
              reject(error);
            });
        };
        // File upload logic remains the same
        if (file) {
          const storageRef = ref(
            storage,
            `ems-users/${this.user.uid}/${file.name}`
          );
          uploadBytes(storageRef, file)
            .then(() => getDownloadURL(storageRef))
            .then((url) => {
              profileImgUrl = url;
              updateProfile();
            })
            .catch((error) => {
              this.loading = false;
              this.handleError(error, "Failed to upload profile image");
              reject(error);
            });
        } else {
          updateProfile();
        }
      });
    },

    async resetPassword(email: string) {
      email = email.toLowerCase();
      this.loading = true;
      try {
        await sendPasswordResetEmail(auth, email);
        this.error = null;
        return "Password reset email sent successfully! Please check your email to reset your password.";
      } catch (error) {
        this.handleError(error, "Failed to send password reset email");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async changePassword(currentPassword: string, newPassword: string) {
      this.loading = true;
      const user = auth.currentUser;
      if (!user) {
        this.handleError({ message: "User is not authenticated" });
        return Promise.reject(new Error("User is not authenticated"));
      }
      try {
        // Re-authenticate user before changing password
        if (!user.email) {
          throw new Error("User email is missing");
        }
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        // Update password
        await updatePassword(user, newPassword);
        this.error = null;
        this.loading = false;
        return "Password updated successfully!";
      } catch (error) {
        this.handleError(error, "Failed to change password");
        return Promise.reject(error);
      }
    },

    setWelcomeType(type: "signup" | "login"): void {
      this.welcomeType = type;
    },

    clearWelcomeType(): void {
      this.welcomeType = null;
    },
  },

  getters: {
    isAuthenticated: (state) => !!state.user,

    isLoading: (state) => state.loading,

    errorMessage: (state) => state.error,
  },
});
