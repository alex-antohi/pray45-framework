export interface AccessRole {
  readonly key: string;
  readonly rank: number;
}

/** What the signed-in user can do, as resolved by the database. */
export interface AccessSnapshot {
  readonly role: AccessRole | null;
  readonly permissions: readonly string[];
}

/** One permission, or any of several. */
export type AccessRule = string | { readonly anyOf: readonly string[] };

export const NO_ACCESS: AccessSnapshot = { role: null, permissions: [] };

/** The permission needed to manage accounts of a role. */
export function managePermission(roleKey: string): string {
  return `${roleKey}.manage`;
}
