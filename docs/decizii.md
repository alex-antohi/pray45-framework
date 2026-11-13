# Jurnalul deciziilor

Aici se notează fiecare decizie despre proiect: tehnică, de produs sau de design. Regulile de actualizare sunt în `AGENTS.md`.

**Statusuri**
- **Propusă**: recomandare, neconfirmată încă de utilizator.
- **Acceptată**: confirmată de utilizator, încă neimplementată.
- **Implementată**: există în cod; câmpul „Implementare” spune unde.
- **Înlocuită de D-0XX**: nu mai e valabilă; vezi decizia nouă.

Intrările noi se adaugă la final, cu următorul număr liber. Intrările vechi nu se rescriu; li se poate schimba doar statusul.

## Întrebări deschise

| # | Întrebare | Note |
|---|---|---|
| Q-10 | Adresa de contact reală a studioului | `contact@pray45.io` e provizorie (D-022). |

Întrebări închise: Q-1 → D-017 · Q-2 → D-018 · Q-3 → D-022 · Q-4 → D-020 · Q-6 → D-019 · Q-5, Q-7, Q-8, Q-9 → D-045 · Q-11 → D-050 · Q-12 → D-052.

---

## D-001 · Scopul proiectului
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Context:** Vrem să construim mai multe site-uri pentru clienți fără să o luăm de la zero de fiecare dată.
- **Decizie:** Construim un framework refolosibil pentru site-uri de prezentare și magazine online. Capabilități de bază: design modern, magazin și plăți online, conturi pentru clienți, angajați și administratori, autentificare prin email și rapoarte. Primul client este o școală de arte marțiale.
- **Consecințe:** Tot ce construim pentru primul client trebuie gândit ca să poată fi refolosit (vezi D-011).
- **Implementare:** —

## D-002 · Frontend: Angular
- **Status:** Înlocuită de D-027
- **Data:** 2026-11-08
- **Context:** Preferința utilizatorului.
- **Decizie:** Frontend-ul se scrie în Angular (ultima versiune stabilă), cu TypeScript.
- **Implementare:** —

## D-003 · Fără backend dedicat
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Context:** Utilizatorul a lucrat mult cu C#, dar îl consideră prea complicat pentru acest tip de proiect. Opțiunile discutate: Node.js sau fără backend (ca în proiectul draftless).
- **Decizie:** Nu avem un API separat. Angular comunică direct cu Supabase, iar securitatea e asigurată de RLS (D-008). Operațiile care au nevoie de secrete (Stripe, emailuri, facturare, acțiuni de admin) rulează în **Supabase Edge Functions** (TypeScript), câteva funcții mici, nu un proiect de API.
- **Consecințe:** Nu avem server de întreținut. Dacă apare logică grea pe server, se poate adăuga ulterior un serviciu Node.js (de ex. NestJS) fără să refacem restul.
- **Implementare:** —

## D-004 · Bază de date și autentificare: Supabase
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Decizie:** Supabase: Postgres pentru date, Supabase Auth pentru conturi, Supabase Storage pentru fișiere (de ex. poze cu produse).
- **Implementare:** —

## D-005 · Plăți: Stripe
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Decizie:** Plățile se fac prin Stripe. Folosim **Stripe Checkout** (pagina de plată găzduită de Stripe), atât pentru cumpărături unice, cât și pentru abonamente recurente. Datele cardului nu trec niciodată prin aplicația noastră.
- **Consecințe:** Comenzile și abonamentele se confirmă doar prin webhook-uri Stripe verificate (vezi `AGENTS.md`). Facturarea fiscală e tratată separat (D-021).
- **Implementare:** —

## D-006 · Găzduire: Vercel
- **Status:** Implementată
- **Data:** 2026-11-08
- **Decizie:** Fiecare site al unui client este un proiect Vercel separat, legat de repository-ul GitHub. Push pe `main` publică în producție; celelalte branch-uri primesc un URL de previzualizare.
- **Implementare:** Proiectul Vercel `pray-45/pray45-framework` este creat. Când apar aplicațiile în `apps/`, fiecare are nevoie de propriul „Root Directory” și de propria comandă de build în Vercel. Pentru `apps/sandbox`: `apps/sandbox/vercel.json` și `tools/vercel/build-output.mjs` (D-029). Verificat în producție pe https://pray45-framework.vercel.app.

## D-007 · Autentificare prin email
- **Status:** Acceptată · metoda e stabilită în D-018
- **Data:** 2026-11-08
- **Decizie:** Utilizatorii se autentifică prin email, cu Supabase Auth.
- **Implementare:** —

## D-008 · Roluri: client, angajat, admin
- **Status:** Acceptată (cerința) · Înlocuită de D-034 (mecanismul)
- **Data:** 2026-11-08
- **Decizie:** Există trei tipuri de cont: **client** (cumpără, își vede comenzile și abonamentele), **angajat** (operațiuni zilnice, de ex. comenzi și prezență) și **admin** (tot, inclusiv conturile angajaților și rapoartele financiare).
- **Mecanism propus:** tabelul `profiles` (legat de `auth.users`) cu coloana `role`. Politicile RLS din Postgres decid ce vede și ce modifică fiecare rol. Rolurile se schimbă doar de un admin, printr-o funcție pe server.
- **Implementare:** —

## D-009 · Rapoarte
- **Status:** Acceptată (cerința) · Propusă (mecanismul)
- **Data:** 2026-11-08
- **Decizie:** Platforma are rapoarte pentru angajați și admini.
- **Mecanism propus:** Calculele se fac în Postgres (views și funcții SQL, protejate de RLS). Angular le afișează ca grafice și tabele, cu export CSV.
- **Implementare:** —

## D-010 · Angular cu SSR (randare pe server)
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Site-urile de prezentare și magazinele trebuie să apară bine în Google și să se încarce repede. Fără SSR, Angular trimite crawler-elor o pagină goală.
- **Decizie:** Folosim `@angular/ssr`. Paginile publice sunt randate pe server sau pre-randate. Zona de cont și cea de admin pot rula doar în browser.
- **Implementare:** `apps/sandbox/src/server.ts`, `apps/sandbox/src/app/app.routes.server.ts`.

