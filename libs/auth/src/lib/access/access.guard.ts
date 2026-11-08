import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AccessRule } from './access.model';
import { AccessService } from './access.service';

/** Route guard. Use it only on routes with `RenderMode.Client` (D-010). */
export function requires(rule: AccessRule): CanMatchFn {
  return async () => {
    const access = inject(AccessService);
    await access.ready();
    return access.can(rule);
  };
}
