import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  BRAND_MARK_KINDS,
  BRAND_MARK_SHAPES,
  BrandMark,
  BrandService,
  COLOR_ROLES,
  findFont,
  FONT_ROLES,
} from '@pray45/ui';

/** Shows every style element, so changes from the picker are visible. */
@Component({
  selector: 'app-home',
  imports: [BrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <lib-brand-mark kind="logo" shape="rectangle" />
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Sandbox · stilul aplicației</p>
        <h1>{{ brand().name }}</h1>
        <p class="lede">
          Stilul are doar câteva elemente: trei fonturi, trei culori, numele,
          logo-ul și semnătura. Cine are permisiunea brand.manage le poate
          schimba pe toate din butonul Stil, din colțul paginii.
        </p>
        <p class="actions">
          <a class="btn primary" href="#fonturi">Fonturi</a>
          <a class="btn secondary" href="#culori">Culori</a>
          <span class="badge">{{ brand().signature }}</span>
        </p>
      </section>

      <section id="fonturi">
        <h2>Fonturi</h2>
        @for (role of fontRoles; track role) {
          <div class="font">
            <p class="eyebrow">
              {{ fontLabels[role] }} · {{ family(brand().fonts[role]) }}
            </p>
            <p [style.font-family]="'var(--font-' + role + ')'">
              Înțeleptul știe că fiecare țintă începe cu un pas mic. 0123456789
            </p>
          </div>
        }
      </section>

      <section id="culori">
        <h2>Culori</h2>
        <div class="swatches">
          @for (role of colorRoles; track role) {
            <div
              class="swatch"
              [style.background]="'var(--color-' + role + ')'"
              [style.color]="'var(--color-on-' + role + ')'"
            >
              <strong>{{ colorLabels[role] }}</strong>
              <code>{{ brand().colors[role] }}</code>
            </div>
          }
        </div>
      </section>

      <section>
        <h2>Nume, logo și semnătură</h2>
        <div class="marks">
          @for (kind of kinds; track kind) {
            @for (shape of shapes; track shape) {
              <figure>
                <lib-brand-mark [kind]="kind" [shape]="shape" />
                <figcaption>
                  {{ kindLabels[kind] }},
                  {{ shape === 'square' ? 'pătrat' : 'dreptunghiular' }}
                </figcaption>
              </figure>
            }
          }
        </div>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      max-width: 960px;
      margin: 0 auto;
      padding: 0 16px 96px;
    }
    .bar {
      --brand-mark-size: 2.5rem;
      padding: 20px 0;
      border-bottom: 1px solid var(--line);
    }
    section {
      padding: 40px 0 8px;
    }
    h1 {
      font-size: clamp(2.25rem, 7vw, 4rem);
      margin: 0 0 16px;
      color: var(--color-primary);
    }
    h2 {
      font-size: 1.5rem;
      margin: 0 0 16px;
    }
    .eyebrow {
      font-family: var(--font-accent);
      font-size: 0.8125rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 8px;
    }
    .lede {
      font-size: 1.1875rem;
      max-width: 60ch;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }
    .btn,
    .badge {
      border-radius: 8px;
      padding: 12px 20px;
      font-weight: 600;
      text-decoration: none;
    }
    .primary {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }
    .secondary {
      background: var(--color-secondary);
      color: var(--color-on-secondary);
      /* Same color as the page, so it needs an edge. */
      box-shadow: inset 0 0 0 2px var(--line);
    }
    .badge {
      font-family: var(--font-accent);
      background: var(--color-accent);
      color: var(--color-on-accent);
    }
    .font {
      padding: 12px 0;
      border-top: 1px solid var(--line);
    }
    .font p:last-child {
      font-size: 1.5rem;
      margin: 0;
    }
    .swatches,
    .marks {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 12px;
    }
    .swatch {
      box-shadow: inset 0 0 0 1px var(--line);
      display: grid;
      gap: 4px;
      padding: 48px 16px 16px;
      border-radius: 12px;
    }
    code {
      font-family: var(--font-accent);
    }
    figure {
      --brand-mark-size: 4.5rem;
      margin: 0;
      padding: 16px;
      display: grid;
      gap: 12px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      min-width: 0;
    }
    figcaption {
      font-size: 0.875rem;
      color: var(--muted);
    }
  `,
})
export class Home {
  protected readonly brand = inject(BrandService).brand;
  protected readonly fontRoles = FONT_ROLES;
  protected readonly colorRoles = COLOR_ROLES;
  protected readonly kinds = BRAND_MARK_KINDS;
  protected readonly shapes = BRAND_MARK_SHAPES;
  protected readonly fontLabels = {
    primary: 'Font principal',
    secondary: 'Font secundar',
    accent: 'Font de accent',
  };
  protected readonly colorLabels = {
    primary: 'Culoare principală',
    secondary: 'Culoare secundară · fundal',
    accent: 'Culoare de accent',
  };
  protected readonly kindLabels = {
    name: 'Nume',
    logo: 'Logo',
    signature: 'Semnătură',
  };

  protected family(id: string): string {
    return findFont(id)?.family ?? id;
  }
}
