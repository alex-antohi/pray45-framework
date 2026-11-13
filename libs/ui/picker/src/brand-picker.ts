import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  BRAND_MARK_KINDS,
  BRAND_MARK_SHAPES,
  BrandMark,
  BrandMarkKind,
  BrandMarkShape,
  BrandService,
  COLOR_ROLES,
  ColorRole,
  FONT_CATALOG,
  FONT_ROLES,
  FontRole,
  fontStack,
  isHexColor,
  MAX_NAME_LENGTH,
  MAX_SIGNATURE_LENGTH,
} from '@pray45/ui';

export const ACCEPTED_IMAGE_TYPES = [
  'image/svg+xml',
  'image/png',
  'image/webp',
  'image/jpeg',
];
/** Keeps saved changes well under the browser's storage limit. */
export const MAX_IMAGE_BYTES = 200 * 1024;

const FONT_LABELS: Record<FontRole, [string, string]> = {
  primary: ['Font principal', 'titluri și brand'],
  secondary: ['Font secundar', 'textul paginilor'],
  accent: ['Font de accent', 'etichete și evidențieri'],
};
const COLOR_LABELS: Record<ColorRole, string> = {
  primary: 'Culoare principală',
  secondary: 'Culoare secundară (fundalul paginii)',
  accent: 'Culoare de accent',
};
const KIND_LABELS: Record<BrandMarkKind, string> = {
  name: 'Nume',
  logo: 'Logo',
  signature: 'Semnătură',
};
const SHAPE_LABELS: Record<BrandMarkShape, string> = {
  rectangle: 'dreptunghiular',
  square: 'pătrat',
};

/**
 * A floating button that opens the style panel. Put it once in the root
 * component, so it is on every page. Every change applies immediately.
 */
@Component({
  selector: 'lib-brand-picker',
  imports: [BrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-picker.html',
  styleUrl: './brand-picker.css',
})
export class BrandPicker {
  protected readonly service = inject(BrandService);
  protected readonly brand = this.service.brand;
  private readonly injector = inject(Injector);

  protected readonly open = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly fontRoles = FONT_ROLES;
  protected readonly colorRoles = COLOR_ROLES;
  protected readonly kinds = BRAND_MARK_KINDS;
  protected readonly shapes = BRAND_MARK_SHAPES;
  protected readonly fonts = FONT_CATALOG;
  protected readonly fontLabels = FONT_LABELS;
  protected readonly colorLabels = COLOR_LABELS;
  protected readonly kindLabels = KIND_LABELS;
  protected readonly shapeLabels = SHAPE_LABELS;
  protected readonly maxName = MAX_NAME_LENGTH;
  protected readonly maxSignature = MAX_SIGNATURE_LENGTH;
  protected readonly accept = ACCEPTED_IMAGE_TYPES.join(',');
  protected readonly fontStack = fontStack;

  /** What the user typed, even when empty; the page then shows the default. */
  protected readonly nameDraft = computed(
    () => this.service.overrides().name ?? this.service.defaults.name,
  );
  protected readonly signatureDraft = computed(
    () => this.service.overrides().signature ?? this.service.defaults.signature,
  );

  private readonly toggleButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('toggleButton');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    afterNextRender(() => this.panel()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.toggleButton().nativeElement.focus();
  }

  protected setName(event: Event): void {
    this.service.setName(valueOf(event));
  }

  protected setSignature(event: Event): void {
    this.service.setSignature(valueOf(event));
  }

  protected setFont(role: FontRole, event: Event): void {
    this.service.setFont(role, valueOf(event));
  }

  protected setColor(role: ColorRole, event: Event): void {
    const value = valueOf(event).trim();
    const color = value.startsWith('#') ? value : `#${value}`;
    if (isHexColor(color)) this.service.setColor(role, color);
  }

  protected async upload(
    kind: BrandMarkKind,
    shape: BrandMarkShape,
    event: Event,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      this.error.set('Formate acceptate: SVG, PNG, WebP sau JPEG.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.error.set('Imaginea trebuie să aibă cel mult 200 KB.');
      return;
    }
    this.error.set(null);
    this.service.setImage(kind, shape, await readAsDataUrl(file));
  }

  protected removeImage(kind: BrandMarkKind, shape: BrandMarkShape): void {
    this.service.setImage(kind, shape, null);
  }

  protected reset(): void {
    this.error.set(null);
    this.service.reset();
  }
}

function valueOf(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement).value;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
