/** The three fonts, by role. */
export type FontRole = 'primary' | 'secondary' | 'accent';

/** The three colors, by role. */
export type ColorRole = 'primary' | 'secondary' | 'accent';

/** What identifies the brand: the full name, the logo and the short name. */
export type BrandMarkKind = 'name' | 'logo' | 'signature';

/** Every mark comes in a rectangular and a square format. */
export type BrandMarkShape = 'rectangle' | 'square';

export const FONT_ROLES: readonly FontRole[] = [
  'primary',
  'secondary',
  'accent',
];
export const COLOR_ROLES: readonly ColorRole[] = [
  'primary',
  'secondary',
  'accent',
];
export const BRAND_MARK_KINDS: readonly BrandMarkKind[] = [
  'name',
  'logo',
  'signature',
];
export const BRAND_MARK_SHAPES: readonly BrandMarkShape[] = [
  'rectangle',
  'square',
];

/** Image URL per format. A missing format falls back to text. */
export type BrandMarkImages = Readonly<Partial<Record<BrandMarkShape, string>>>;

/** The whole style of an app. Nothing else is configurable. */
export interface Brand {
  readonly name: string;
  /** The brand name, shorter (initials or an abbreviation). */
  readonly signature: string;
  /** Font ids from `FONT_CATALOG`. */
  readonly fonts: Readonly<Record<FontRole, string>>;
  /** Hex colors, `#rrggbb`. */
  readonly colors: Readonly<Record<ColorRole, string>>;
  readonly images: Readonly<Record<BrandMarkKind, BrandMarkImages>>;
}

/** What an app declares; missing images fall back to text. */
export type BrandInput = Omit<Brand, 'images'> & {
  readonly images?: Readonly<Partial<Record<BrandMarkKind, BrandMarkImages>>>;
};

/**
 * Changes made in the picker, on top of the app's defaults. An image set to
 * `null` removes the default image, so the text fallback shows.
 */
export interface BrandOverrides {
  readonly name?: string;
  readonly signature?: string;
  readonly fonts?: Readonly<Partial<Record<FontRole, string>>>;
  readonly colors?: Readonly<Partial<Record<ColorRole, string>>>;
  readonly images?: Readonly<
    Partial<
      Record<BrandMarkKind, Partial<Record<BrandMarkShape, string | null>>>
    >
  >;
}