## D-011 · Monorepo Nx
- **Status:** Implementată (workspace-ul) · Acceptată (`libs/` și aplicațiile clienților)
- **Data:** 2026-11-08
- **Decizie:** Un singur repository Nx. Fiecare client are o aplicație subțire în `apps/<client>/` (branding, pagini, ce module sunt active). Funcționalitatea comună stă în `libs/`: `ui`, `auth`, `shop`, `admin`, `reports`, `invoicing`.
- **Consecințe:** O corectură într-un modul comun ajunge la toți clienții. Fiecare aplicație din `apps/` e un proiect Vercel separat (D-006).
- **Implementare:** `nx.json`, `package.json`, `apps/sandbox/` (D-028), `libs/auth/` (D-038), `libs/ui/` (D-047). Celelalte biblioteci nu există încă.

## D-012 · UI: Tailwind CSS v4 + PrimeNG
- **Status:** Acceptată · amânată de D-031
- **Data:** 2026-11-08
- **Decizie:** Tailwind v4 pentru paginile publice, ca fiecare client să aibă un aspect propriu. PrimeNG pentru zona de admin și rapoarte: tabele de date, filtre, grafice și formulare gata făcute.
- **Implementare:** —

## D-013 · Un proiect Supabase pentru fiecare client
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Decizie:** Fiecare client are propriul proiect Supabase. Schema e aceeași pentru toți și se aplică prin migrările din repository.
- **Consecințe:** Datele clienților sunt complet separate, costurile se pot factura per client, iar o problemă la un client nu îi afectează pe ceilalți.
- **Implementare:** —

## D-014 · Emailuri: Resend
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Context:** Emailul inclus în Supabase are limite foarte mici. În producție, emailurile de autentificare ar eșua.
- **Decizie:** Resend, configurat ca server SMTP în Supabase Auth și folosit din Edge Functions pentru emailurile tranzacționale (confirmare comandă, factură, abonament expirat etc.).
- **Implementare:** —

## D-015 · Limbă: documentație în română, cod în engleză
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Decizie:** README, AGENTS, jurnalul deciziilor și prezentarea pentru clienți se scriu în română. Codul, comentariile din cod și mesajele de commit se scriu în engleză. Textele afișate pe site sunt în limba clientului.
- **Implementare:** —

## D-016 · Documentația se actualizează odată cu deciziile
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Cerința utilizatorului: toți agenții care lucrează la proiect actualizează documentația când se ia și când se implementează o decizie.
- **Decizie:** Regulile de actualizare sunt în `AGENTS.md` (încărcat automat de agenți prin `CLAUDE.md`). Ele acoperă acest jurnal, `README.md` și prezentarea pentru clienți.
- **Implementare:** `AGENTS.md`, `CLAUDE.md`, `docs/decizii.md`, `docs/prezentare/index.html`.

## D-017 · Nume: pray45-framework, studioul Pray45
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Decizie:** Proiectul se numește **pray45-framework**. Studioul care construiește site-urile se numește **Pray45**.
- **Implementare:** Repository: https://github.com/alex-antohi/pray45-framework · Vercel: https://vercel.com/pray-45/pray45-framework

## D-018 · Autentificare doar prin link magic
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Decizie:** Fără parole. Utilizatorul își introduce adresa de email și primește un link care îl autentifică. Același flux creează contul la prima utilizare.
- **Propunere de detaliu:** emailul conține, pe lângă link, și un cod de 6 cifre (Supabase Auth suportă coduri OTP pe email). Codul rezolvă cazul în care linkul e deschis pe alt dispozitiv decât cel pe care se face cumpărătura.
- **Consecințe:** D-014 (Resend) e necesar înainte de lansare, altfel emailurile de autentificare ating limita Supabase.
- **Implementare:** —

## D-019 · Cumpărare doar cu cont, cont creat direct în checkout
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Decizie:** Nu se poate cumpăra fără cont. Contul se creează direct în fluxul de cumpărare, fără o pagină separată de înregistrare. Clientul pune produsele în coș, la „Finalizează” își scrie emailul, confirmă prin link sau cod (D-018) și ajunge înapoi în același coș, apoi pe pagina de plată Stripe.
- **Consecințe:** Coșul trebuie păstrat cât timp clientul își verifică emailul (local în browser, apoi salvat în cont după autentificare). Datele de facturare (D-021) se cer o singură dată și se salvează în cont.
- **Implementare:** —

## D-020 · Regiunea datelor: Frankfurt (eu-central-1)
- **Status:** Înlocuită de D-040
- **Data:** 2026-11-08
- **Context:** Supabase permite alegerea regiunii pentru fiecare proiect, la creare. Regiunea nu se poate schimba ulterior fără migrarea într-un proiect nou. Regiunile din UE sunt Frankfurt (`eu-central-1`), Irlanda (`eu-west-1`), Paris (`eu-west-3`) și Stockholm (`eu-north-1`). Londra și Zürich sunt în Europa, dar nu în UE. Regiunea generală „Europe” poate ajunge în afara UE, deci se alege o regiune anume.
- **Decizie:** Toate proiectele Supabase ale clienților (D-013) se creează în **Frankfurt (`eu-central-1`)**: este în UE (pentru GDPR) și e cea mai apropiată regiune de România.
- **Surse:** https://supabase.com/docs/guides/platform/regions · https://supabase.com/regions
- **Implementare:** —

