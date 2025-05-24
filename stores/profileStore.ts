import { db, auth } from "@/firebase";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { useAuthStore } from "./authStore";

export const useProfileStore = defineStore("profile", {
  state: () => ({
    imagePreviewUrl: "" as string,
    loading: false,
    error: null as string | null,
    passwordUpdateLoading: false,
  }),

  actions: {
    async initializeProfileImage() {
      const authStore = useAuthStore();
      // First check if the auth user has a profile image
      if (authStore.user?.profileImg) {
        this.imagePreviewUrl = authStore.user.profileImg;
      }
      this.ensureProfileImagePersistence();
    },

    async uploadImage(file: File) {
      const authStore = useAuthStore();
      this.loading = true;
      this.error = null;
      try {
        if (!authStore.user) throw new Error("User not authenticated");
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `profile-images/${authStore.user.uid}/${file.name}`
        );
        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        // Update Firestore
        const userDocRef = doc(db, "ems-users", authStore.user.uid);
        await updateDoc(userDocRef, {
          profileImg: downloadURL,
        });
        // Update local state
        this.imagePreviewUrl = downloadURL;
        authStore.user.profileImg = downloadURL;
        this.updateSessionStorage(downloadURL);
        return downloadURL;
      } catch (error) {
        this.handleError(error, "Image upload failed");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeImage() {
      const authStore = useAuthStore();
      this.loading = true;
      this.error = null;
      try {
        if (!authStore.user?.profileImg) return;
        const storage = getStorage();
        const imageRef = ref(storage, authStore.user.profileImg);
        // Delete from storage
        await deleteObject(imageRef);
        // Update Firestore
        const userDocRef = doc(db, "ems-users", authStore.user.uid);
        await updateDoc(userDocRef, {
          profileImg: null,
        });
        // Update local state
        this.imagePreviewUrl = "";
        authStore.user.profileImg = null;
        this.updateSessionStorage(null);
      } catch (error) {
        this.handleError(error, "Image removal failed");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    updateSessionStorage(imageUrl: string | null) {
      const authStore = useAuthStore();
      if (authStore.user) {
        // Get current user from sessionStorage
        const sessionUser = JSON.parse(sessionStorage.getItem("user") || "{}");
        // Update profileImg in sessionStorage
        sessionUser.profileImg = imageUrl;
        sessionStorage.setItem("user", JSON.stringify(sessionUser));
        // Also ensure auth user object is updated
        authStore.user.profileImg = imageUrl;
      }
    },

    // Called on app initialization to ensure profile image is preserved
    ensureProfileImagePersistence() {
      const authStore = useAuthStore();
      const sessionUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      // If session has profile image but authStore doesn't, update authStore
      if (
        sessionUser?.profileImg &&
        authStore.user &&
        !authStore.user.profileImg
      ) {
        authStore.user.profileImg = sessionUser.profileImg;
        this.imagePreviewUrl = sessionUser.profileImg;
      }
      // If authStore has profile image but session doesn't, update session
      if (
        authStore.user?.profileImg &&
        sessionUser &&
        !sessionUser.profileImg
      ) {
        this.updateSessionStorage(authStore.user.profileImg);
        this.imagePreviewUrl = authStore.user.profileImg;
      }
    },

    handleError(error: unknown, context: string) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.error = `${context}: ${errorMessage}`;
      console.error(this.error);
    },

    async updateUserPassword(newPassword: string) {
      if (!auth.currentUser) throw new Error("User not authenticated");
      this.passwordUpdateLoading = true;
      this.error = null;
      try {
        // Try to update password - this will likely fail with auth/requires-recent-login
        // for security reasons, but we need to try it first
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
      } catch (error: any) {
        // Capture the error code
        const errorCode = error.code || "";
        // Handle requires-recent-login specially
        if (errorCode === "auth/requires-recent-login") {
          // Return a special result object indicating this specific error
          // so the component can handle it appropriately
          return {
            success: false,
            requiresRecentLogin: true,
            error,
          };
        }
        // For other errors, handle normally
        this.handleError(error, "Password update failed");
        throw error;
      } finally {
        this.passwordUpdateLoading = false;
      }
    },
  },
});
