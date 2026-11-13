# pray45-framework

Framework-ul studioului **Pray45** pentru site-uri de prezentare și magazine online.

O bază de cod comună din care construim site-uri pentru clienți: site-uri de prezentare, magazine online, conturi pentru clienți, angajați și administratori, plăți cu Stripe, facturare și rapoarte. Primul client este o **școală de arte marțiale**.

**Agenți:** citiți întâi `AGENTS.md`. Conține reguli obligatorii: cum se lucrează cu Git (fără commit înainte de review) și cum se actualizează documentația.

## Linkuri

| | |
|---|---|
| Repository | https://github.com/alex-antohi/pray45-framework |
| Vercel | https://vercel.com/pray-45/pray45-framework |
| Supabase | https://supabase.com/dashboard/project/fcdizyuyogaqwkbfrust |
| Sandbox (producție) | https://pray45-framework.vercel.app |
| Task-uri (Trello) | https://trello.com/b/IlBnNpRk/pray45-framework (D-041) |

## Stadiu

**Faza 1: configurarea de bază.** Există workspace-ul Nx, un site pentru teste, `apps/sandbox` (D-028), cadrul pentru roluri și permisiuni, `libs/auth` (D-038), și stilul aplicației, `libs/ui`: trei fonturi, trei culori, numele, logo-ul și semnătura, plus un picker care le schimbă de pe orice pagină, doar pentru cine are permisiunea `brand.manage` (D-047, D-048, D-050). Stilul unui site stă în codul aplicației și nu are mod întunecat (D-052). Următorii pași:

1. Autentificarea prin link magic (D-018) și rolurile aplicației, pe proiectul Supabase refolosit (D-039).

## Documente

| Fișier | Ce conține |
|---|---|
| `AGENTS.md` | Reguli pentru agenți (încărcat automat prin `CLAUDE.md`) |
| `libs/auth/README.md` | Cum folosește o aplicație rolurile și permisiunile |
| `libs/ui/README.md` | Cum își declară o aplicație stilul și cum se folosește picker-ul |
| `docs/decizii.md` | Jurnalul deciziilor și întrebările deschise. **Sursa de adevăr** pentru stack și arhitectură. |
| `docs/prezentare/index.html` | Prezentarea pentru clienți (capabilități, roluri, design, proces, contact). Nepublicată online deocamdată (D-030). |

## Stack

Rezumat. Detaliile și motivele sunt în `docs/decizii.md`.

| Strat | Alegere | Status |
|---|---|---|
| Frontend | Angular 21, cu SSR (`@angular/ssr`) | Implementată (D-010, D-027) |
| UI | Tailwind CSS v4 + PrimeNG 21 (MIT) | Acceptată, neinstalate încă (D-012, D-027, D-031) |
| Stil | `libs/ui`: variabile CSS pentru trei fonturi și trei culori, numele, logo-ul și semnătura, picker | Implementată (D-047, D-048, D-050, D-052, D-053) |
| Fonturi | Google Fonts, dintr-o listă de 15 fonturi | Implementată (D-051) |
| Bază de date, autentificare, fișiere | Supabase (Postgres, Auth, Storage), un proiect per client | Acceptată (D-004, D-013) |
| Regiunea datelor | Irlanda, `eu-west-1` | Implementată (D-040) |
| Autentificare | Doar link magic pe email, fără parole | Acceptată (D-018) |
| Logică pe server | Supabase Edge Functions (TypeScript), fără backend dedicat | Acceptată (D-003) |
| Plăți | Stripe Checkout (plăți unice și abonamente), doar cu cont | Acceptată (D-005, D-019) |
| Facturare | Program extern, încă nestabilit | Acceptată (D-045) |
| Emailuri | Resend (SMTP pentru Supabase Auth și emailuri tranzacționale) | Acceptată (D-014) |
| Găzduire | Vercel, un proiect per client, funcții SSR în Irlanda | Implementată (D-006, D-029, D-032, D-040) |
| Organizare cod | Monorepo Nx | Implementată (workspace-ul) · Acceptată (`libs/`) (D-011) |

## Arhitectură

```
Browser ──► Angular (SSR pe Vercel)
               │
               ├──► Supabase (Irlanda): Postgres + Auth + Storage
               │      (accesul e controlat de RLS, pe roluri)
               │
               └──► Supabase Edge Functions ──► Stripe (Checkout)
                         ▲                 ├──► Resend (emailuri)
                         │                 └──► program de facturare extern
                         │
              Stripe webhooks (confirmă plățile)
```

## Roluri

| Rol | Pe scurt |
|---|---|
| `client` | Cumpără, plătește, își vede comenzile, abonamentele și programările. |
| `angajat` | Operațiuni zilnice: comenzi, prezență, rapoarte operaționale. |
| `admin` | Tot, inclusiv produse, prețuri, conturile angajaților și rapoartele financiare. |
| `super_admin` | Proprietarul clientului: tot ce poate un admin, plus crearea și dezactivarea conturilor de admin (D-035). |

## Structura planificată (D-011)

```
apps/
  sandbox/            site pentru testarea framework-ului (există, D-028)
  arte-martiale/      primul client: branding, pagini, module active (mai târziu)
libs/
  ui/                 componente și teme comune; stilul și picker-ul există (D-047, D-048)
  auth/               roluri, permisiuni, guards (există, D-038); autentificare cu link magic (mai târziu)
  shop/               catalog, coș, checkout
  admin/              panou de administrare
  reports/            rapoarte, grafice, export CSV
supabase/
  migrations/         schema, singura cale de a modifica baza de date (există, D-038)
  tests/              testele migrărilor, rulate pe Postgres în memorie (există, D-038)
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
| Teste pentru `libs/auth` | `npx nx test auth` |
| Teste pentru `libs/ui` | `npx nx test ui` |
| Teste pentru baza de date | `npx nx test supabase` |
| Link de autentificare pentru teste (cere `SUPABASE_SECRET_KEY` în terminal, D-046) | `node tools/dev-login.mjs <email>` |
| Lint | `npx nx lint sandbox` |

## Publicare pe Vercel

Proiectul `pray-45/pray45-framework` publică deocamdată `apps/sandbox`. Comenzile de instalare și de build sunt în `apps/sandbox/vercel.json`, așa că în Vercel, la **Settings → Build and Deployment**, se setează doar:

| Setare | Valoare |
|---|---|
| Root Directory | `apps/sandbox` |
| Include files outside the root directory in the Build Step | activată |
| Node.js Version | 22.x |

Build Command, Output Directory și Install Command rămân fără override în dashboard. Un domeniu propriu trebuie adăugat în `security.allowedHosts` din `apps/sandbox/project.json` sau în variabila de mediu `NG_ALLOWED_HOSTS` (D-029).