## D-021 · Facturare: emitentul este clientul, factura se generează automat după plată
- **Status:** Înlocuită de D-045
- **Data:** 2026-11-08
- **Context:** Stripe încasează banii, dar chitanțele Stripe nu sunt facturi fiscale. Din 2025, în România, facturile către persoane fizice (B2C) se transmit și prin RO e-Factura (SPV). Pentru plățile online, regula „bon fiscal sau factură” e neclară, după sursele consultate.
- **Decizie propusă:**
  1. **Cine emite.** Factura către cumpărător o emite **firma clientului** (de ex. școala), pe CUI-ul ei, din contul ei în programul de facturare. Pray45 nu emite facturi în numele clienților. Pray45 își facturează doar propriile servicii către clienți, separat de platformă.
  2. **Când.** Automat, pentru **fiecare plată reușită**, inclusiv fiecare reînnoire de abonament. Declanșatorul e webhook-ul Stripe verificat: `checkout.session.completed` pentru plățile unice și `invoice.paid` pentru abonamente. O factură pentru fiecare plată online evită zona neclară a bonului fiscal (de confirmat cu contabilul, Q-9).
  3. **Cum.** O Edge Function apelează API-ul programului de facturare al clientului (SmartBill sau Oblio, după Q-8). Programul generează factura și o transmite în e-Factura. Cumpărătorul primește PDF-ul pe email (Resend) și îl găsește și în contul lui.
  4. **Fără dubluri.** Fiecare plată Stripe se leagă de cel mult o factură (cheie unică pe ID-ul plății), ca să nu se emită două facturi când Stripe retrimite un webhook.
  5. **Rambursări.** O rambursare din Stripe (`charge.refunded`) generează automat factura de stornare.
  6. **Date de facturare.** Se cer o singură dată și se salvează în cont: nume și adresă, opțional firmă și CUI pentru persoane juridice. CNP-ul nu se cere; pentru persoane fizice fără CNP se folosește codul generic din 13 zerouri.
  7. **Modul comun.** `libs/invoicing` definește o interfață comună, cu câte un adaptor pentru fiecare program de facturare, ca fiecare client să-și poată folosi programul lui.
- **De verificat înainte de implementare:** cu ce abonament SmartBill e disponibil API-ul (paginile lor de ajutor se contrazic) și dacă transmiterea în e-Factura se poate declanșa prin API, la SmartBill și la Oblio.
- **Surse:** https://www.solo.ro/blog/e-factura-b2c · https://incasez.ro/blog/e-factura-b2c-magazin-online · https://ajutor.smartbill.ro/article/196-integrare-api · https://api.smartbill.ro
- **Implementare:** —

## D-022 · Contactul din prezentare
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Decizie:** Prezentarea pentru clienți e semnată **Pray45**, cu adresa de contact `contact@pray45.io`. Adresa e **provizorie** și se înlocuiește când există una reală (Q-10).
- **Implementare:** `docs/prezentare/index.html` (secțiunea Contact și subsolul).

## D-023 · Lucrul cu Git: branch-uri și review înainte de commit
- **Status:** Implementată
- **Data:** 2026-11-08
- **Decizie:** Se lucrează pe branch-uri, niciodată direct pe `main`. Agenții **nu fac commit și nu fac push** până când utilizatorul nu a verificat modificările și nu a spus explicit că sunt în regulă. Deocamdată nu folosim pull request-uri.
- **Implementare:** `AGENTS.md`, secțiunea „Lucrul cu Git”.

## D-024 · Facturare în etape: întâi programul clientului, apoi modulul nostru
- **Status:** Înlocuită de D-045
- **Data:** 2026-11-08
- **Context:** Am discutat varianta unui program de facturare propriu. E posibil, dar presupune trimiterea directă în RO e-Factura (XML UBL 2.1 / CIUS-RO, API-ul ANAF, autorizarea fiecărei firme cu certificat digital), arhivarea și exportul pentru contabil. Toate acestea înseamnă săptămâni de lucru și responsabilitate legală pentru corectitudinea facturilor.
- **Decizie:**
  1. **Etapa 1:** pentru primii clienți (inclusiv școala de arte marțiale) ne conectăm la programul de facturare pe care îl folosesc deja (SmartBill, Oblio etc.).
  2. **Etapa 2:** construim modulul nostru de facturare („pray45”), cu trimitere directă în e-Factura, ca adaptor nou. Îl facem când avem destui clienți încât abonamentele lor la programe de facturare să conteze sau când un client îl cere explicit.
- **Consecințe:** Trecerea unui client de la un program la altul e o schimbare de configurare, nu de cod (D-025).
- **Implementare:** —

## D-025 · Facturare pluginabilă: interfață comună și adaptoare injectate
- **Status:** Înlocuită de D-045
- **Data:** 2026-11-08
- **Context:** Datele noastre trebuie să se poată conecta ușor la orice program de facturare, inclusiv la modulul nostru viitor (D-024). Detaliază punctul 7 din D-021.
- **Decizie:**
  1. **Datele noastre sunt sursa de adevăr.** Facturile există mereu întâi în baza noastră (`invoices`, `invoice_lines`, `billing_profiles`, `invoice_events`), indiferent de program. Programul extern doar le emite oficial. Noi păstrăm numărul, seria, PDF-ul și starea e-Factura primite înapoi. Clientul își vede facturile din baza noastră, nu din programul extern.
  2. **O singură interfață (port).** `libs/invoicing/core` definește interfața `InvoiceProvider`, în TypeScript pur, fără dependențe de Angular sau de Deno, ca să ruleze în Edge Functions și în teste. Operații: `issue` (emite), `cancel` (stornează), `getStatus` (starea e-Factura), `getPdf`, `validateConfig`, plus o listă de `capabilities` (ce știe programul: e-Factura, stornare, PDF etc.).
  3. **Câte un adaptor pentru fiecare program.** `libs/invoicing/adapters/<nume>/`: `smartbill`, `oblio`, mai târziu `pray45` (modulul nostru), plus:
     - `fake`: emite local, fără apeluri externe, pentru dezvoltare și teste;
     - `export`: nu are API, doar produce fișiere (CSV, XML UBL) pe care contabilul le importă în orice program.
  4. **Injectarea dependențelor.** Codul de business (webhook-uri, rambursări) depinde doar de interfața `InvoiceProvider`, niciodată de un adaptor anume. Un registru (`ProviderRegistry`) asociază numele unui program cu o funcție care construiește adaptorul. Edge Function-ul citește configurarea clientului (tabelul `invoicing_settings`: ce program și setările nesecrete; cheile API stau în secretele Supabase), cere adaptorul din registru și îl injectează prin constructor în serviciul de facturare. Pe server nu folosim un framework de DI. În Angular nu e nevoie de adaptor, pentru că frontend-ul citește doar tabelele noastre.
  5. **Flux sigur (outbox).** Webhook-ul Stripe creează factura în baza noastră cu starea `pending` și cheie unică pe ID-ul plății, apoi un pas separat o trimite la program. Dacă programul nu răspunde, factura nu se pierde: se reîncearcă, iar stările (`pending` → `issued` / `failed`) se notează în `invoice_events`.
  6. **Teste de contract.** O suită comună de teste prin care trebuie să treacă fiecare adaptor. Un program nou se adaugă cu un dosar nou în `adapters/`, o linie în registru și testele de contract trecute.
