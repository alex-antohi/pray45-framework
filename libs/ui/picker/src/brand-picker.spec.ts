import { TestBed } from '@angular/core/testing';
import { BrandService, provideBrand } from '@pray45/ui';
import { BrandPicker } from './brand-picker';

async function render() {
  TestBed.configureTestingModule({
    providers: [
      provideBrand({
        name: 'Pray45 Sandbox',
        signature: 'P45',
        fonts: {
          primary: 'archivo',
          secondary: 'inter',
          accent: 'ibm-plex-mono',
        },
        colors: { primary: '#1f47d6', secondary: '#b98512', accent: '#e4572e' },
      }),
    ],
  });
  const fixture = TestBed.createComponent(BrandPicker);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const toggle = host.querySelector('button.toggle') as HTMLButtonElement;
  return { fixture, host, toggle, brand: TestBed.inject(BrandService) };
}

describe('BrandPicker', () => {
  beforeEach(() => localStorage.clear());

  it('opens and closes the panel', async () => {
    const { fixture, host, toggle } = await render();
    expect(host.querySelector('[role="dialog"]')).toBeNull();

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const panel = host.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel).not.toBeNull();

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it('changes the brand from the panel', async () => {
    const { fixture, host, toggle, brand } = await render();
    toggle.click();
    await fixture.whenStable();

    const name = host.querySelector('input[type="text"]') as HTMLInputElement;
    name.value = 'Dojo';
    name.dispatchEvent(new Event('input'));

    const accentFont = host.querySelectorAll('select')[2] as HTMLSelectElement;
    accentFont.value = 'caveat';
    accentFont.dispatchEvent(new Event('change'));

    const hex = host.querySelectorAll('input.hex')[1] as HTMLInputElement;
    hex.value = '00aa55';
    hex.dispatchEvent(new Event('change'));

    expect(brand.brand().name).toBe('Dojo');
    expect(brand.brand().fonts.accent).toBe('caveat');
    expect(brand.brand().colors.secondary).toBe('#00aa55');
  });

  it('keeps an empty name field empty while the page shows the default', async () => {
    const { fixture, host, toggle, brand } = await render();
    toggle.click();
    await fixture.whenStable();

    const name = host.querySelector('input[type="text"]') as HTMLInputElement;
    name.value = '';
    name.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(name.value).toBe('');
    expect(brand.brand().name).toBe('Pray45 Sandbox');
  });

  it('refuses files that are not images', async () => {
    const { fixture, host, toggle, brand } = await render();
    toggle.click();
    await fixture.whenStable();

    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<html></html>'], 'page.html', {
      type: 'text/html',
    });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'SVG, PNG',
    );
    expect(brand.customized()).toBe(false);
  });
});
