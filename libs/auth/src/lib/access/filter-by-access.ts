import { AccessRule } from './access.model';

export interface AccessControlled<T> {
  readonly access?: AccessRule;
  readonly children?: readonly T[];
}

/** Keeps the items a user may see, and drops groups left with no children. */
export function filterByAccess<T extends AccessControlled<T>>(
  items: readonly T[],
  can: (rule: AccessRule) => boolean,
): T[] {
  return items.flatMap((item) => {
    if (item.access !== undefined && !can(item.access)) {
      return [];
    }
    if (item.children === undefined) {
      return [item];
    }
    const children = filterByAccess(item.children, can);
    return children.length > 0 ? [{ ...item, children }] : [];
  });
}