- **Implementare:** —

## D-026 · Excepție de la D-023: configurarea inițială direct pe main
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Repository-ul e gol, deci nu există încă un `main` din care să pornească un branch.
- **Decizie:** Prima configurare a workspace-ului se face direct pe `main`. Regula de review rămâne: nimic nu se comite și nu se împinge până când utilizatorul nu a verificat modificările și nu a spus explicit că sunt în regulă. După această configurare se revine la branch-uri (D-023).
- **Implementare:** commit-ul inițial de pe `main`.

## D-027 · Angular 21 și PrimeNG 21, ultima versiune MIT
- **Status:** Implementată (Angular 21) · Acceptată (PrimeNG 21, amânat de D-031) · înlocuiește D-002
- **Data:** 2026-11-08
- **Context:** PrimeNG 22 nu mai are licență MIT: are o licență dublă Community/Commercial și cere o cheie de licență. PrimeNG 21 și versiunile mai vechi rămân MIT. PrimeNG 22 cere Angular 22, iar PrimeNG 21 cere Angular 21.
- **Decizie:** Folosim Angular 21 cu PrimeNG 21.1.10 (MIT), în locul „ultimei versiuni stabile” din D-002. Frontend-ul rămâne Angular cu TypeScript.
- **Consecințe:** Nu e nevoie de cheie de licență. Node.js trebuie să fie `^22.12.0` sau `^24.0.0`. Trecerea la Angular 22 înseamnă și trecerea la PrimeNG 22, cu licența Community dacă studioul se încadrează în condițiile ei, sau alegerea altei biblioteci.
- **Surse:** https://primeng.dev/migration/v22 · https://primeui.dev/pricing · https://primeui.dev/nextchapter
- **Implementare:** `package.json`.

## D-028 · Site gol pentru testarea framework-ului
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Înainte de site-urile reale, framework-ul are nevoie de un loc în care să fie testat.
- **Decizie:** Singura aplicație, deocamdată, este `apps/sandbox`: un site gol, cu aceeași configurație ca a viitoarelor site-uri (SSR, Tailwind, PrimeNG). Site-ul școlii de arte marțiale și site-ul propriu Pray45 nu se fac acum.
- **Consecințe:** Proiectul Vercel `pray-45/pray45-framework` publică deocamdată sandbox-ul. Prezentarea pentru clienți rămâne în `docs/prezentare/index.html` și se publică în continuare ca Artifact.
- **Implementare:** `apps/sandbox/`.

## D-029 · Publicarea pe Vercel prin Build Output API
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Presetul Vercel pentru Angular nu tratează SSR-ul: trimite toate cererile către `index.html`.
- **Decizie propusă:** Fiecare aplicație are propriul `vercel.json`, deci în Vercel se setează doar „Root Directory”. După build, `tools/vercel/build-output.mjs` pune fișierele statice în `.vercel/output/static` și serverul Angular într-o funcție Node.js.
- **Consecințe:** Domeniile pe care rulează SSR-ul trebuie permise în `security.allowedHosts` (`project.json`) sau în variabila de mediu `NG_ALLOWED_HOSTS`. Sunt permise `localhost` și `*.vercel.app`; un domeniu propriu trebuie adăugat.
- **Surse:** https://vercel.com/docs/build-output-api · https://vercel.com/docs/monorepos/nx
- **Implementare:** `apps/sandbox/vercel.json`, `tools/vercel/build-output.mjs`. Verificat în producție pe https://pray45-framework.vercel.app.

## D-030 · Prezentarea nu mai e publicată ca Artifact
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Artifactul de pe claude.ai era doar o copie online a fișierului din repository și trebuia republicat manual la fiecare modificare.
- **Decizie:** Artifactul a fost șters. Sursa prezentării rămâne `docs/prezentare/index.html`. Deocamdată pagina nu e publicată online.
- **Consecințe:** Înlocuiește partea din D-028 despre publicarea ca Artifact. Când prezentarea trebuie trimisă clienților, va avea nevoie de o adresă web nouă.
- **Implementare:** `AGENTS.md`, `README.md`.

## D-031 · Primul commit fără CSS
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** `apps/sandbox` e un site gol, iar nimic din el nu are nevoie încă de stiluri.
- **Decizie:** Tailwind CSS și PrimeNG nu se instalează în primul commit. Rămân alegerile pentru UI (D-012, D-027) și se adaugă atunci când apare o pagină care are nevoie de ele.
- **Consecințe:** Înlocuiește partea din D-028 potrivit căreia sandbox-ul are Tailwind și PrimeNG.
- **Implementare:** `package.json`, `apps/sandbox/`.

## D-032 · SSR pe Vercel: antete de proxy și Node.js 22
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** La primul deployment, Angular a trimis pagina goală, doar pentru browser, pentru că Vercel adaugă antetele `x-forwarded-for` și `x-forwarded-port`, în care Angular nu are încredere implicit. În plus, Vercel servea `index.csr.html` la adresa `/`, iar `engines` din `package.json` permitea Node.js 24, deși proiectul e setat pe 22.x.
- **Decizie propusă:** Funcția de pe Vercel primește variabila `NG_TRUST_PROXY_HEADERS`, doar acolo, pentru că documentația Angular recomandă asta numai în spatele unui proxy de încredere. `index.csr.html` nu se mai publică drept fișier static. Node.js se limitează la `^22.12.0`, aceeași versiune local, la build și în funcție.
- **Consecințe:** Înlocuiește partea din D-027 care permitea și Node.js 24. Lista de domenii permise (D-029) rămâne activă.
- **Surse:** https://angular.dev/best-practices/security
- **Implementare:** `tools/vercel/build-output.mjs`, `package.json`. Verificat în producție pe https://pray45-framework.vercel.app.

## D-033 · Funcția SSR rulează în Frankfurt
- **Status:** Înlocuită de D-040
- **Data:** 2026-11-08
- **Context:** Implicit, Vercel rulează funcțiile în Washington (`iad1`), iar datele din Supabase vor fi în Frankfurt (D-020). Fiecare interogare făcută la randarea pe server ar traversa Atlanticul.
- **Decizie:** Funcția SSR rulează în Frankfurt (`fra1`).
- **Implementare:** `tools/vercel/build-output.mjs`. Verificat în producție: antetul `x-vercel-id` arată `fra1::fra1`.

