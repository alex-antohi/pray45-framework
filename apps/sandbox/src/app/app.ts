import { afterNextRender, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccessService } from '@pray45/auth';
import { BrandPicker } from '@pray45/ui/picker';

/** Who may open the style picker (D-050). */
export const BRAND_PERMISSION = 'brand.manage';

@Component({
  imports: [RouterOutlet, BrandPicker],
  selector: 'app-root',
  // In the root component, so the picker is on every page, but only for users
  // with the permission. Deferred, so its code loads after the page.
  template: `
    <router-outlet />
    @if (access.can(brandPermission)) {
      @defer (on idle) {
        <lib-brand-picker />
      }
    }
  `,
})
export class App {
  protected readonly access = inject(AccessService);
  protected readonly brandPermission = BRAND_PERMISSION;

  constructor() {
    // The session lives in the browser, so access loads there.
    afterNextRender(() => this.access.ready());
  }
}
