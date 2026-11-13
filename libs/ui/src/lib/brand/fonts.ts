export type FontCategory =
  'system' | 'sans' | 'serif' | 'display' | 'mono' | 'handwriting';

export interface FontOption {
  readonly id: string;
  readonly family: string;
  readonly category: FontCategory;
  /** Weights to download. Empty for the system font, which needs no download. */
  readonly weights: readonly number[];
}

/**
 * Fonts the picker offers. Every downloadable font here covers Romanian,
 * including ș and ț with a comma below (the latin-ext subset).
 */
export const FONT_CATALOG: readonly FontOption[] = [
  {
    id: 'system',
    family: 'Fontul sistemului',
    category: 'system',
    weights: [],
  },
  { id: 'inter', family: 'Inter', category: 'sans', weights: [400, 600, 700] },
  {
    id: 'archivo',
    family: 'Archivo',
    category: 'sans',
    weights: [400, 600, 700],
  },
  {
    id: 'montserrat',
    family: 'Montserrat',
    category: 'sans',
    weights: [400, 600, 700],
  },
  {
    id: 'work-sans',
    family: 'Work Sans',
    category: 'sans',
    weights: [400, 600, 700],
  },
  {
    id: 'dm-sans',
    family: 'DM Sans',
    category: 'sans',
    weights: [400, 600, 700],
  },
  {
    id: 'playfair-display',
    family: 'Playfair Display',
    category: 'serif',
    weights: [400, 700],
  },
  { id: 'lora', family: 'Lora', category: 'serif', weights: [400, 600, 700] },
  {
    id: 'merriweather',
    family: 'Merriweather',
    category: 'serif',
    weights: [400, 700],
  },
  {
    id: 'source-serif-4',
    family: 'Source Serif 4',
    category: 'serif',
    weights: [400, 600, 700],
  },
  {
    id: 'bebas-neue',
    family: 'Bebas Neue',
    category: 'display',
    weights: [400],
  },
  {
    id: 'oswald',
    family: 'Oswald',
    category: 'display',
    weights: [400, 600, 700],
  },
  { id: 'anton', family: 'Anton', category: 'display', weights: [400] },
  {
    id: 'ibm-plex-mono',
    family: 'IBM Plex Mono',
    category: 'mono',
    weights: [400, 600],
  },
  {
    id: 'jetbrains-mono',
    family: 'JetBrains Mono',
    category: 'mono',
    weights: [400, 700],
  },
  {
    id: 'caveat',
    family: 'Caveat',
    category: 'handwriting',
    weights: [400, 700],
  },
];

/** Google Fonts (D-051): the stylesheet host, then the font file host. */
export const FONT_HOSTS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
] as const;

const FALLBACKS: Readonly<Record<FontCategory, string>> = {
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  display: '"Arial Narrow", system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  handwriting: '"Segoe Print", "Bradley Hand", cursive',
};

export function findFont(id: string): FontOption | undefined {
  return FONT_CATALOG.find((font) => font.id === id);
}

/** The CSS `font-family` value, with fallbacks for the font's category. */
export function fontStack(id: string): string {
  const font = findFont(id) ?? FONT_CATALOG[0];
  const fallback = FALLBACKS[font.category];
  return font.category === 'system'
    ? fallback
    : `"${font.family}", ${fallback}`;
}

/** One stylesheet for all the given fonts, or `null` if none needs a download. */
export function fontStylesheetUrl(ids: readonly string[]): string | null {
  const families = [...new Set(ids)]
    .map(findFont)
    .filter((font): font is FontOption => !!font && font.weights.length > 0)
    .map(
      (font) =>
        `family=${font.family.replace(/ /g, '+')}:wght@${font.weights.join(';')}`,
    );
  return families.length === 0
    ? null
    : `${FONT_HOSTS[0]}/css2?${families.join('&')}&display=swap`;
}
