import { db } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  WriteBatch,
} from "firebase/firestore";

// Permission types
type PermissionAction = "view" | "add" | "edit" | "delete" | "cancel";
type PermissionSection = Record<PermissionAction, boolean>;
type Permissions = Record<string, PermissionSection>;

// Role interface
interface Role {
  id: string;
  name: string;
  permissions: Permissions;
}

interface RoleUpdate {
  name?: string;
  permissions?: Permissions;
}

// Default permissions structure
// interface DefaultPermissions {
//   dashboard: { view: boolean };
//   employees: { view: boolean; add: boolean; edit: boolean; delete: boolean, block: boolean, unblock: boolean };
//   orders: { view: boolean; cancel: boolean };
//   users: { view: boolean; edit: boolean };
// }

export const useRolesStore = defineStore("roles", {
  state: () => ({
    roles: [] as Role[],
    // defaultPermissions: {} as DefaultPermissions,
  }),

  actions: {
    async fetchRoles() {
      const querySnapshot = await getDocs(collection(db, "ems-roles"));
      this.roles = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Role, "id">),
      }));
    },

    async createRole(roleData: { name: string; permissions?: Permissions }) {
      const docRef = doc(collection(db, "ems-roles"));
      await setDoc(docRef, {
        name: roleData.name,
        permissions: roleData.permissions,
      });
      await this.fetchRoles();
    },

    async deleteRole(roleId: string) {
      const docRef = doc(db, "ems-roles", roleId);
      await deleteDoc(docRef);
      await this.fetchRoles();
    },

    getRolePermissions(roleId: string): Permissions {
      const role = this.roles.find((r) => r.id === roleId);
      return role?.permissions || {};
    },

    async updateRoleAndSyncUsers(roleId: string, updates: RoleUpdate) {
      try {
        //Update the role document
        const roleRef = doc(db, "ems-roles", roleId);
        const flattenedUpdates = Object.entries(updates).reduce(
          (acc, [key, value]) => {
            if (typeof value === "object" && value !== null) {
              Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                acc[`${key}.${nestedKey}`] = nestedValue;
              });
            } else {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, any>
        );
        await updateDoc(roleRef, flattenedUpdates);
        //Get all users with this role
        const usersQuery = query(
          collection(db, "ems-users"),
          where("roleId", "==", roleId)
        );
        const querySnapshot = await getDocs(usersQuery);
        //update users
        let batch: WriteBatch = writeBatch(db);
        const MAX_BATCH_SIZE = 500;
        let operationCount = 0;
        for (const userDoc of querySnapshot.docs) {
          if (operationCount === MAX_BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
          }
          const userRef = doc(db, "ems-users", userDoc.id);
          batch.update(userRef, { permissions: updates.permissions });
          operationCount++;
        }
        if (operationCount > 0) await batch.commit();
        return {
          success: true,
          affectedUsers: querySnapshot.size,
        };
      } catch (error) {
        // console.error("Update failed:", error);
        throw error;
      }
    },
  },

  getters: {
    roleOptions: (state) =>
      state.roles.map((role) => ({
        value: role.id,
        label: role.name,
      })),

      getRoleByName: (state) => (name: string) => {
    return state.roles.find(role => role.name.toLowerCase() === name.toLowerCase());
  }
  },
});
