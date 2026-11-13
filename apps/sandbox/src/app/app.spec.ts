import { DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccessService, provideAccess } from '@pray45/auth';
import { provideBrand } from '@pray45/ui';
import { App, BRAND_PERMISSION } from './app';
import { sandboxBrand } from './brand.config';
import { Home } from './pages/home';

async function setup(permissions: string[]) {
  await TestBed.configureTestingModule({
    imports: [App, Home],
    providers: [
      provideRouter([]),
      provideBrand(sandboxBrand),
      provideAccess(() => async () => ({
        role: { key: 'super_admin', rank: 1000 },
        permissions,
      })),
    ],
  }).compileComponents();
}

async function renderApp() {
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(AccessService).ready();
  await fixture.whenStable();
  return fixture;
}

describe('App', () => {
  it('shows the style picker on every page to users with the permission', async () => {
    await setup([BRAND_PERMISSION]);
    const fixture = await renderApp();
    const [picker] = await fixture.getDeferBlocks();
    await picker.render(DeferBlockState.Complete);
    expect(
      fixture.nativeElement.querySelector('lib-brand-picker'),
    ).not.toBeNull();
  });

  it('hides the style picker from everyone else', async () => {
    await setup([]);
    const fixture = await renderApp();
    expect(await fixture.getDeferBlocks()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('lib-brand-picker')).toBeNull();
  });

  it('renders the home page with the brand name', async () => {
    await setup([]);
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Pray45 Sandbox',
    );
    expect(
      fixture.nativeElement.querySelectorAll('lib-brand-mark').length,
    ).toBe(7);
  });
});