## D-034 · Permisiuni per utilizator, cu valori implicite pe rol
- **Status:** Implementată · înlocuiește mecanismul din D-008 · punctul 2 și consecințele sunt înlocuite de D-036
- **Data:** 2026-11-08
- **Context:** Cele trei roluri fixe din D-008 nu acoperă ce promite prezentarea: un angajat poate primi acces la rapoartele financiare sau la modificarea produselor „doar dacă adminul îi dă acces”.
- **Decizie:**
  1. Fiecare cont are un rol (`client`, `angajat`, `admin`) în `profiles.role` și o listă proprie de permisiuni în `user_permissions`.
  2. Fiecare rol are un set implicit de permisiuni (`role_permissions`). Când se creează un cont, setul implicit se copiază la acel utilizator. După aceea, permisiunile lui se pot modifica individual.
  3. Toate rolurile folosesc aceeași interfață. Codul verifică permisiuni (`can('reports.financial')`), nu roluri. Meniul, rutele (`canMatch`) și paginile folosesc aceeași verificare.
  4. Accesul real e impus în baza de date: politicile RLS folosesc funcția SQL `has_permission()`, care citește aceleași date.
  5. Rolurile și permisiunile se schimbă doar printr-o funcție pe server. Un utilizator nu își poate modifica propriul rol sau propriile permisiuni și nu poate acorda permisiuni pe care nu le are.
  6. Conturile de client se creează singure la prima autentificare (D-019), deci rolul `client` și permisiunile implicite se setează în baza de date, la crearea contului, niciodată din date trimise de browser.
- **Consecințe:** Schimbarea valorilor implicite afectează doar conturile noi. Când un modul nou adaugă o permisiune, migrarea lui trebuie să o acorde și utilizatorilor existenți, după rol.
- **Implementare:** `supabase/migrations/20261108120000_access_control.sql`, `libs/auth/` (D-038).

## D-035 · Super-admin: singurul care creează admini
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Context:** D-008 nu spune cine creează adminii. Un admin care poate numi alți admini sau își poate acorda orice drept anulează separarea din D-034.
- **Decizie:**
  1. Rol nou, `super_admin`: aceeași interfață ca a unui admin, plus crearea și dezactivarea conturilor de admin. Adminii gestionează în continuare conturile de angajați.
  2. E un rol, nu o permisiune, și nu se poate acorda din aplicație. Se setează doar cu un script care folosește cheia `service_role`, la configurarea clientului, în proiectul Supabase al acestuia (D-013).
- **Deținător:** proprietarul clientului (de ex. proprietarul școlii). Pray45 nu are nevoie de cont în aplicație: repară accesul cu scriptul.
- **Implementare:** Regula e în `supabase/migrations/20261108120000_access_control.sql` (D-038): rangul cel mai mare nu se poate atribui din aplicație. Rolul în sine îl adaugă fiecare aplicație.

## D-036 · Valorile implicite ale unui rol se aplică și conturilor existente
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** D-034 copiază valorile implicite la crearea contului, deci o schimbare ulterioară ar ajunge doar la conturile noi. În plus, o copie nu poate deosebi o permisiune refuzată intenționat de una pe care utilizatorul nu a avut-o niciodată.
- **Decizie:** Când o permisiune se adaugă la valorile implicite ale unui rol, fie că e una existentă, fie una nouă (de exemplu o pagină nouă), o primesc toți utilizatorii existenți cu acel rol.
- **Mecanism:**
  1. Valorile implicite nu se mai copiază. `role_permissions` rămâne singura sursă pentru un rol, iar `user_permission_overrides` păstrează doar excepțiile unui utilizator (acordat sau refuzat).
  2. `has_permission()` citește întâi excepția utilizatorului, apoi valoarea implicită a rolului.
  3. O excepție rămâne valabilă când se schimbă valorile implicite. „Revino la implicit” o șterge. La schimbarea rolului, excepțiile se șterg.
  4. Rolul limitează ce permisiuni pot fi acordate: un cont de client nu poate primi permisiuni rezervate echipei.
- **Consecințe:** Înlocuiește punctul 2 și consecințele din D-034. Un cont nou pornește de la valorile implicite ale rolului, iar migrările nu mai trebuie să actualizeze conturile existente. Rolul rămâne necesar: definește valorile implicite, cine gestionează pe cine și ce permisiuni sunt posibile.
- **Implementare:** `supabase/migrations/20261108120000_access_control.sql` (D-038).

## D-037 · Ierarhia rolurilor și gestionarea conturilor
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** D-035 stabilește doar cine creează adminii. Trebuie stabilit cine gestionează fiecare tip de cont.
- **Decizie:** Rangurile sunt, de sus în jos: `super_admin`, `admin`, `angajat`, `client`. Fiecare rang gestionează toate rangurile de sub el. Nimeni nu gestionează conturi de același rang sau de rang mai mare.
- **Mecanism:**
  1. Câte o permisiune pentru fiecare tip de cont gestionat: `clients.manage`, `employees.manage`, `admins.manage`.
  2. O acțiune asupra unui cont e permisă doar dacă sunt adevărate ambele condiții: cel care acționează are rang mai mare decât contul vizat și are permisiunea pentru acel tip de cont. Verificarea se face în funcția de pe server (D-034).
  3. Permisiunea poate fi retrasă individual, ca oricare alta (D-036), dar nu poate depăși rangul: `admins.manage` rămâne doar la `super_admin` (D-035).
  4. Un utilizator poate atribui doar roluri de sub rangul lui.
- **Implementare:** `supabase/migrations/20261108120000_access_control.sql`, `libs/auth/` (D-038).

## D-038 · Cadru generic pentru roluri și permisiuni
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Rolurile diferă de la o aplicație la alta, deci framework-ul nu trebuie să le cunoască.
- **Decizie:**
  1. Rolurile, rangurile și permisiunile sunt date pe care le adaugă fiecare aplicație. Framework-ul nu definește niciun rol.
  2. Singura regulă despre roluri din cod este cine gestionează pe cine: rang mai mare și permisiunea `<rol>.manage`. Aceste nume înlocuiesc exemplele din D-037, punctul 1.
  3. Un rând în `role_permissions` înseamnă că rolul poate avea permisiunea. Lipsa rândului înseamnă că nu o poate avea niciodată (D-036).
  4. Contul nou primește rolul cu rangul cel mai mic. Rangul cel mai mare nu se poate atribui din aplicație (D-035).
  5. Rolurile și permisiunile se schimbă prin funcții Postgres, ca verificările să stea lângă date (D-034, punctul 5).
