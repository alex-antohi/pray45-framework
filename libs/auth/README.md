# auth

Acces pe bază de permisiuni, refolosibil de orice aplicație (D-034, D-036, D-037, D-038). Framework-ul definește doar rolul `super_admin`. Celelalte roluri și permisiuni sunt date pe care le adaugă fiecare aplicație.

Partea din baza de date e în `supabase/migrations/`.

## Reguli

- Codul verifică permisiuni, nu roluri.
- Permisiunea unui utilizator este excepția lui, dacă are una; altfel, valoarea implicită a rolului.
- O schimbare a valorilor implicite ajunge imediat la toți utilizatorii rolului, mai puțin la cei cu o excepție.
- Toate verificările depind doar de permisiuni. Pentru a citi conturile unui rol e nevoie de `<rol>.manage`.
- Rangul contează doar la schimbarea accesului. Activarea, dezactivarea și resetarea unei permisiuni cer: `<rol>.manage` pentru rolul contului vizat, rang mai mare decât acel cont, un rol care poate primi permisiunea și deținerea permisiunii de către cel care acționează.
- Interfața doar afișează sau ascunde. Accesul real e impus de RLS.

## Ce adaugă fiecare aplicație

Roluri și permisiuni, într-o migrare proprie sau din aplicație (vezi mai jos). Rangul mai mare gestionează rangul mai mic, iar rangul cel mai mic, sub `super_admin`, e rolul conturilor noi. Până există un astfel de rol, contul nou nu are acces.

```sql
insert into public.roles (key, rank) values
  ('<rol_de_jos>', 10),
  ('<rol_de_sus>', 20);

-- is_default = true: activă implicit
-- is_default = false: dezactivată, dar se poate acorda
-- fără rând: rolul nu o poate avea niciodată
insert into public.role_permissions (role, permission, is_default) values
  ('<rol_de_jos>', '<modul>.<actiune>', true),
  ('<rol_de_sus>', '<modul>.<actiune>', true),
  ('<rol_de_sus>', '<rol_de_jos>.manage', true);
```

Rangul cel mai mare nu se poate atribui din aplicație. Se setează cu cheia `service_role`:

```sql
insert into public.profiles (id, role) values ('<id_utilizator>', 'super_admin')
on conflict (id) do update set role = excluded.role;
```

## În Angular

```ts
// app.config.ts
provideSupabase({ url: '<url>', publishableKey: '<cheie_publica>' });

// rute: doar cu RenderMode.Client (D-010)
{ path: 'rapoarte', canMatch: [requires({ anyOf: ['<a>', '<b>'] })], loadComponent: ... }

// meniu
readonly menu = computed(() =>
  filterByAccess(MENU, (rule) => this.access.can(rule)),
);
```

```html
@if (access.can('<modul>.<actiune>')) {
  <button>...</button>
}
```

După autentificare, delogare sau schimbarea permisiunilor, apelează `access.reload()`.

## În baza de date

```sql
create policy "..." on public.tabel for select to authenticated
  using ((select access.has_permission('<modul>.<actiune>')));
```

Rolurile și permisiunile unui cont se schimbă doar prin `set_user_role` și `set_user_permission`. Pentru `set_user_permission`, `is_granted = null` șterge excepția.

Cine are `roles.manage` poate crea roluri sub rangul lui cu `create_role(cheie, rang)` și le poate schimba valorile implicite cu `set_role_permission(rol, permisiune, activa)`. `activa = null` scoate permisiunea din rol.

## Teste

Codul Angular:

```bash
npx nx test auth
```

Regulile din baza de date (`supabase/tests/`):

```bash
npx nx test supabase
```
