-- Generic access control. Apart from super_admin, roles and permissions are
-- data supplied by each app. See libs/auth/README.md.

create table public.roles (
  key text primary key,
  -- Higher ranks manage lower ranks. The lowest rank is given to new sign-ups.
  rank integer not null unique
);

-- A row means the role can hold the permission. is_default says whether it
-- holds it unless a user exception says otherwise.
create table public.role_permissions (
  role text not null references public.roles (key) on update cascade on delete cascade,
  permission text not null,
  is_default boolean not null,
  primary key (role, permission)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null references public.roles (key) on update cascade
);

create index profiles_role_idx on public.profiles (role);

-- Only what differs from the role's defaults.
create table public.user_permission_overrides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission text not null,
  granted boolean not null,
  primary key (user_id, permission)
);

revoke all on public.roles, public.role_permissions, public.profiles, public.user_permission_overrides
  from anon, authenticated;
grant select on public.roles, public.role_permissions, public.profiles, public.user_permission_overrides
  to authenticated;
grant all on public.roles, public.role_permissions, public.profiles, public.user_permission_overrides
  to service_role;

insert into public.roles (key, rank) values ('super_admin', 1000);
insert into public.role_permissions (role, permission, is_default)
values ('super_admin', 'roles.manage', true);

-- Not exposed through the Data API; RLS policies call these directly.
create schema access;
revoke all on schema access from public;
grant usage on schema access to authenticated;

create function access.effective_permissions(target_user uuid)
returns setof text
language sql stable security definer set search_path = ''
as $$
  select rp.permission
  from public.profiles p
  join public.role_permissions rp on rp.role = p.role
  left join public.user_permission_overrides o
    on o.user_id = p.id and o.permission = rp.permission
  where p.id = target_user
    and coalesce(o.granted, rp.is_default);
$$;

create function access.has_permission(permission_key text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from access.effective_permissions((select auth.uid())) as t (permission)
    where t.permission = permission_key
  );
$$;

create function access.own_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

-- Both conditions are required: a higher rank and the role's manage permission.
create function access.can_manage_role(target_role text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select own.rank > target.rank
     from public.roles own, public.roles target
     where own.key = access.own_role() and target.key = target_role),
    false
  ) and access.has_permission(target_role || '.manage');
$$;

create function access.can_manage_user(target_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select access.can_manage_role(p.role) from public.profiles p where p.id = target_user),
    false
  );
$$;

-- Reading depends only on permissions; rank applies only when changing access.
create function access.can_read_user(target_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select access.has_permission(p.role || '.manage') from public.profiles p where p.id = target_user),
    false
  );
$$;

create function access.my_access()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'role', (select jsonb_build_object('key', r.key, 'rank', r.rank)
             from public.roles r where r.key = access.own_role()),
    'permissions', coalesce(
      (select jsonb_agg(t.permission order by t.permission)
       from access.effective_permissions((select auth.uid())) as t (permission)),
      '[]'::jsonb
    )
  );
$$;

