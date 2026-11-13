-- The style picker (libs/ui) is shown only to users with brand.manage (D-050).
-- The top rank gets it by default; it can grant it to lower roles with
-- set_role_permission.
insert into public.role_permissions (role, permission, is_default)
values ('super_admin', 'brand.manage', true)
on conflict (role, permission) do nothing;