- **Consecințe:** Angular primește datele printr-un `AccessLoader`, pentru că nu există încă un client Supabase. Crearea și dezactivarea conturilor nu sunt incluse. Înregistrarea eșuează până când aplicația își definește rolurile.
- **Implementare:** `supabase/migrations/20261108120000_access_control.sql`, `libs/auth/`. Testele migrării sunt în `supabase/tests/` și rulează pe Postgres (PGlite), cu autentificarea Supabase simulată. Migrarea e aplicată pe proiectul Supabase din D-039.

## D-039 · Proiectul Supabase al aplicației draftless se refolosește pentru framework
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Framework-ul are nevoie de o bază de date pentru teste, iar proiectul Supabase al aplicației draftless, care găzduiește și ear fish, poate fi refolosit.
- **Decizie:** Proiectul se golește complet și rămâne doar pentru framework și `apps/sandbox`. Clienții reali au în continuare proiecte separate (D-013).
- **Consecințe:** draftless și ear fish nu mai funcționează pe acest proiect, iar datele lor se pierd definitiv. Migrarea din `supabase/migrations/` nu trebuie adaptată la schema draftless. Proiectul e în Irlanda (D-040).
- **Implementare:** `supabase/config.toml`. Proiectul `fcdizyuyogaqwkbfrust` a fost golit, iar migrările sunt aplicate. Autentificarea eșuează până când se adaugă roluri (D-038).

## D-040 · Regiunea: Irlanda (eu-west-1), pentru date și funcții
- **Status:** Implementată · înlocuiește D-020 și D-033
- **Data:** 2026-11-08
- **Context:** Proiectul Supabase refolosit (D-039) e în Irlanda, iar regiunea unui proiect nu se poate schimba ulterior. Funcția SSR trebuie să stea lângă date.
- **Decizie:** Proiectele Supabase se creează în Irlanda (`eu-west-1`), iar funcția SSR rulează tot în Irlanda (`dub1`).
- **Consecințe:** Datele rămân în UE, deci motivul GDPR din D-020 rămâne valabil.
- **Implementare:** `tools/vercel/build-output.mjs`. Verificat în producție: antetul `x-vercel-id` arată `fra1::dub1`.

## D-041 · Task-urile se urmăresc în Trello
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Proiectul nu avea un loc pentru urmărirea task-urilor. Pentru dimensiunea lui, Trello acoperă ce am fi folosit din Jira. Legarea branch-urilor de carduri nu e automată, ca în Jira.
- **Decizie:**
  1. Task-urile stau pe board-ul Trello `pray45-framework`, cu listele Backlog, To Do, Doing, Verificare și Done.
  2. Fiecare card are un singur branch. Numele branch-ului se notează într-un comentariu pe card când începe lucrul, pentru că un branch ajunge pe GitHub abia după acordul utilizatorului (D-023).
  3. Agenții mută cardurile pe măsură ce lucrează: Doing la început, Verificare când modificările așteaptă verificarea utilizatorului, Done după commit și push.
  4. După push, branch-ul se atașează cardului prin GitHub Power-Up, din interfața Trello.
- **Consecințe:** `docs/decizii.md` rămâne sursa de adevăr pentru decizii; board-ul urmărește doar munca. O întrebare deschisă sau o decizie Propusă poate avea un card, dar răspunsul se notează tot în jurnal.
- **Implementare:** https://trello.com/b/IlBnNpRk/pray45-framework. GitHub Power-Up este activat pe board.

## D-042 · Întrebările deschise au prefixul Q
- **Status:** Implementată
- **Data:** 2026-11-08
- **Decizie:** Întrebările deschise se numerotează Q-N în loc de Î-N. Numerele rămân aceleași (de ex. Î-7 devine Q-7).
- **Consecințe:** Excepție, la cererea utilizatorului, de la regula că intrările vechi nu se rescriu: referințele la întrebări au fost actualizate și în intrările vechi.
- **Implementare:** `docs/decizii.md`, `README.md` și cardurile de pe board-ul Trello (D-041).

## D-043 · Rangul contează doar la schimbarea accesului
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Verificările obișnuite trebuie să depindă doar de permisiuni. Rangul stabilește doar ordinea dintre roluri, iar rolul are lista permisiunilor pe care le poate primi.
- **Decizie:**
  1. Toate verificările, inclusiv citirea conturilor, depind doar de permisiuni. Pentru a citi conturile unui rol e nevoie de `<rol>.manage`.
  2. Activarea, dezactivarea și resetarea unei permisiuni trec prin aceleași patru verificări: cel care acționează are `<rol>.manage` pentru rolul contului vizat, are rang mai mare decât acel cont, rolul contului vizat poate primi permisiunea, iar cel care acționează are el însuși permisiunea.
- **Consecințe:** Înlocuiește D-037, punctul 2, pentru citirea conturilor și extinde D-034, punctul 5: nimeni nu poate dezactiva o permisiune pe care nu o are. Schimbarea rolului păstrează verificările din D-037.
- **Implementare:** `supabase/migrations/20261108120000_access_control.sql`, `supabase/tests/`. Aplicată pe proiectul Supabase din D-039.

## D-044 · Rolul super_admin și crearea rolurilor din aplicație
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Fiecare proiect are nevoie de rolul `super_admin` (D-035), iar rangurile mai mari trebuie să poată crea ranguri mai mici și să le stabilească permisiunile implicite.
- **Decizie:**
  1. Migrarea adaugă rolul `super_admin`, cu rangul 1000. E singurul rol definit de framework.
  2. Cine are permisiunea `roles.manage` poate crea roluri cu rang mai mic decât al lui și poate schimba permisiunile implicite ale rolurilor de sub el. Pentru o schimbare a valorilor implicite trebuie să dețină el însuși permisiunea, indiferent dacă o activează sau o dezactivează.
  3. Rolul nou primește automat `<rol>.manage` pentru toate rolurile de sub el, iar rolurile de deasupra primesc `<rol_nou>.manage`. Niciun rol nu poate primi `.manage` pentru rangul lui sau pentru unul mai mare.
  4. Rangul cel mai mare deține orice permisiune pe care o introduce.
  5. Sign-up-ul nu atribuie niciodată rangul cel mai mare. Cât timp nu există un rol mai mic, contul nou nu are profil, deci nu are acces.
