import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrandMarkKind, BrandMarkShape } from './brand.model';
import { BrandMark } from './brand-mark';
import { BrandService, provideBrand } from './brand.service';

@Component({
  imports: [BrandMark],
  template: '<lib-brand-mark [kind]="kind()" [shape]="shape()" />',
})
class Host {
  readonly kind = signal<BrandMarkKind>('name');
  readonly shape = signal<BrandMarkShape>('rectangle');
}

async function render(kind: BrandMarkKind, shape: BrandMarkShape) {
  TestBed.configureTestingModule({
    providers: [
      provideBrand({
        name: 'Școala de Arte Marțiale',
        signature: 'ȘAM',
        fonts: { primary: 'oswald', secondary: 'inter', accent: 'system' },
        colors: { primary: '#1f47d6', secondary: '#b98512', accent: '#e4572e' },
        images: { logo: { square: '/logo-square.svg' } },
      }),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.kind.set(kind);
  fixture.componentInstance.shape.set(shape);
  await fixture.whenStable();
  const mark = fixture.nativeElement.querySelector(
    'lib-brand-mark',
  ) as HTMLElement;
  return { fixture, mark };
}

describe('BrandMark', () => {
  beforeEach(() => localStorage.clear());

  it('names the brand for screen readers, whatever it shows', async () => {
    const { mark } = await render('signature', 'square');
    expect(mark.getAttribute('role')).toBe('img');
    expect(mark.getAttribute('aria-label')).toBe('Școala de Arte Marțiale');
    expect(mark.textContent?.trim()).toBe('ȘAM');
  });

  it('stacks the words of the name in the square format', async () => {
    const { mark } = await render('name', 'square');
    const words = Array.from(mark.querySelectorAll('.stack span')).map(
      (w) => w.textContent,
    );
    expect(words).toEqual(['Școala', 'de', 'Arte', 'Marțiale']);
  });

  it('shows the image for the format when there is one', async () => {
    const { mark } = await render('logo', 'square');
    expect(mark.querySelector('img')?.getAttribute('src')).toBe(
      '/logo-square.svg',
    );
  });

  it('builds a rectangular logo from the square logo and the name', async () => {
    const { mark } = await render('logo', 'rectangle');
    expect(mark.querySelector('img.icon')?.getAttribute('src')).toBe(
      '/logo-square.svg',
    );
    expect(mark.querySelector('.text')?.textContent).toBe(
      'Școala de Arte Marțiale',
    );
  });

  it('falls back to a tile with the signature when there is no logo', async () => {
    const { fixture, mark } = await render('logo', 'square');
    TestBed.inject(BrandService).setImage('logo', 'square', null);
    await fixture.whenStable();
    expect(mark.querySelector('img')).toBeNull();
    expect(mark.querySelector('.tile')?.textContent).toBe('ȘAM');
  });
});
