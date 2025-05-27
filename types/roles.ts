// Permission types
type PermissionAction =
  | "view"
  | "add"
  | "edit"
  | "delete"
  | "block"
  | "unblock"
  | "cancel";

export interface PermissionSection {
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  block?: boolean;
  unblock?: boolean;
  cancel?: boolean;
}

export interface Permissions {
  [key: string]: PermissionSection;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permissions;
}

export interface RoleUpdate {
  name?: string;
  permissions?: Permissions;
}