- **Consecințe:** Înlocuiește D-038, punctul 1, pentru `super_admin`, și regula din D-038 că înregistrarea eșuează când nu există roluri. Crearea unui rol nou de rang minim schimbă rolul primit la înregistrare.
- **Implementare:** `supabase/migrations/20261108120000_access_control.sql`, `supabase/tests/`, `libs/auth/src/lib/supabase/`, `apps/sandbox/src/app/app.config.ts`, `apps/sandbox/src/app/supabase.config.ts`.

## D-045 · Facturare printr-un program extern, plăți prin Stripe
- **Status:** Acceptată · înlocuiește D-021, D-024 și D-025
- **Data:** 2026-11-08
- **Decizie:** Facturile se emit printr-un program de facturare extern. Plățile rămân prin Stripe (D-005). Programul, integrarea și regulile fiscale nu sunt stabilite.
- **Consecințe:** Întrebările Q-5, Q-7, Q-8 și Q-9 se închid. Mențiunile despre facturare din D-003, D-005, D-011, D-014 și D-019 nu mai stabilesc nimic despre facturare.
- **Implementare:** —

## D-046 · Autentificare pentru teste cu un link generat local
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Conturile de test nu au neapărat o căsuță de email reală, iar autentificarea se face doar prin link magic (D-018).
- **Decizie:** Pentru teste, un script local generează linkul de autentificare și îl afișează în terminal, fără să trimită email. Scriptul folosește cheia secretă Supabase, citită din mediu. Nu face parte din aplicație.
- **Consecințe:** Autentificarea rămâne fără parole (D-018).
- **Implementare:** `tools/dev-login.mjs`. Neverificat încă cu cheia reală.

## D-047 · Stilul aplicației: trei fonturi, trei culori, numele, logo-ul și semnătura
- **Status:** Implementată · detaliile au fost confirmate de utilizator pe 2026-11-13 · detaliul 4 e înlocuit de D-052 (modul luminos sau întunecat) și de D-053 (fundalul)
- **Data:** 2026-11-11
- **Context:** Cerința utilizatorului: designul unei aplicații are doar câteva elemente, ca aspectul să se poată schimba ușor de la un client la altul.
- **Decizie:**
  1. Stilul are doar: font principal, font secundar, font de accent; culoare principală, culoare secundară, culoare de accent; numele brandului, logo-ul și semnătura (numele, mai pe scurt).
  2. Numele, logo-ul și semnătura există fiecare în format dreptunghiular și în format pătrat.
  3. Codul stă în `libs/ui`. Aplicațiile folosesc stilul prin variabile CSS (`--font-primary`, `--color-primary` etc.) și prin componenta `<lib-brand-mark>`. Valorile implicite le dă fiecare aplicație, cu `provideBrand()`.
- **Detalii (confirmate):**
  1. Rolul fonturilor: principalul pentru titluri și brand, secundarul pentru textul paginilor, cel de accent pentru etichete, cifre și evidențieri.
  2. Pentru fiecare culoare se calculează automat culoarea textului pus peste ea (`--color-on-primary` etc.): alb sau aproape negru, cea cu contrast mai mare.
  3. Un format fără imagine se afișează ca text cu fontul principal. Numele dreptunghiular stă pe un rând, iar cel pătrat are cuvintele unul sub altul. Semnătura apare ca text. Logo-ul pătrat devine un pătrat în culoarea principală, cu semnătura, iar logo-ul dreptunghiular devine logo-ul pătrat urmat de nume.
  4. Fundalul și culoarea textului obișnuit nu fac parte din stil. Le definește fiecare aplicație și urmează setarea de mod luminos sau întunecat a vizitatorului.
- **Consecințe:** Stilurile sunt CSS simplu, iar Tailwind rămâne neinstalat (D-031). Variabilele au numele din tema Tailwind v4 (`--font-*`, `--color-*`), deci se pot folosi direct când se instalează.
- **Implementare:** `libs/ui/src/lib/brand/`, `apps/sandbox/src/app/brand.config.ts`, `apps/sandbox/src/app/pages/home.ts` (pagina care arată toate elementele), `apps/sandbox/src/styles.css`, `apps/sandbox/public/brand/` (logo provizoriu).

## D-048 · Picker pentru stil, disponibil pe orice pagină
- **Status:** Implementată (cerința) · Acceptată (salvarea doar în browser, prin D-050) · punctul 4 înlocuit de D-050
- **Data:** 2026-11-11
- **Decizie:** Un buton „Stil”, fixat în colțul paginii, deschide un panou din care se aleg toate elementele din D-047. Schimbările se aplică imediat.
- **Mecanism propus:**
  1. Componenta `<lib-brand-picker>` stă în componenta rădăcină a aplicației, deci apare pe orice pagină. E un punct de intrare separat (`@pray45/ui/picker`) și se încarcă după pagină (`@defer`), ca un site care nu îl folosește să nu îl descarce.
  2. Fonturile se aleg dintr-o listă fixă (D-049), culorile din selectorul de culoare sau prin cod hex, iar imaginile se încarcă din calculator: SVG, PNG, WebP sau JPEG, cel mult 200 KB fiecare.
  3. Schimbările se păstrează doar în browserul în care s-au făcut (`localStorage`). Ceilalți vizitatori văd valorile implicite ale aplicației.
  4. În sandbox, picker-ul e vizibil pentru oricine.
- **Consecințe:** Deocamdată picker-ul e un instrument de lucru, nu o setare a site-ului. Cum se salvează stilul pentru toți vizitatorii și cine îl poate schimba rămâne de stabilit (Q-11).
- **Implementare:** `libs/ui/picker/`, `apps/sandbox/src/app/app.ts`.

