import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrandInput } from './brand.model';
import { BrandMark } from './brand-mark';
import { BRAND_STORAGE_KEY, BrandService, provideBrand } from './brand.service';

const defaults: BrandInput = {
  name: 'Pray45 Sandbox',
  signature: 'P45',
  fonts: { primary: 'archivo', secondary: 'inter', accent: 'ibm-plex-mono' },
  colors: { primary: '#1f47d6', secondary: '#b98512', accent: '#e4572e' },
  images: { logo: { square: '/brand/logo-square.svg' } },
};

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

function setup(): BrandService {
  TestBed.configureTestingModule({ providers: [provideBrand(defaults)] });
  return TestBed.inject(BrandService);
}

function tokens(): string {
  return document.getElementById('brand-tokens')?.textContent ?? '';
}

describe('provideBrand', () => {
  it('rejects defaults the picker could not show', () => {
    expect(() =>
      provideBrand({
        ...defaults,
        fonts: { ...defaults.fonts, accent: 'nope' },
      }),
    ).toThrow(/accent font/);
    expect(() =>
      provideBrand({
        ...defaults,
        colors: { ...defaults.colors, primary: 'blue' },
      }),
    ).toThrow(/primary color/);
  });
});

describe('BrandService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.getElementById('brand-tokens')?.remove();
    document.getElementById('brand-fonts')?.remove();
  });

  it('writes the defaults into the page head', () => {
    setup();
    expect(tokens()).toContain('--color-primary: #1f47d6;');
    const fonts = document.getElementById('brand-fonts');
    expect(fonts?.getAttribute('href')).toContain('family=Archivo:wght@400;600;700');
  });

  it('applies and saves every change, and resets to the defaults', () => {
    const brand = setup();
    brand.setColor('primary', '#000000');
    brand.setFont('accent', 'system');
    brand.setName('Dojo');

    expect(tokens()).toContain('--color-primary: #000000;');
    expect(brand.brand().name).toBe('Dojo');
    expect(JSON.parse(localStorage.getItem(BRAND_STORAGE_KEY) ?? '{}')).toEqual(
      {
        colors: { primary: '#000000' },
        fonts: { accent: 'system' },
        name: 'Dojo',
      },
    );
    expect(
      document.getElementById('brand-fonts')?.getAttribute('href'),
    ).not.toContain('IBM+Plex+Mono');

    brand.reset();
    expect(brand.customized()).toBe(false);
    expect(tokens()).toContain('--color-primary: #1f47d6;');
    expect(localStorage.getItem(BRAND_STORAGE_KEY)).toBeNull();
  });

  it('replaces and removes images per format', () => {
    const brand = setup();
    brand.setImage('name', 'square', PNG);
    brand.setImage('logo', 'square', null);
    expect(brand.brand().images.name).toEqual({ square: PNG });
    expect(brand.brand().images.logo).toEqual({});
  });

  it('restores saved changes after the first render', async () => {
    localStorage.setItem(
      BRAND_STORAGE_KEY,
      JSON.stringify({ colors: { accent: '#00ff00' }, name: 'Salvat' }),
    );

    @Component({
      imports: [BrandMark],
      template: '<lib-brand-mark kind="name" />',
    })
    class Host {}

    TestBed.configureTestingModule({ providers: [provideBrand(defaults)] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const brand = TestBed.inject(BrandService);
    expect(brand.brand().name).toBe('Salvat');
    expect(tokens()).toContain('--color-accent: #00ff00;');
  });

  it('keeps the defaults when saved data is broken', async () => {
    localStorage.setItem(BRAND_STORAGE_KEY, '{not json');
    const brand = setup();
    TestBed.tick();
    expect(brand.brand().name).toBe('Pray45 Sandbox');
  });
});
