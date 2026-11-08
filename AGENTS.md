# Instrucțiuni pentru agenți

Acest fișier e citit automat de agenți (Claude Code îl încarcă prin `CLAUDE.md`). Regulile de aici sunt obligatorii.

## Înainte de orice task

1. Citește `README.md`: ce este proiectul, în ce stadiu e, cum e organizat.
2. Citește `docs/decizii.md`. Deciziile cu status **Acceptată** sau **Implementată** sunt obligatorii. Deciziile **Propuse** sunt recomandări încă neconfirmate de utilizator: le poți urma, dar nu le trata ca definitive și întreabă când o alegere depinde de ele.
3. Dacă task-ul contrazice o decizie existentă, oprește-te și întreabă utilizatorul. Nu schimba direcția pe tăcute.

## Lucrul cu Git (D-023)

- Lucrează mereu pe un branch, niciodată direct pe `main`. Dă-i un nume descriptiv (de ex. `feat/magic-link-login`, `docs/invoicing`).
- **Nu face commit și nu face push** până când utilizatorul nu a verificat modificările și nu a spus explicit că sunt în regulă. Lasă modificările necomise pe branch și spune-i ce să verifice.
- Deocamdată nu deschide pull request-uri.
- După acordul utilizatorului: un commit cu mesaj în engleză (D-015), apoi `git push -u origin <branch>`.

## Regula de bază: documentația ține pasul cu deciziile

Actualizarea documentației face parte din task și intră în **același commit** cu schimbarea. Nu o lăsa pentru mai târziu.

| Când… | Ce actualizezi |
|---|---|
| Utilizatorul ia o decizie (tehnică, de produs sau de design) | Adaugi o intrare nouă în `docs/decizii.md` cu status **Acceptată**. |
| Tu recomanzi ceva și utilizatorul nu a confirmat încă | Intrare cu status **Propusă**. Când confirmă, o treci pe **Acceptată**. |
| Implementezi o decizie | Status **Implementată** și completezi câmpul „Implementare” (fișiere, commit sau PR). |
| O decizie se schimbă | Nu rescrii intrarea veche. Adaugi una nouă, iar pe cea veche o marchezi **Înlocuită de D-0XX**. |
| O întrebare deschisă primește răspuns | O scoți din „Întrebări deschise” și o transformi în decizie. |
| Se schimbă stack-ul, structura, comenzile de rulare sau stadiul proiectului | Actualizezi `README.md`. |
| Se schimbă ceva ce vede un client: o funcționalitate devine disponibilă, apare un modul nou, apar machete de design | Actualizezi `docs/prezentare/index.html` (vezi mai jos). |

### Checklist la finalul fiecărui task

- [ ] Deciziile noi sau schimbate sunt în `docs/decizii.md`.
- [ ] Statusurile deciziilor atinse sunt corecte (Propusă / Acceptată / Implementată / Înlocuită).
- [ ] `README.md` reflectă starea actuală.
- [ ] Dacă s-a schimbat ce vede clientul: prezentarea e actualizată, inclusiv data din subsol.
- [ ] Nimic nu e comis sau împins fără acordul explicit al utilizatorului (D-023).

## Limbă

- Documentația (README, AGENTS, decizii, prezentare): **română, cu diacritice** (ș și ț cu virgulă, nu cu sedilă).
- Codul, comentariile din cod și mesajele de commit: engleză (vezi D-015).

## Reguli tehnice

- **Angular se schimbă repede.** Înainte să scrii cod, verifică documentația oficială (angular.dev) pentru versiunea din `package.json`. Nu te baza pe ce știi din memorie. Folosește convențiile versiunii instalate (componente standalone, signals, control flow `@if`/`@for`), nu tipare vechi.
- **Securitatea datelor stă în baza de date, nu în frontend.** Orice tabel nou are RLS (Row Level Security) activat și politici pentru fiecare rol, în aceeași migrare. Codul Angular nu e o barieră de securitate.
- **Secretele nu ajung niciodată în browser.** Cheia `service_role` Supabase, cheia secretă Stripe și cheia Resend stau doar în funcțiile serverless și în variabilele de mediu. În Angular ajung doar URL-ul Supabase și cheia publică (`anon`/`publishable`).
- **Schema bazei de date se schimbă doar prin migrări**, în `supabase/migrations/`. Niciodată manual din dashboard.
- **Sumele de plată se calculează pe server**, în funcții serverless, niciodată din prețuri trimise de browser.
- **Starea unei comenzi sau a unui abonament se schimbă doar din webhook-ul Stripe**, cu semnătura verificată. Nu pe baza redirecționării după plată.
- **Integrarea cu programele de facturare trece doar prin interfața `InvoiceProvider` (D-025).** Nu apela API-ul SmartBill, Oblio sau ANAF din afara adaptorului lui. Un adaptor nou trebuie să treacă testele de contract.
- **Codul refolosibil merge în `libs/`, codul specific unui client în `apps/<client>/`.** Când același lucru apare la al doilea client, mută-l în `libs/`.

## Prezentarea pentru clienți

- Sursa este `docs/prezentare/index.html`: un document HTML complet, care se poate deschide și direct în browser.
- Fiecare modul are un status în atributul `data-status`: `disponibil`, `in-dezvoltare` sau `planificat`. Eticheta vizibilă trebuie să corespundă.
- **Fără promisiuni false:** marchezi `disponibil` doar ce e implementat și funcționează în producție.
- Actualizează data din subsol (`Actualizat: …`) la fiecare modificare.
- Pagina nu e publicată online deocamdată (D-030).
