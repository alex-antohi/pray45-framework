# pray45-framework

Framework-ul studioului **Pray45** pentru site-uri de prezentare și magazine online.

O bază de cod comună din care construim site-uri pentru clienți: site-uri de prezentare, magazine online, conturi pentru clienți, angajați și administratori, plăți cu Stripe, facturare și rapoarte. Primul client este o **școală de arte marțiale**.

**Agenți:** citiți întâi `AGENTS.md`. Conține reguli obligatorii: cum se lucrează cu Git (fără commit înainte de review) și cum se actualizează documentația.

## Linkuri

| | |
|---|---|
| Repository | https://github.com/alex-antohi/pray45-framework |
| Vercel | https://vercel.com/pray-45/pray45-framework |

## Stadiu

**Faza 1: configurarea de bază.** Există workspace-ul Nx și un site gol pentru teste, `apps/sandbox` (D-028). Următorii pași:

1. Răspunsuri la întrebările deschise despre facturare (`docs/decizii.md`, Î-5 … Î-9).
2. Setarea proiectului Vercel pentru `apps/sandbox` și primul deployment (vezi „Publicare pe Vercel”).
3. Proiectul Supabase în Frankfurt (D-020): schema de bază (`profiles` cu roluri, RLS) și autentificarea prin link magic.

## Documente

| Fișier | Ce conține |
|---|---|
| `AGENTS.md` | Reguli pentru agenți (încărcat automat prin `CLAUDE.md`) |
| `docs/decizii.md` | Jurnalul deciziilor și întrebările deschise. **Sursa de adevăr** pentru stack și arhitectură. |
| `docs/prezentare/index.html` | Prezentarea pentru clienți (capabilități, roluri, design, proces, contact). Nepublicată online deocamdată (D-030). |

## Stack

Rezumat. Detaliile și motivele sunt în `docs/decizii.md`.

| Strat | Alegere | Status |
|---|---|---|
| Frontend | Angular 21, cu SSR (`@angular/ssr`) | Implementată (D-010, D-027) |
| UI | Tailwind CSS v4 + PrimeNG 21 (MIT) | Acceptată, neinstalate încă (D-012, D-027, D-031) |
| Bază de date, autentificare, fișiere | Supabase (Postgres, Auth, Storage), un proiect per client | Acceptată (D-004, D-013) |
| Regiunea datelor | Frankfurt, `eu-central-1` | Propusă (D-020) |
| Autentificare | Doar link magic pe email, fără parole | Acceptată (D-018) |
| Logică pe server | Supabase Edge Functions (TypeScript), fără backend dedicat | Acceptată (D-003) |
| Plăți | Stripe Checkout (plăți unice și abonamente), doar cu cont | Acceptată (D-005, D-019) |
| Facturare | Interfață comună cu adaptoare injectate (SmartBill, Oblio, mai târziu modulul nostru); facturile stau mereu în baza noastră | Acceptată (D-024, D-025) · detaliile fiscale: Propusă (D-021) |
| Emailuri | Resend (SMTP pentru Supabase Auth și emailuri tranzacționale) | Acceptată (D-014) |
| Găzduire | Vercel, un proiect per client | Acceptată (D-006) · publicarea: Propusă (D-029) |
| Organizare cod | Monorepo Nx | Implementată (workspace-ul) · Acceptată (`libs/`) (D-011) |

## Arhitectură

```
Browser ──► Angular (SSR pe Vercel)
               │
               ├──► Supabase (Frankfurt): Postgres + Auth + Storage
               │      (accesul e controlat de RLS, pe roluri)
               │
               └──► Supabase Edge Functions ──► Stripe (Checkout)
                         ▲                 ├──► Resend (emailuri)
                         │                 └──► InvoiceProvider ──► SmartBill / Oblio / pray45 ──► RO e-Factura
                         │
              Stripe webhooks (confirmă plățile, declanșează facturile)
```

## Roluri

| Rol | Pe scurt |
|---|---|
| `client` | Cumpără, plătește, își vede comenzile, facturile, abonamentele și programările. |
| `angajat` | Operațiuni zilnice: comenzi, prezență, rapoarte operaționale. |
| `admin` | Tot, inclusiv produse, prețuri, conturile angajaților și rapoartele financiare. |

## Structura planificată (D-011)

```
apps/
  sandbox/            site gol pentru testarea framework-ului (există, D-028)
  arte-martiale/      primul client: branding, pagini, module active (mai târziu)
libs/
  ui/                 componente și teme comune
  auth/               autentificare cu link magic, roluri, guards
  shop/               catalog, coș, checkout
  invoicing/
    core/             interfața InvoiceProvider, registrul, serviciul de facturare
    adapters/         smartbill, oblio, fake, export, mai târziu pray45
  admin/              panou de administrare
  reports/            rapoarte, grafice, export CSV
supabase/
  migrations/         schema, singura cale de a modifica baza de date
  functions/          Edge Functions (Stripe, emailuri, facturare, acțiuni de admin)
tools/
  vercel/             împachetează build-ul pentru Vercel (există, D-029)
docs/
  decizii.md
  prezentare/
```

## Rulare locală

Necesită Node.js `^22.12.0` (D-032).

```bash
npm ci
```

```bash
npx nx serve sandbox
```

Site-ul pornește la http://localhost:4200.

| Ce vrei | Comandă |
|---|---|
| Build de producție | `npx nx build sandbox` |
| Rulează build-ul de producție (http://localhost:4000) | `node dist/apps/sandbox/server/server.mjs` |
| Teste | `npx nx test sandbox` |
| Lint | `npx nx lint sandbox` |

## Publicare pe Vercel

Proiectul `pray-45/pray45-framework` publică deocamdată `apps/sandbox`. Comenzile de instalare și de build sunt în `apps/sandbox/vercel.json`, așa că în Vercel, la **Settings → Build and Deployment**, se setează doar:

| Setare | Valoare |
|---|---|
| Root Directory | `apps/sandbox` |
| Include files outside the root directory in the Build Step | activată |
| Node.js Version | 22.x |

Build Command, Output Directory și Install Command rămân fără override în dashboard. Un domeniu propriu trebuie adăugat în `security.allowedHosts` din `apps/sandbox/project.json` sau în variabila de mediu `NG_ALLOWED_HOSTS` (D-029).
