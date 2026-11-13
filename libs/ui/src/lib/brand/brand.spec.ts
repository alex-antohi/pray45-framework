import { brandCss, parseOverrides, resolveBrand } from './brand';
import { BrandInput } from './brand.model';
import { contrastRatio, textColorOn } from './colors';
import { fontStack, fontStylesheetUrl } from './fonts';

const defaults: BrandInput = {
  name: 'Școala de Arte Marțiale',
  signature: 'ȘAM',
  fonts: { primary: 'oswald', secondary: 'inter', accent: 'system' },
  colors: { primary: '#1f47d6', secondary: '#b98512', accent: '#ffffff' },
  images: { logo: { square: '/brand/logo.svg' } },
};

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('colors', () => {
  it('picks the text color with more contrast', () => {
    expect(textColorOn('#1f47d6')).toBe('#ffffff');
    expect(textColorOn('#ffe066')).toBe('#111111');
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
  });
});

describe('fonts', () => {
  it('adds fallbacks for the font category', () => {
    expect(fontStack('lora')).toBe(
      '"Lora", ui-serif, Georgia, "Times New Roman", serif',
    );
    expect(fontStack('system')).not.toContain('"Fontul');
    expect(fontStack('missing')).toBe(fontStack('system'));
  });

  it('loads every downloadable font once, in one stylesheet', () => {
    expect(fontStylesheetUrl(['inter', 'system', 'inter', 'bebas-neue'])).toBe(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Bebas+Neue:wght@400&display=swap',
    );
    expect(fontStylesheetUrl(['system'])).toBeNull();
  });
});

describe('resolveBrand', () => {
  it('applies valid overrides on top of the defaults', () => {
    const brand = resolveBrand(defaults, {
      name: '  Dojo  ',
      fonts: { accent: 'caveat' },
      colors: { primary: '#ABCDEF' },
      images: { name: { rectangle: PNG } },
    });
    expect(brand.name).toBe('Dojo');
    expect(brand.signature).toBe('ȘAM');
    expect(brand.fonts).toEqual({
      primary: 'oswald',
      secondary: 'inter',
      accent: 'caveat',
    });
    expect(brand.colors.primary).toBe('#abcdef');
    expect(brand.images.name).toEqual({ rectangle: PNG });
    expect(brand.images.logo).toEqual({ square: '/brand/logo.svg' });
  });

  it('falls back to the default for empty text', () => {
    expect(resolveBrand(defaults, { name: '   ' }).name).toBe(defaults.name);
  });

  it('removes a default image when it is set to null', () => {
    const brand = resolveBrand(defaults, {
      images: { logo: { square: null } },
    });
    expect(brand.images.logo).toEqual({});
  });
});

describe('brandCss', () => {
  it('declares a variable for every font and color, plus readable text colors', () => {
    const css = brandCss(resolveBrand(defaults, {}));
    expect(css).toContain('--font-primary: "Oswald"');
    expect(css).toContain('--font-secondary: "Inter"');
    expect(css).toContain('--color-primary: #1f47d6;');
    expect(css).toContain('--color-on-primary: #ffffff;');
    expect(css).toContain('--color-on-accent: #111111;');
  });
});

describe('parseOverrides', () => {
  it('keeps only valid values from saved data', () => {
    expect(
      parseOverrides({
        name: 'Dojo',
        signature: 42,
        fonts: { primary: 'lora', secondary: 'comic-sans' },
        colors: { primary: 'red', accent: '#00FF00' },
        images: {
          logo: { square: PNG, rectangle: 'javascript:alert(1)' },
          name: { square: null },
          signature: { square: 'https://example.com/a.png' },
        },
      }),
    ).toEqual({
      name: 'Dojo',
      fonts: { primary: 'lora' },
      colors: { accent: '#00ff00' },
      images: { logo: { square: PNG }, name: { square: null } },
    });
  });

  it('ignores anything that is not an object', () => {
    expect(parseOverrides(null)).toEqual({});
    expect(parseOverrides('x')).toEqual({});
    expect(parseOverrides([1])).toEqual({});
  });

  it('rejects CSS injection through colors and fonts', () => {
    const overrides = parseOverrides({
      colors: { primary: '#000000; } body { display: none' },
      fonts: { primary: 'inter"; }' },
    });
    expect(overrides).toEqual({});
  });
});
