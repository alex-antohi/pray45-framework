import {
  computed,
  EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import {
  AccessRole,
  AccessRule,
  AccessSnapshot,
  managePermission,
  NO_ACCESS,
} from './access.model';

export type AccessLoader = () => Promise<AccessSnapshot>;

export const ACCESS_LOADER = new InjectionToken<AccessLoader>('ACCESS_LOADER');

/** The factory runs in an injection context, so it can inject the data client. */
export function provideAccess(
  factory: () => AccessLoader,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ACCESS_LOADER, useFactory: factory },
  ]);
}

/**
 * Decides what the interface shows. This is not a security boundary: the
 * database enforces access through RLS.
 */
@Injectable({ providedIn: 'root' })
export class AccessService {
  private readonly load = inject(ACCESS_LOADER);
  private readonly snapshot = signal(NO_ACCESS);
  private readonly held = computed(() => new Set(this.snapshot().permissions));
  private latestRequest = 0;
  private pending: Promise<void> | null = null;

  readonly role = computed(() => this.snapshot().role);

  can(rule: AccessRule): boolean {
    const held = this.held();
    return typeof rule === 'string'
      ? held.has(rule)
      : rule.anyOf.some((permission) => held.has(permission));
  }

  /** Requires both a higher rank and the permission for the target's role. */
  canManage(target: AccessRole): boolean {
    const role = this.role();
    return (
      role !== null &&
      role.rank > target.rank &&
      this.can(managePermission(target.key))
    );
  }

  /** Resolves once access has been loaded. */
  ready(): Promise<void> {
    return (this.pending ??= this.reload());
  }

  /** Call after login, logout or any change to the user's permissions. */
  reload(): Promise<void> {
    const request = ++this.latestRequest;
    this.pending = this.fetch(request);
    return this.pending;
  }

  private async fetch(request: number): Promise<void> {
    try {
      const next = await this.load();
      if (request === this.latestRequest) {
        this.snapshot.set(next);
      }
    } catch (error) {
      console.error('Could not load access; denying everything.', error);
      if (request === this.latestRequest) {
        this.snapshot.set(NO_ACCESS);
        this.pending = null;
      }
    }
  }
}