-- Clears exceptions: they described the old role. The top rank can't be
-- assigned here because no rank is above it; set it with the service key.
create function access.set_user_role(target_user uuid, new_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not access.can_manage_user(target_user) or not access.can_manage_role(new_role) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.profiles set role = new_role where id = target_user;
  delete from public.user_permission_overrides where user_id = target_user;
end;
$$;

-- Turning a permission on, turning it off and resetting it all pass the same checks.
-- A null is_granted removes the exception, returning the user to the default.
create function access.set_user_permission(target_user uuid, permission_key text, is_granted boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not access.can_manage_user(target_user) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  perform 1
  from public.profiles p
  join public.role_permissions rp on rp.role = p.role
  where p.id = target_user and rp.permission = permission_key;

  if not found then
    raise exception 'Permission not available for this role' using errcode = '42501';
  end if;

  if not access.has_permission(permission_key) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if is_granted is null then
    delete from public.user_permission_overrides
    where user_id = target_user and permission = permission_key;
  else
    insert into public.user_permission_overrides (user_id, permission, granted)
    values (target_user, permission_key, is_granted)
    on conflict (user_id, permission) do update set granted = excluded.granted;
  end if;
end;
$$;

create function access.own_rank()
returns integer
language sql stable security definer set search_path = ''
as $$
  select r.rank from public.roles r where r.key = access.own_role();
$$;

create function access.create_role(new_key text, new_rank integer)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not access.has_permission('roles.manage') or new_rank >= access.own_rank() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  -- "roles" would make <key>.manage collide with roles.manage.
  if new_key !~ '^[a-z][a-z0-9_]*$' or new_key = 'roles' then
    raise exception 'Invalid role key' using errcode = '22023';
  end if;

  insert into public.roles (key, rank) values (new_key, new_rank);

  -- Every higher rank manages the new role, and it manages every lower rank.
  insert into public.role_permissions (role, permission, is_default)
  select r.key, new_key || '.manage', true from public.roles r where r.rank > new_rank;
  insert into public.role_permissions (role, permission, is_default)
  select new_key, r.key || '.manage', true from public.roles r where r.rank < new_rank;

  -- Accounts created while no lower role existed have no profile yet.
  if new_rank = (select min(r.rank) from public.roles r) then
    insert into public.profiles (id, role)
    select u.id, new_key
    from auth.users u
    where not exists (select 1 from public.profiles p where p.id = u.id);
  end if;
end;
$$;

-- A null default_on removes the permission: the role can no longer hold it.
create function access.set_role_permission(target_role text, permission_key text, default_on boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  target_rank integer;
begin
  select r.rank into target_rank from public.roles r where r.key = target_role;

  if not access.has_permission('roles.manage')
    or target_rank is null
    or access.own_rank() <= target_rank then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.roles r
    where permission_key = r.key || '.manage' and r.rank >= target_rank
  ) then
    raise exception 'Permission not available for this role' using errcode = '42501';
  end if;

  -- The top rank holds every permission, so it can introduce new ones.
  if access.own_rank() = (select max(r.rank) from public.roles r) then
    insert into public.role_permissions (role, permission, is_default)
    values (access.own_role(), permission_key, true)
    on conflict (role, permission) do nothing;
  end if;

  if not access.has_permission(permission_key) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if default_on is null then
    delete from public.role_permissions
    where role = target_role and permission = permission_key;
  else
    insert into public.role_permissions (role, permission, is_default)
    values (target_role, permission_key, default_on)
    on conflict (role, permission) do update set is_default = excluded.is_default;
  end if;
end;
$$;

-- Never reads the role from user metadata, which the browser controls.
-- The top rank is never given at sign-up. Until a lower role exists, a new
-- account has no profile and therefore no access.
create function access.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  lowest_role text;
begin
  select r.key into lowest_role
  from public.roles r
  where r.rank < (select max(top.rank) from public.roles top)
  order by r.rank
  limit 1;

  if lowest_role is not null then
    insert into public.profiles (id, role) values (new.id, lowest_role);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function access.handle_new_user();

revoke all on all functions in schema access from public, anon, authenticated;
grant execute on function access.has_permission(text) to authenticated;
grant execute on function access.own_role() to authenticated;
grant execute on function access.can_manage_role(text) to authenticated;
grant execute on function access.can_manage_user(uuid) to authenticated;
grant execute on function access.can_read_user(uuid) to authenticated;
grant execute on function access.my_access() to authenticated;
grant execute on function access.set_user_role(uuid, text) to authenticated;
grant execute on function access.set_user_permission(uuid, text, boolean) to authenticated;
grant execute on function access.create_role(text, integer) to authenticated;
grant execute on function access.set_role_permission(text, text, boolean) to authenticated;

-- Entry points for the Data API. The checks live in the access schema.
create function public.my_access()
returns jsonb
language sql stable security invoker set search_path = ''
as $$ select access.my_access(); $$;

create function public.set_user_role(target_user uuid, new_role text)
returns void
language sql security invoker set search_path = ''
as $$ select access.set_user_role(target_user, new_role); $$;

create function public.set_user_permission(target_user uuid, permission_key text, is_granted boolean)
returns void
language sql security invoker set search_path = ''
as $$ select access.set_user_permission(target_user, permission_key, is_granted); $$;

create function public.create_role(new_key text, new_rank integer)
returns void
language sql security invoker set search_path = ''
as $$ select access.create_role(new_key, new_rank); $$;

create function public.set_role_permission(target_role text, permission_key text, default_on boolean)
returns void
language sql security invoker set search_path = ''
as $$ select access.set_role_permission(target_role, permission_key, default_on); $$;

revoke all on function public.my_access() from public, anon;
revoke all on function public.set_user_role(uuid, text) from public, anon;
revoke all on function public.set_user_permission(uuid, text, boolean) from public, anon;
revoke all on function public.create_role(text, integer) from public, anon;
revoke all on function public.set_role_permission(text, text, boolean) from public, anon;
grant execute on function public.my_access() to authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.set_user_permission(uuid, text, boolean) to authenticated;
grant execute on function public.create_role(text, integer) to authenticated;
grant execute on function public.set_role_permission(text, text, boolean) to authenticated;

alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_permission_overrides enable row level security;

-- Reads only. Writes go through the functions above or the service key.
create policy "Signed-in users can read roles"
  on public.roles for select to authenticated
  using (true);

create policy "Users can read their own role's permissions and those they manage"
  on public.role_permissions for select to authenticated
  using (role = (select access.own_role()) or access.has_permission(role || '.manage'));

create policy "Users can read their own profile and those they manage"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or access.has_permission(role || '.manage'));

create policy "Users can read their own exceptions and those they manage"
  on public.user_permission_overrides for select to authenticated
  using (user_id = (select auth.uid()) or access.can_read_user(user_id));
