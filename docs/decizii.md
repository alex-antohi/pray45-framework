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
| Î-5 | Facturare: confirmarea punctelor 1–6 din D-021 (cine emite, când, rambursări, date de facturare) | Strategia (D-024) și arhitectura (D-025) sunt stabilite. Rămân Î-7, Î-8 și Î-9. |
| Î-7 | Școala de arte marțiale este firmă înregistrată în România? Este plătitoare de TVA? | Stabilește regulile de facturare și TVA. |
| Î-8 | Ce program de facturare folosește deja școala sau contabilul ei (SmartBill, Oblio, altul)? | Integrăm programul pe care îl folosesc deja, ca să nu-și schimbe contabilitatea. |
| Î-9 | Confirmarea contabilului școlii pentru fluxul de facturare din D-021 | În special: factură pentru fiecare plată online, în locul bonului fiscal. |
| Î-10 | Adresa de contact reală a studioului | `contact@pray45.io` e provizorie (D-022). |

Întrebări închise: Î-1 → D-017 · Î-2 → D-018 · Î-3 → D-022 · Î-4 → D-020 · Î-6 → D-019.

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
- **Status:** Acceptată (cerința) · Propusă (mecanismul)
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
- **Implementare:** `nx.json`, `package.json`, `apps/sandbox/` (D-028). `libs/` nu există încă.

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
- **Status:** Propusă
- **Data:** 2026-11-08
- **Context:** Supabase permite alegerea regiunii pentru fiecare proiect, la creare. Regiunea nu se poate schimba ulterior fără migrarea într-un proiect nou. Regiunile din UE sunt Frankfurt (`eu-central-1`), Irlanda (`eu-west-1`), Paris (`eu-west-3`) și Stockholm (`eu-north-1`). Londra și Zürich sunt în Europa, dar nu în UE. Regiunea generală „Europe” poate ajunge în afara UE, deci se alege o regiune anume.
- **Decizie:** Toate proiectele Supabase ale clienților (D-013) se creează în **Frankfurt (`eu-central-1`)**: este în UE (pentru GDPR) și e cea mai apropiată regiune de România.
- **Surse:** https://supabase.com/docs/guides/platform/regions · https://supabase.com/regions
- **Implementare:** —

## D-021 · Facturare: emitentul este clientul, factura se generează automat după plată
- **Status:** Propusă
- **Data:** 2026-11-08
- **Context:** Stripe încasează banii, dar chitanțele Stripe nu sunt facturi fiscale. Din 2025, în România, facturile către persoane fizice (B2C) se transmit și prin RO e-Factura (SPV). Pentru plățile online, regula „bon fiscal sau factură” e neclară, după sursele consultate.
- **Decizie propusă:**
  1. **Cine emite.** Factura către cumpărător o emite **firma clientului** (de ex. școala), pe CUI-ul ei, din contul ei în programul de facturare. Pray45 nu emite facturi în numele clienților. Pray45 își facturează doar propriile servicii către clienți, separat de platformă.
  2. **Când.** Automat, pentru **fiecare plată reușită**, inclusiv fiecare reînnoire de abonament. Declanșatorul e webhook-ul Stripe verificat: `checkout.session.completed` pentru plățile unice și `invoice.paid` pentru abonamente. O factură pentru fiecare plată online evită zona neclară a bonului fiscal (de confirmat cu contabilul, Î-9).
  3. **Cum.** O Edge Function apelează API-ul programului de facturare al clientului (SmartBill sau Oblio, după Î-8). Programul generează factura și o transmite în e-Factura. Cumpărătorul primește PDF-ul pe email (Resend) și îl găsește și în contul lui.
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
- **Decizie:** Prezentarea pentru clienți e semnată **Pray45**, cu adresa de contact `contact@pray45.io`. Adresa e **provizorie** și se înlocuiește când există una reală (Î-10).
- **Implementare:** `docs/prezentare/index.html` (secțiunea Contact și subsolul).

## D-023 · Lucrul cu Git: branch-uri și review înainte de commit
- **Status:** Implementată
- **Data:** 2026-11-08
- **Decizie:** Se lucrează pe branch-uri, niciodată direct pe `main`. Agenții **nu fac commit și nu fac push** până când utilizatorul nu a verificat modificările și nu a spus explicit că sunt în regulă. Deocamdată nu folosim pull request-uri.
- **Implementare:** `AGENTS.md`, secțiunea „Lucrul cu Git”.

## D-024 · Facturare în etape: întâi programul clientului, apoi modulul nostru
- **Status:** Acceptată
- **Data:** 2026-11-08
- **Context:** Am discutat varianta unui program de facturare propriu. E posibil, dar presupune trimiterea directă în RO e-Factura (XML UBL 2.1 / CIUS-RO, API-ul ANAF, autorizarea fiecărei firme cu certificat digital), arhivarea și exportul pentru contabil. Toate acestea înseamnă săptămâni de lucru și responsabilitate legală pentru corectitudinea facturilor.
- **Decizie:**
  1. **Etapa 1:** pentru primii clienți (inclusiv școala de arte marțiale) ne conectăm la programul de facturare pe care îl folosesc deja (SmartBill, Oblio etc.).
  2. **Etapa 2:** construim modulul nostru de facturare („pray45”), cu trimitere directă în e-Factura, ca adaptor nou. Îl facem când avem destui clienți încât abonamentele lor la programe de facturare să conteze sau când un client îl cere explicit.
- **Consecințe:** Trecerea unui client de la un program la altul e o schimbare de configurare, nu de cod (D-025).
- **Implementare:** —

## D-025 · Facturare pluginabilă: interfață comună și adaptoare injectate
- **Status:** Acceptată
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
- **Status:** Implementată
- **Data:** 2026-11-08
- **Context:** Implicit, Vercel rulează funcțiile în Washington (`iad1`), iar datele din Supabase vor fi în Frankfurt (D-020). Fiecare interogare făcută la randarea pe server ar traversa Atlanticul.
- **Decizie:** Funcția SSR rulează în Frankfurt (`fra1`).
- **Implementare:** `tools/vercel/build-output.mjs`. De verificat la următorul deployment, în antetul `x-vercel-id`.
