import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { BrandMarkKind, BrandMarkShape } from './brand.model';
import { BrandService } from './brand.service';

/**
 * The brand's name, logo or signature, in a rectangular or square format.
 * Shows the image for that format, or text in the brand's font and colors.
 * Size it with `--brand-mark-size` (the height; default 3rem).
 */
@Component({
  selector: 'lib-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'brand().name',
    '[attr.data-kind]': 'kind()',
    '[attr.data-shape]': 'shape()',
    '[style.--fit]': 'fit()',
  },
  template: `
    @if (image(); as src) {
      <img [src]="src" alt="" />
    } @else {
      @switch (kind()) {
        @case ('logo') {
          @if (squareLogo(); as src) {
            <img class="icon" [src]="src" alt="" />
          } @else {
            <span class="tile" aria-hidden="true">{{ brand().signature }}</span>
          }
          @if (shape() === 'rectangle') {
            <span class="text" aria-hidden="true">{{ brand().name }}</span>
          }
        }
        @case ('name') {
          @if (shape() === 'square') {
            <span class="stack" aria-hidden="true">
              @for (word of words(); track $index) {
                <span>{{ word }}</span>
              }
            </span>
          } @else {
            <span class="text" aria-hidden="true">{{ brand().name }}</span>
          }
        }
        @case ('signature') {
          <span class="text" aria-hidden="true">{{ brand().signature }}</span>
        }
      }
    }
  `,
  styles: `
    :host {
      --h: var(--brand-mark-size, 3rem);
      display: inline-flex;
      align-items: center;
      gap: calc(var(--h) * 0.25);
      height: var(--h);
      max-width: 100%;
      vertical-align: middle;
      line-height: 1;
      font-family: var(--font-primary);
      font-weight: 700;
      color: var(--color-primary);
    }
    :host([data-shape='square']) {
      width: var(--h);
      justify-content: center;
    }
    img {
      display: block;
      height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    :host([data-shape='square']) img {
      width: 100%;
    }
    .icon,
    .tile {
      flex: none;
      aspect-ratio: 1;
    }
    .tile {
      display: grid;
      place-items: center;
      height: 100%;
      border-radius: 22%;
      background: var(--color-primary);
      color: var(--color-on-primary);
      font-size: calc(var(--h) * 0.34);
      overflow: hidden;
    }
    .text {
      min-width: 0;
      font-size: calc(var(--h) * var(--fit));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stack {
      display: grid;
      text-align: center;
      font-size: calc(var(--h) * var(--fit));
      line-height: 1.05;
    }
  `,
})
export class BrandMark {
  readonly kind = input.required<BrandMarkKind>();
  readonly shape = input<BrandMarkShape>('rectangle');

  protected readonly brand = inject(BrandService).brand;

  protected readonly image = computed(
    () => this.brand().images[this.kind()][this.shape()] ?? null,
  );
  protected readonly squareLogo = computed(
    () => this.brand().images.logo.square ?? null,
  );
  protected readonly words = computed(() =>
    this.brand().name.split(/\s+/).filter(Boolean),
  );

  /** Font size as a share of the height, so text fits its format. */
  protected readonly fit = computed(() => {
    if (this.shape() === 'rectangle') return 0.5;
    if (this.kind() === 'signature') {
      return Math.min(0.5, 1 / (0.62 * this.brand().signature.length));
    }
    const words = this.words();
    const longest = Math.max(1, ...words.map((word) => word.length));
    return Math.min(0.8 / Math.max(1, words.length), 1 / (0.62 * longest));
  });
}
