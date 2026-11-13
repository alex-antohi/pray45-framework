import {
  afterNextRender,
  computed,
  DOCUMENT,
  EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  makeEnvironmentProviders,
  provideAppInitializer,
  signal,
} from '@angular/core';
import {
  assertValidBrand,
  brandCss,
  parseOverrides,
  resolveBrand,
} from './brand';
import {
  BrandInput,
  BrandMarkKind,
  BrandMarkShape,
  BrandOverrides,
  ColorRole,
  FontRole,
} from './brand.model';
import { FONT_HOSTS, fontStylesheetUrl } from './fonts';

export const BRAND_DEFAULTS = new InjectionToken<BrandInput>('BRAND_DEFAULTS');

export const BRAND_STORAGE_KEY = 'pray45.brand';

const TOKENS_ID = 'brand-tokens';
const FONTS_ID = 'brand-fonts';
const PRECONNECT_ID = 'brand-fonts-preconnect';

/** Sets the app's style. The server renders it, so the first paint is styled. */
export function provideBrand(defaults: BrandInput): EnvironmentProviders {
  assertValidBrand(defaults);
  return makeEnvironmentProviders([
    { provide: BRAND_DEFAULTS, useValue: defaults },
    provideAppInitializer(() => {
      inject(BrandService);
    }),
  ]);
}

/**
 * The app's style: its defaults plus the changes made in the picker. Changes
 * are kept only in this browser (D-048).
 */
@Injectable({ providedIn: 'root' })
export class BrandService {
  readonly defaults = inject(BRAND_DEFAULTS);
  private readonly document = inject(DOCUMENT);
  private readonly changes = signal<BrandOverrides>({});

  readonly overrides = this.changes.asReadonly();
  readonly brand = computed(() => resolveBrand(this.defaults, this.changes()));
  readonly customized = computed(() => Object.keys(this.changes()).length > 0);
  /** False when the browser refused to keep the changes, e.g. images too large. */
  readonly saved = signal(true);

  constructor() {
    this.apply();
    // After hydration, so the server and the browser render the same first.
    afterNextRender(() => this.restore());
  }

  setName(name: string): void {
    this.change({ ...this.changes(), name });
  }

  setSignature(signature: string): void {
    this.change({ ...this.changes(), signature });
  }

  setFont(role: FontRole, id: string): void {
    const current = this.changes();
    this.change({ ...current, fonts: { ...current.fonts, [role]: id } });
  }

  setColor(role: ColorRole, color: string): void {
    const current = this.changes();
    this.change({ ...current, colors: { ...current.colors, [role]: color } });
  }

  /** A data URL, or `null` to show the text instead of the default image. */
  setImage(
    kind: BrandMarkKind,
    shape: BrandMarkShape,
    src: string | null,
  ): void {
    const current = this.changes();
    const images = current.images ?? {};
    this.change({
      ...current,
      images: { ...images, [kind]: { ...images[kind], [shape]: src } },
    });
  }

  /** Back to the app's defaults. */
  reset(): void {
    this.change({});
  }

  private change(next: BrandOverrides): void {
    this.changes.set(next);
    this.apply();
    this.save();
  }

  private apply(): void {
    const brand = this.brand();
    this.headElement('style', TOKENS_ID).textContent = brandCss(brand);

    const url = fontStylesheetUrl(Object.values(brand.fonts));
    if (url === null) {
      this.document.getElementById(FONTS_ID)?.remove();
      return;
    }
    FONT_HOSTS.forEach((host, index) => {
      const preconnect = this.headElement('link', `${PRECONNECT_ID}-${index}`);
      preconnect.setAttribute('rel', 'preconnect');
      preconnect.setAttribute('href', host);
      // Font files are fetched in CORS mode; the stylesheet is not.
      if (host === FONT_HOSTS[1]) preconnect.setAttribute('crossorigin', '');
    });
    const fonts = this.headElement('link', FONTS_ID);
    fonts.setAttribute('rel', 'stylesheet');
    if (fonts.getAttribute('href') !== url) fonts.setAttribute('href', url);
  }

  /** Reuses the element the server rendered, if there is one. */
  private headElement(tag: 'style' | 'link', id: string): HTMLElement {
    const existing = this.document.getElementById(id);
    if (existing) return existing;
    const element = this.document.createElement(tag);
    element.id = id;
    this.document.head.appendChild(element);
    return element;
  }

  private restore(): void {
    try {
      const raw = this.storage()?.getItem(BRAND_STORAGE_KEY);
      if (raw) {
        this.changes.set(parseOverrides(JSON.parse(raw)));
        this.apply();
      }
    } catch {
      // Unreadable saved data: keep the defaults.
    }
  }

  private save(): void {
    try {
      const storage = this.storage();
      if (!storage) return;
      if (this.customized()) {
        storage.setItem(BRAND_STORAGE_KEY, JSON.stringify(this.changes()));
      } else {
        storage.removeItem(BRAND_STORAGE_KEY);
      }
      this.saved.set(true);
    } catch {
      this.saved.set(false);
    }
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
