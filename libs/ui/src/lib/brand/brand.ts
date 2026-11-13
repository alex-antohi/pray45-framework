import {
  Brand,
  BRAND_MARK_KINDS,
  BRAND_MARK_SHAPES,
  BrandInput,
  BrandMarkImages,
  BrandMarkKind,
  BrandMarkShape,
  BrandOverrides,
  COLOR_ROLES,
  ColorRole,
  FONT_ROLES,
  FontRole,
} from './brand.model';
import { isHexColor, textColorOn } from './colors';
import { findFont, fontStack } from './fonts';

export const MAX_NAME_LENGTH = 80;
export const MAX_SIGNATURE_LENGTH = 16;

/** Uploaded images are kept as data URLs; only raster images and SVG. */
const IMAGE_DATA_URL =
  /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[a-z0-9+/]+={0,2}$/i;

export function isImageDataUrl(value: unknown): value is string {
  return typeof value === 'string' && IMAGE_DATA_URL.test(value);
}

/** Throws on a default the app got wrong, so it shows up at startup. */
export function assertValidBrand(brand: BrandInput): void {
  for (const role of FONT_ROLES) {
    if (!findFont(brand.fonts[role])) {
      throw new Error(`Unknown ${role} font "${brand.fonts[role]}".`);
    }
  }
  for (const role of COLOR_ROLES) {
    if (!isHexColor(brand.colors[role])) {
      throw new Error(`The ${role} color must be #rrggbb.`);
    }
  }
}

/** The app's defaults with the picker's changes on top. */
export function resolveBrand(
  defaults: BrandInput,
  overrides: BrandOverrides,
): Brand {
  const fonts = { ...defaults.fonts };
  for (const role of FONT_ROLES) {
    const id = overrides.fonts?.[role];
    if (id && findFont(id)) fonts[role] = id;
  }
  const colors = { ...defaults.colors };
  for (const role of COLOR_ROLES) {
    const color = overrides.colors?.[role];
    if (isHexColor(color)) colors[role] = color.toLowerCase();
  }
  const images = {} as Record<BrandMarkKind, BrandMarkImages>;
  for (const kind of BRAND_MARK_KINDS) {
    const merged: Partial<Record<BrandMarkShape, string>> = {
      ...defaults.images?.[kind],
    };
    for (const shape of BRAND_MARK_SHAPES) {
      const src = overrides.images?.[kind]?.[shape];
      if (src === null) delete merged[shape];
      else if (isImageDataUrl(src)) merged[shape] = src;
    }
    images[kind] = merged;
  }
  return {
    name: cleanText(overrides.name, MAX_NAME_LENGTH) ?? defaults.name,
    signature:
      cleanText(overrides.signature, MAX_SIGNATURE_LENGTH) ??
      defaults.signature,
    fonts,
    colors,
    images,
  };
}

/** CSS custom properties for the brand. Apps style everything through these. */
export function brandCss(brand: Brand): string {
  const lines: string[] = [];
  for (const role of FONT_ROLES) {
    lines.push(`--font-${role}: ${fontStack(brand.fonts[role])};`);
  }
  for (const role of COLOR_ROLES) {
    const color = brand.colors[role];
    lines.push(`--color-${role}: ${color};`);
    lines.push(`--color-on-${role}: ${textColorOn(color)};`);
  }
  return `:root {\n  ${lines.join('\n  ')}\n}`;
}

/**
 * Keeps only valid overrides from untrusted input (saved data), so a bad or
 * old value never breaks the page.
 */
export function parseOverrides(raw: unknown): BrandOverrides {
  if (!isRecord(raw)) return {};
  const fonts: Partial<Record<FontRole, string>> = {};
  const rawFonts = isRecord(raw['fonts']) ? raw['fonts'] : {};
  for (const role of FONT_ROLES) {
    const id = rawFonts[role];
    if (typeof id === 'string' && findFont(id)) fonts[role] = id;
  }
  const colors: Partial<Record<ColorRole, string>> = {};
  const rawColors = isRecord(raw['colors']) ? raw['colors'] : {};
  for (const role of COLOR_ROLES) {
    const color = rawColors[role];
    if (isHexColor(color)) colors[role] = color.toLowerCase();
  }
  const images: Partial<
    Record<BrandMarkKind, Partial<Record<BrandMarkShape, string | null>>>
  > = {};
  const rawImages = isRecord(raw['images']) ? raw['images'] : {};
  for (const kind of BRAND_MARK_KINDS) {
    const rawKind = isRecord(rawImages[kind]) ? rawImages[kind] : {};
    for (const shape of BRAND_MARK_SHAPES) {
      const src = rawKind[shape];
      if (src === null || isImageDataUrl(src)) {
        images[kind] = { ...images[kind], [shape]: src };
      }
    }
  }
  return {
    ...optional('name', cleanText(raw['name'], MAX_NAME_LENGTH)),
    ...optional('signature', cleanText(raw['signature'], MAX_SIGNATURE_LENGTH)),
    ...(Object.keys(fonts).length ? { fonts } : {}),
    ...(Object.keys(colors).length ? { colors } : {}),
    ...(Object.keys(images).length ? { images } : {}),
  };
}

function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim().slice(0, max);
  return text.length > 0 ? text : undefined;
}

function optional<K extends string>(
  key: K,
  value: string | undefined,
): Partial<Record<K, string>> {
  return value === undefined ? {} : ({ [key]: value } as Record<K, string>);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
