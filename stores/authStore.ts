import { auth, db } from "~/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface FirestoreTimestamp {
  toDate(): Date;
}

type UserData = {
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
  [key: string]: any;
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as UserData | null,
    error: null as string | null,
    role: null as string | null,
    isOverlayVisible: false,
    loading: false,
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
      }
      this.error = customMessage
        ? `${customMessage}: ${errorMessage}`
        : errorMessage;
      this.loading = false;
      this.isOverlayVisible = false;
      console.error(`Auth error (${errorCode}):`, errorMessage);
      return this.error;
    },

    async init() {
      try {
        this.loading = true;
        await setPersistence(auth, browserLocalPersistence);
        const user = auth.currentUser;
        if (user) {
          await this.fetchUserData(user.uid);
        }
      } catch (error) {
        this.handleError(error, "Failed to initialize authentication");
      } finally {
        this.loading = false;
      }
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
          this.role = userData.role || "user";
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
      role = "user"
    ) {
      this.isOverlayVisible = true;
      this.loading = true;
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        const userData = {
          uid: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          role: role,
          loginType: "email",
          createdAt: new Date(),
        };
        await setDoc(doc(db, "ems-users", user.uid), userData);
        localStorage.setItem("user", JSON.stringify(userData));
        this.role = role;
        await this.fetchUserData(user.uid);
        this.error = null;
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
        await setPersistence(auth, browserLocalPersistence);
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        this.user = user;
        const userDocRef = doc(db, "ems-users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.role = userData?.role || "user";
          const saveUserData = {
            uid: userData.uid,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            loginType: userData.loginType,
          };
          localStorage.setItem("user", JSON.stringify(saveUserData));
        } else {
          this.role = "user";
        }
        await this.fetchUserData(user.uid);
        this.error = null;
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

    async loginWithGoogle() {
      this.isOverlayVisible = true;
      this.loading = true;
      try {
        await setPersistence(auth, browserLocalPersistence);
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        this.user = user;
        const userDocRef = doc(db, "ems-users", user.uid);
        const userDoc = await getDoc(userDocRef);
        let userData;
        if (!userDoc.exists()) {
          userData = {
            uid: user.uid,
            email: user.email,
            firstName: user.displayName?.split(" ")[0] || "FirstName",
            lastName: user.displayName?.split(" ")[1] || "LastName",
            role: "user",
            loginType: "google",
            createdAt: new Date(),
          };
          await setDoc(userDocRef, userData);
        } else {
          userData = userDoc.data();
        }
        const sessionUserData = {
          uid: userData.uid,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          loginType: userData.loginType,
        };
        localStorage.setItem("user", JSON.stringify(sessionUserData));
        this.role = userData.role || "user";
        await this.fetchUserData(user.uid);
        this.error = null;
      } catch (error) {
        this.handleError(error, "Google login failed");
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
          localStorage.removeItem(key);
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

    saveProfile(file: File | null) {
      return new Promise((resolve, reject) => {
        if (!this.user) {
          this.handleError({ message: "User not authenticated" });
          reject(new Error("User not authenticated"));
          return;
        }
        this.loading = true;
        const storage = getStorage();
        const userDocRef = doc(db, "users", this.user.uid);
        let profileImgUrl = this.user.profileImg || null;

        const updateProfile = () => {
          if (!this.user) {
            this.loading = false;
            reject(new Error("User not authenticated"));
            return;
          }
          const updatedProfile: Partial<UserData> = {
            firstName: this.user.firstName || "",
            lastName: this.user.lastName || "",
            email: this.user.email || "",
            phone: this.user.phone || null,
            birthDate: this.user.birthDate || null,
            profileImg: profileImgUrl,
            address: this.user.address || "",
            apartment: this.user.apartment || "",
            selectedCity: this.user.selectedCity || "",
          };

          updateDoc(userDocRef, updatedProfile)
            .then(() => {
              if (this.user) {
                this.user = {
                  ...this.user,
                  ...updatedProfile,
                };
                const sessionUserData = JSON.parse(
                  localStorage.getItem("user") || "{}"
                );
                localStorage.setItem(
                  "user",
                  JSON.stringify({
                    ...sessionUserData,
                    ...updatedProfile,
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
      this.loading = true;
      try {
        await sendPasswordResetEmail(auth, email);
        this.error = null;
        this.loading = false;
        return "Password reset email sent successfully!";
      } catch (error) {
        this.handleError(error, "Failed to send password reset email");
        throw error;
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
  },

  getters: {
    isAuthenticated: (state) => !!state.user,
    isLoading: (state) => state.loading,
    errorMessage: (state) => state.error,
  },
});
