# ui

Stilul unei aplicații (D-047) și picker-ul care îl schimbă (D-048, D-050). Stilul unui site stă în codul aplicației, în `provideBrand`, și nu are mod întunecat: site-ul arată la fel pentru toți vizitatorii (D-052).

## Ce conține stilul

Doar atât:

| Element | Variabilă CSS | Folosit pentru |
|---|---|---|
| Font principal | `--font-primary` | titluri și brand |
| Font secundar | `--font-secondary` | textul paginilor |
| Font de accent | `--font-accent` | etichete, cifre, evidențieri |
| Culoare principală | `--color-primary`, `--color-on-primary` | |
| Culoare secundară | `--color-secondary`, `--color-on-secondary` | fundalul paginii (D-053) |
| Culoare de accent | `--color-accent`, `--color-on-accent` | |
| Numele brandului | | `<lib-brand-mark kind="name">` |
| Logo-ul | | `<lib-brand-mark kind="logo">` |
| Semnătura (numele, mai pe scurt) | | `<lib-brand-mark kind="signature">` |

`--color-on-*` e culoarea textului pus peste culoarea respectivă: alb sau aproape negru, cea cu contrast mai mare. Se calculează singură.

Numele, logo-ul și semnătura au fiecare două formate: `shape="rectangle"` (dreptunghiular, implicit) și `shape="square"` (pătrat). Dacă un format nu are imagine, se afișează text cu fontul principal:

| Element | Dreptunghiular, fără imagine | Pătrat, fără imagine |
|---|---|---|
| Nume | numele pe un rând | cuvintele numelui, unul sub altul |
| Logo | logo-ul pătrat, urmat de nume | un pătrat în culoarea principală, cu semnătura |
| Semnătură | semnătura | semnătura, centrată |

Fundalul paginii e culoarea secundară, iar textul obișnuit e `--color-on-secondary` (D-053). Nuanțele neutre (text estompat, linii, carduri) se derivă din `--color-on-secondary`, ca să rămână lizibile orice culoare s-ar alege. Vezi `apps/sandbox/src/styles.css`.

## Într-o aplicație

```ts
// app.config.ts
provideBrand({
  name: 'Școala de Arte Marțiale',
  signature: 'ȘAM',
  fonts: { primary: 'oswald', secondary: 'inter', accent: 'ibm-plex-mono' },
  colors: { primary: '#b3261e', secondary: '#1f2937', accent: '#e4a92a' },
  images: {
    logo: { rectangle: '/brand/logo-rectangle.svg', square: '/brand/logo-square.svg' },
  },
});
```

Fonturile se aleg după `id` din `FONT_CATALOG` (`libs/ui/src/lib/brand/fonts.ts`). O valoare greșită oprește aplicația la pornire, cu un mesaj clar.

`provideBrand` scrie variabilele CSS și linkul către fonturi în `<head>`, inclusiv la randarea pe server, deci prima afișare are deja stilul.

```css
/* styles.css */
body { font-family: var(--font-secondary); }
h1, h2, h3 { font-family: var(--font-primary); }
.buton { background: var(--color-primary); color: var(--color-on-primary); }
```

```html
<!-- înălțimea se dă prin --brand-mark-size (implicit 3rem) -->
<lib-brand-mark kind="logo" shape="rectangle" style="--brand-mark-size: 2.5rem" />
```

Când se instalează Tailwind v4 (D-012), variabilele au deja numele din tema lui (`--font-*`, `--color-*`).

## Picker-ul

Un buton „Stil”, fixat în colțul paginii, care deschide panoul. Se pune o singură dată, în componenta rădăcină, ca să apară pe orice pagină, și doar pentru cine are permisiunea `brand.manage` (D-050). E un punct de intrare separat, deci un site care nu îl folosește nu îl descarcă:

```ts
import { AccessService } from '@pray45/auth';
import { BrandPicker } from '@pray45/ui/picker';

@Component({
  imports: [RouterOutlet, BrandPicker],
  template: `
    <router-outlet />
    @if (access.can('brand.manage')) {
      @defer (on idle) {
        <lib-brand-picker />
      }
    }
  `,
})
export class App {
  protected readonly access = inject(AccessService);

  constructor() {
    afterNextRender(() => this.access.ready());
  }
}
```

Permisiunea vine din migrarea `supabase/migrations/20261113120000_brand_permission.sql`: `super_admin` o are implicit și o poate acorda altor roluri.

- Schimbările se aplică imediat și se păstrează doar în browserul în care s-au făcut (`localStorage`). Ceilalți vizitatori văd valorile din `provideBrand`. Ca un stil ales să ajungă la ei, valorile se copiază în codul aplicației.
- Imaginile acceptate: SVG, PNG, WebP, JPEG, cel mult 200 KB fiecare.
- „Fără imagine” ascunde și imaginea implicită, ca să se vadă varianta text.
- Datele salvate se verifică la citire: fonturi doar din listă, culori doar `#rrggbb`, imagini doar ca date `data:image/...`.

Panoul are fontul sistemului și culori neutre, ca să rămână lizibil orice stil s-ar alege.

## Fonturi

Se încarcă de la Google Fonts (D-051), într-o singură cerere, doar cele trei fonturi alese. Toate fonturile din listă au ș și ț cu virgulă. „Fontul sistemului” nu descarcă nimic.

## Teste

```bash
npx nx test ui
```