## D-049 · Fonturile se încarcă de la Bunny Fonts, dintr-o listă fixă
- **Status:** Înlocuită de D-051
- **Data:** 2026-11-11
- **Context:** Picker-ul trebuie să poată încerca multe fonturi fără ca toate să fie incluse în aplicație. Google Fonts, încărcat direct din pagină, trimite adresa IP a vizitatorului către Google, iar un tribunal din München a considerat asta o încălcare a GDPR (LG München I, 3 O 17493/20, ianuarie 2022).
- **Decizie propusă:**
  1. Fonturile se încarcă de la Bunny Fonts (`fonts.bunny.net`), al unei firme din UE. Serviciul e compatibil cu API-ul Google Fonts și declară că nu păstrează loguri.
  2. Lista are 15 fonturi, plus fontul sistemului, care nu se descarcă: fonturi fără serife, cu serife, de afiș, monospace și scris de mână. Toate au ș și ț cu virgulă.
  3. Se descarcă doar cele trei fonturi alese, într-o singură cerere.
- **De știut:** pentru unele fonturi, CSS-ul de la Bunny trimite browserul să descarce fișierele de pe `cdn.jsdelivr.net` (Fontsource), nu de pe serverele Bunny.
- **Alternativă:** fonturile alese de un client se găzduiesc pe domeniul site-ului lui (pachetele Fontsource), fără niciun serviciu extern. Picker-ul ar folosi în continuare Bunny Fonts.
- **Surse:** https://fonts.bunny.net/about
- **Implementare:** `libs/ui/src/lib/brand/fonts.ts`, `libs/ui/src/lib/brand/brand.service.ts`.

## D-050 · Picker-ul apare doar cu permisiunea brand.manage, iar stilul stă în codul aplicației
- **Status:** Implementată · migrarea nu e aplicată încă pe proiectul Supabase
- **Data:** 2026-11-13
- **Context:** Răspunsul utilizatorului la Q-11.
- **Decizie:**
  1. Stilul unui site stă în codul aplicației lui (de ex. `apps/sandbox/src/app/brand.config.ts`), deocamdată. Nu se salvează în baza de date.
  2. Picker-ul apare doar pentru utilizatorii cu permisiunea `brand.manage`. Rămâne un instrument de lucru: schimbările făcute în el se păstrează doar în browserul acelui utilizator (D-048, punctul 3).
  3. `super_admin` are permisiunea implicit și o poate acorda altor roluri cu `set_role_permission` (D-044).
- **Consecințe:** Înlocuiește D-048, punctul 4: picker-ul nu mai e vizibil pentru oricine pe sandbox. Ca un stil ales în picker să ajungă la vizitatori, valorile se copiază în codul aplicației. Verificarea din Angular doar ascunde picker-ul; nu protejează nimic, pentru că picker-ul nu scrie în baza de date.
- **Implementare:** `supabase/migrations/20261113120000_brand_permission.sql`, `supabase/tests/access_control.test.mjs`, `apps/sandbox/src/app/app.ts`. Până la aplicarea migrării pe proiectul Supabase (D-039), picker-ul nu apare pentru nimeni pe sandbox.

## D-051 · Fonturile se încarcă de la Google Fonts
- **Status:** Implementată · înlocuiește D-049
- **Data:** 2026-11-13
- **Context:** Alegerea utilizatorului: Google Fonts e serviciul cel mai folosit.
- **Decizie:** Fonturile din listă (aceleași 15 din D-049, plus fontul sistemului) se încarcă de la Google Fonts (`fonts.googleapis.com`, fișierele de pe `fonts.gstatic.com`). Se descarcă doar cele trei fonturi alese, într-o singură cerere.
- **Consecințe:** Browserul vizitatorului trimite adresa IP către Google la fiecare vizită. Un tribunal din München a considerat asta o încălcare a GDPR fără acordul vizitatorului (LG München I, 3 O 17493/20, ianuarie 2022). Riscul rămâne de tratat la lansare: acordul vizitatorului, mențiunea în politica de confidențialitate sau găzduirea fonturilor pe domeniul site-ului.
- **Implementare:** `libs/ui/src/lib/brand/fonts.ts`, `libs/ui/src/lib/brand/brand.service.ts`.

## D-052 · Fără mod luminos și mod întunecat
- **Status:** Implementată
- **Data:** 2026-11-13
- **Context:** Răspunsul utilizatorului la Q-12.
- **Decizie:** Un site arată mereu cum și-a ales clientul stilul, indiferent de setarea de mod luminos sau întunecat a vizitatorului. Nu există variante de logo sau de culori pentru modul întunecat.
- **Consecințe:** Înlocuiește D-047, detaliul 4, în partea despre modul luminos sau întunecat. Fundalul și textul neutru rămân definite de aplicație, cu valori fixe, iar paginile declară `color-scheme: light`, ca browserul să nu întunece nici câmpurile de formular. Prezentarea pentru clienți nu mai promite modul întunecat.
- **Implementare:** `apps/sandbox/src/styles.css`, `libs/ui/picker/src/brand-picker.css`, `apps/sandbox/public/brand/logo-rectangle.svg`, `docs/prezentare/index.html`.

## D-053 · Fundalul paginii este culoarea secundară
- **Status:** Implementată
- **Data:** 2026-11-13
- **Context:** Cerința utilizatorului.
- **Decizie:**
  1. Fundalul paginilor e culoarea secundară (`--color-secondary`), iar textul obișnuit e culoarea calculată pentru ea (`--color-on-secondary`).
  2. Nuanțele neutre (text estompat, linii, fundalul cardurilor) se derivă din `--color-on-secondary`, deci se potrivesc cu orice culoare secundară.
  3. În sandbox, culoarea secundară e o nuanță deschisă a culorii principale: `#e3e9fb`, lângă albastrul `#1f47d6`. Pe acest fundal, culoarea principală are contrast 5,9:1.
- **Consecințe:** Înlocuiește D-047, detaliul 4, în partea despre fundal. Un element colorat cu culoarea secundară are nevoie de un contur, pentru că altfel se pierde în fundal. Clientul trebuie să aleagă culoarea principală și cea de accent astfel încât să se vadă pe culoarea secundară; picker-ul nu verifică acest contrast. Logo-urile date ca imagini trebuie să se vadă pe fundalul ales.
- **Implementare:** `apps/sandbox/src/styles.css`, `apps/sandbox/src/app/pages/home.ts`, `apps/sandbox/src/app/brand.config.ts`, `libs/ui/picker/src/brand-picker.ts` (eticheta culorii secundare).
