// Runs every migration on an in-memory Postgres and checks the access rules.
// The roles and users here are fixtures; the framework defines none.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const NOT_ALLOWED = /Not allowed/;
const NOT_AVAILABLE = /Permission not available/;
const PERMISSION_DENIED = /permission denied/;

const uuid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const ana = uuid(1); // member
const ion = uuid(2); // staff
const mara = uuid(3); // staff, reports.financial ON
const radu = uuid(4); // staff, reports.operational OFF, reports.financial OFF
const dan = uuid(5); // manager
const dora = uuid(6); // manager
const eva = uuid(7); // super_admin

let db;

// Stands in for what Supabase provides, with the broadest default grants.
const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create role supabase_auth_admin nologin;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
  grant usage on schema auth to supabase_auth_admin, authenticated, anon, service_role;
  grant insert on auth.users to supabase_auth_admin;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

const ROLES = `
  insert into public.roles (key, rank) values
    ('member', 10), ('staff', 20), ('manager', 30);
  insert into public.role_permissions (role, permission, is_default) values
    ('member', 'orders.own', true),
    ('staff', 'orders.manage', true),
    ('staff', 'orders.refund', false),
    ('staff', 'reports.operational', true),
    ('staff', 'reports.financial', false),
    ('staff', 'member.manage', true),
    ('manager', 'orders.manage', true),
    ('manager', 'orders.refund', true),
    ('manager', 'reports.operational', true),
    ('manager', 'reports.financial', true),
    ('manager', 'member.manage', true),
    ('manager', 'staff.manage', true),
    ('super_admin', 'orders.manage', true),
    ('super_admin', 'orders.refund', true),
    ('super_admin', 'reports.operational', true),
    ('super_admin', 'reports.financial', true),
    ('super_admin', 'member.manage', true),
    ('super_admin', 'staff.manage', true),
    ('super_admin', 'manager.manage', true);
`;

// Savepoints let a test continue after a rejected statement.
async function as(userId, fn, role = 'authenticated') {
  await db.exec(`
    savepoint as_user;
    select set_config('request.jwt.claim.sub', '${userId ?? ''}', true);
    set local role ${role};
  `);
  try {
    const result = await fn();
    await db.exec(`
      reset role;
      select set_config('request.jwt.claim.sub', '', true);
      release savepoint as_user;
    `);
    return result;
  } catch (error) {
    await db.exec('rollback to savepoint as_user; release savepoint as_user;');
    throw error;
  }
}

const rows = async (sql, params) => (await db.query(sql, params)).rows;
const value = async (sql, params) =>
  Object.values((await rows(sql, params))[0])[0];

const signUp = (id, metadata = {}) =>
  as(
    null,
    () =>
      rows('insert into auth.users (id, raw_user_meta_data) values ($1, $2)', [
        id,
        JSON.stringify(metadata),
      ]),
    'supabase_auth_admin',
  );
const has = (user, permission) =>
  as(user, () => value('select access.has_permission($1)', [permission]));
const canManage = (actor, target) =>
  as(actor, () => value('select access.can_manage_user($1)', [target]));
const setPermission = (actor, target, permission, isGranted) =>
  as(actor, () =>
    rows('select public.set_user_permission($1, $2, $3)', [
      target,
      permission,
      isGranted,
    ]),
  );
const setRole = (actor, target, role) =>
  as(actor, () => rows('select public.set_user_role($1, $2)', [target, role]));
const roleOf = (user) =>
  value('select role from public.profiles where id = $1', [user]);
const count = async (user, sql) => (await as(user, () => rows(sql))).length;

// Each test runs in a transaction that is rolled back, so tests can't affect each other.
const test = (name, fn) =>
  it(name, async () => {
    await db.exec('begin');
    try {
      await fn();
    } finally {
      await db.exec('rollback');
    }
  });

before(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  const migrations = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(migrations).sort()) {
    await db.exec(readFileSync(new URL(file, migrations), 'utf8'));
  }
  await db.exec('begin');
  await db.exec(ROLES);
  for (const user of [ana, ion, mara, radu, dan, dora, eva]) {
    await signUp(user);
  }
  await db.exec(`
    update public.profiles set role = 'staff' where id in ('${ion}', '${mara}', '${radu}');
    update public.profiles set role = 'manager' where id in ('${dan}', '${dora}');
    update public.profiles set role = 'super_admin' where id = '${eva}';
    insert into public.user_permission_overrides (user_id, permission, granted) values
      ('${mara}', 'reports.financial', true),
      ('${radu}', 'reports.operational', false),
      ('${radu}', 'reports.financial', false);
  `);
  await db.exec('commit');
});

after(() => db.close());

describe('sign-up', () => {
  test('gives the lowest rank and ignores the role in user metadata', async () => {
    const newUser = uuid(8);
    await signUp(newUser, { role: 'super_admin' });
    assert.equal(await roleOf(newUser), 'member');
  });

  test('succeeds without a profile when only the top role exists', async () => {
    await db.exec(`
      delete from public.profiles;
      delete from public.roles where key <> 'super_admin';
    `);
    const newUser = uuid(8);
    await signUp(newUser);
    assert.equal(
      (await rows('select id from public.profiles where id = $1', [newUser]))
        .length,
      0,
    );
  });

  test('succeeds when no roles exist at all', async () => {
    await db.exec('delete from public.profiles; delete from public.roles;');
    await signUp(uuid(8));
  });
});

describe('resolving permissions', () => {
  test('an ON exception grants a permission the role does not have', async () => {
    assert.equal(await has(mara, 'reports.financial'), true);
  });

  test('without an exception, the role default applies', async () => {
    assert.equal(await has(ion, 'reports.financial'), false);
    assert.equal(await has(ion, 'reports.operational'), true);
  });

  test('an OFF exception beats the role default', async () => {
    assert.equal(await has(radu, 'reports.operational'), false);
  });

  test('a caller with no session has nothing', async () => {
    assert.equal(await has(null, 'orders.own'), false);
  });

  test('my_access returns the role, rank and resolved permissions', async () => {
    assert.deepEqual(await as(ana, () => value('select public.my_access()')), {
      role: { key: 'member', rank: 10 },
      permissions: ['orders.own'],
    });
    const { permissions } = await as(mara, () =>
      value('select public.my_access()'),
    );
    assert.deepEqual(permissions, [
      'member.manage',
      'orders.manage',
      'reports.financial',
      'reports.operational',
    ]);
  });

  test('my_access is empty with no session', async () => {
    assert.deepEqual(await as(null, () => value('select public.my_access()')), {
      role: null,
      permissions: [],
    });
  });
});

describe('changing role defaults', () => {
  test('turning a default on reaches existing users, except a deliberate OFF', async () => {
    await db.exec(`
      update public.role_permissions set is_default = true
      where role = 'staff' and permission = 'reports.financial'
    `);
    assert.equal(await has(ion, 'reports.financial'), true);
    assert.equal(await has(mara, 'reports.financial'), true);
    assert.equal(await has(radu, 'reports.financial'), false);
  });

  test('turning a default off reaches existing users, except a deliberate ON', async () => {
    await db.exec(`
      insert into public.user_permission_overrides (user_id, permission, granted)
      values ('${mara}', 'orders.manage', true);
      update public.role_permissions set is_default = false
      where role = 'staff' and permission = 'orders.manage';
    `);
    assert.equal(await has(ion, 'orders.manage'), false);
    assert.equal(await has(mara, 'orders.manage'), true);
  });

  test('a brand-new permission reaches every user of the role', async () => {
    await db.exec(
      `insert into public.role_permissions values ('staff', 'bookings.view', true)`,
    );
    for (const user of [ion, mara, radu]) {
      assert.equal(await has(user, 'bookings.view'), true);
    }
    assert.equal(await has(ana, 'bookings.view'), false);
  });
});

describe('who manages whom', () => {
  const cases = [
    ['staff manages a member', ion, ana, true],
    ['manager manages staff', dan, ion, true],
    ['manager manages a member', dan, ana, true],
    ['super_admin manages a manager', eva, dan, true],
    ['staff cannot manage a peer', ion, mara, false],
    ['manager cannot manage a peer', dan, dora, false],
    ['nobody manages themselves', ion, ion, false],
    ['staff cannot manage a higher rank', ion, dan, false],
    ['a member manages nobody', ana, ion, false],
  ];
  for (const [name, actor, target, expected] of cases) {
    test(name, async () => {
      assert.equal(await canManage(actor, target), expected);
    });
  }

  test('a higher rank without the permission is denied', async () => {
    await db.exec(`
      insert into public.user_permission_overrides (user_id, permission, granted)
      values ('${radu}', 'member.manage', false)
    `);
    assert.equal(await canManage(radu, ana), false);
  });

  test('the permission without a higher rank is denied', async () => {
    await db.exec(`
      insert into public.role_permissions values
        ('staff', 'staff.manage', true), ('staff', 'manager.manage', true)
    `);
    assert.equal(await canManage(ion, mara), false);
    assert.equal(await canManage(ion, dan), false);
    await assert.rejects(
      setPermission(ion, mara, 'orders.manage', false),
      NOT_ALLOWED,
    );
  });
});

describe('changing a permission', () => {
  test('grants a permission the actor holds', async () => {
    await setPermission(dan, ion, 'orders.refund', true);
    assert.equal(await has(ion, 'orders.refund'), true);
  });

  test('a null value returns the user to the default', async () => {
    await setPermission(dan, mara, 'reports.financial', null);
    assert.equal(await has(mara, 'reports.financial'), false);
  });

  test('can turn a default off', async () => {
    await setPermission(dan, ion, 'orders.manage', false);
    assert.equal(await has(ion, 'orders.manage'), false);
  });

  test('cannot go beyond what the role can hold', async () => {
    await assert.rejects(
      setPermission(dan, ana, 'reports.financial', true),
      NOT_AVAILABLE,
    );
  });

  test('cannot edit yourself, a peer or a higher rank', async () => {
    await assert.rejects(
      setPermission(dan, dan, 'orders.refund', true),
      NOT_ALLOWED,
    );
    await assert.rejects(
      setPermission(dan, dora, 'orders.refund', false),
      NOT_ALLOWED,
    );
    await assert.rejects(
      setPermission(ion, mara, 'orders.refund', true),
      NOT_ALLOWED,
    );
    await assert.rejects(
      setPermission(ana, ion, 'orders.refund', true),
      NOT_ALLOWED,
    );
  });

  describe('with a permission the actor does not hold', () => {
    const SECRET = `
      insert into public.role_permissions values
        ('staff', 'secret.perm', false), ('member', 'secret.perm', true);
    `;

    test('cannot grant it', async () => {
      await db.exec(SECRET);
      await assert.rejects(
        setPermission(ion, ana, 'secret.perm', true),
        NOT_ALLOWED,
      );
    });

    test('cannot grant it by resetting an OFF exception', async () => {
      await db.exec(SECRET);
      await db.exec(`
        insert into public.user_permission_overrides (user_id, permission, granted)
        values ('${ana}', 'secret.perm', false)
      `);
      await assert.rejects(
        setPermission(ion, ana, 'secret.perm', null),
        NOT_ALLOWED,
      );
    });

    test('cannot turn it off', async () => {
      await db.exec(SECRET);
      await assert.rejects(
        setPermission(ion, ana, 'secret.perm', false),
        NOT_ALLOWED,
      );
      assert.equal(await has(ana, 'secret.perm'), true);
    });

    test('cannot reset an ON exception', async () => {
      await db.exec(SECRET);
      await db.exec(`
        insert into public.user_permission_overrides (user_id, permission, granted)
        values ('${ana}', 'secret.perm', true)
      `);
      await assert.rejects(
        setPermission(ion, ana, 'secret.perm', null),
        NOT_ALLOWED,
      );
    });
  });
});

describe('changing a role', () => {
  test('moves the user and clears their exceptions', async () => {
    await db.exec(`
      insert into public.user_permission_overrides (user_id, permission, granted)
      values ('${ana}', 'orders.own', false)
    `);
    await setRole(eva, ana, 'staff');
    assert.equal(await roleOf(ana), 'staff');
    assert.equal(
      await value(
        `select count(*)::int from public.user_permission_overrides where user_id = '${ana}'`,
      ),
      0,
    );
  });

  test('can only assign roles below your own', async () => {
    await assert.rejects(setRole(ion, ana, 'staff'), NOT_ALLOWED);
    await assert.rejects(setRole(dan, ion, 'manager'), NOT_ALLOWED);
    assert.equal(await roleOf(ion), 'staff');
  });

  test('nobody can assign the top rank', async () => {
    await assert.rejects(setRole(eva, dan, 'super_admin'), NOT_ALLOWED);
    assert.equal(await roleOf(dan), 'manager');
  });

  test('cannot change your own role', async () => {
    await assert.rejects(setRole(dan, dan, 'member'), NOT_ALLOWED);
  });

  test('rejects an unknown role', async () => {
    await assert.rejects(setRole(eva, ana, 'nope'), NOT_ALLOWED);
  });
});

describe('direct access is blocked', () => {
  const cases = [
    [
      'updating your own role',
      ana,
      `update public.profiles set role = 'super_admin'`,
      'authenticated',
    ],
    [
      'adding an exception',
      ana,
      `insert into public.user_permission_overrides values ('${ana}', 'x', true)`,
      'authenticated',
    ],
    [
      'editing role defaults',
      eva,
      'update public.role_permissions set is_default = true',
      'authenticated',
    ],
    [
      'adding a role',
      eva,
      `insert into public.roles values ('x', 99)`,
      'authenticated',
    ],
    [
      "reading another user's permissions",
      ana,
      `select access.effective_permissions('${dan}')`,
      'authenticated',
    ],
    [
      'calling the sign-up trigger function',
      ana,
      'select access.handle_new_user()',
      'authenticated',
    ],
    [
      'anonymous read of profiles',
      null,
      'select * from public.profiles',
      'anon',
    ],
    ['anonymous call to my_access', null, 'select public.my_access()', 'anon'],
    [
      'anonymous use of the access schema',
      null,
      `select access.has_permission('x')`,
      'anon',
    ],
  ];
  for (const [name, user, sql, role] of cases) {
    test(name, async () => {
      await assert.rejects(
        as(user, () => rows(sql), role),
        PERMISSION_DENIED,
      );
    });
  }
});

describe('row visibility', () => {
  const profiles = 'select id from public.profiles';
  const exceptions = 'select user_id from public.user_permission_overrides';

  test('a member sees only their own profile', async () => {
    assert.equal(await count(ana, profiles), 1);
  });

  test('staff see themselves and members', async () => {
    assert.equal(await count(ion, profiles), 2);
  });

  test('a manager sees themselves, staff and members, but not peers', async () => {
    assert.equal(await count(dan, profiles), 5);
  });

  test('the super_admin sees everyone', async () => {
    assert.equal(await count(eva, profiles), 7);
  });

  test('reading needs only the permission, even for peers and higher roles', async () => {
    await db.exec(`
      insert into public.role_permissions values
        ('staff', 'staff.manage', true), ('staff', 'manager.manage', true)
    `);
    assert.equal(await count(ion, profiles), 6);
    assert.equal(await count(ion, exceptions), 3);
    assert.equal(
      await count(
        ion,
        `select permission from public.role_permissions where role = 'manager'`,
      ),
      6,
    );
  });

  test('a higher rank without the permission cannot read', async () => {
    await db.exec(`
      insert into public.user_permission_overrides (user_id, permission, granted)
      values ('${radu}', 'member.manage', false)
    `);
    assert.equal(await count(radu, profiles), 1);
  });

  test('exceptions are visible to their owner and to those who manage them', async () => {
    assert.equal(await count(ana, exceptions), 0);
    assert.equal(await count(radu, exceptions), 2);
    assert.equal(await count(dan, exceptions), 3);
  });

  test("a member reads only their own role's permissions", async () => {
    assert.equal(
      await count(ana, 'select permission from public.role_permissions'),
      1,
    );
  });
});

describe('RLS policies in apps', () => {
  test('can rely on has_permission', async () => {
    await db.exec(`
      create table public.payments (id int primary key);
      insert into public.payments values (1), (2);
      alter table public.payments enable row level security;
      create policy p on public.payments for select to authenticated
        using ((select access.has_permission('reports.financial')));
      grant select on public.payments to authenticated;
    `);
    assert.equal(await count(mara, 'select id from public.payments'), 2);
    assert.equal(await count(ion, 'select id from public.payments'), 0);
  });
});

describe('role management', () => {
  const createRole = (actor, key, rank) =>
    as(actor, () => rows('select public.create_role($1, $2)', [key, rank]));
  const setDefault = (actor, role, permission, on) =>
    as(actor, () =>
      rows('select public.set_role_permission($1, $2, $3)', [
        role,
        permission,
        on,
      ]),
    );
  const roleRows = (role, permission) =>
    rows(
      'select is_default from public.role_permissions where role = $1 and permission = $2',
      [role, permission],
    );
  const allowManagers = () =>
    db.exec(
      `insert into public.role_permissions values ('manager', 'roles.manage', true)`,
    );

  test('super_admin is seeded at the top with roles.manage', async () => {
    assert.equal(await value(`select max(rank) from public.roles`), 1000);
    assert.equal(await has(eva, 'roles.manage'), true);
  });

  test('only super_admin holds brand.manage, until it grants it', async () => {
    assert.equal(await has(eva, 'brand.manage'), true);
    assert.equal(await has(dan, 'brand.manage'), false);
    await setDefault(eva, 'manager', 'brand.manage', true);
    assert.equal(await has(dan, 'brand.manage'), true);
  });

  test('a new role is managed by every higher rank and manages every lower rank', async () => {
    await createRole(eva, 'coach', 25);
    assert.equal(
      await value(`select rank from public.roles where key = 'coach'`),
      25,
    );
    for (const role of ['manager', 'super_admin']) {
      assert.deepEqual(await roleRows(role, 'coach.manage'), [
        { is_default: true },
      ]);
    }
    assert.deepEqual(await roleRows('staff', 'coach.manage'), []);
    assert.deepEqual(await roleRows('coach', 'staff.manage'), [
      { is_default: true },
    ]);
    assert.deepEqual(await roleRows('coach', 'member.manage'), [
      { is_default: true },
    ]);
    assert.deepEqual(await roleRows('coach', 'manager.manage'), []);
    assert.equal(await has(dan, 'coach.manage'), true);
  });

  test('needs roles.manage', async () => {
    await assert.rejects(createRole(dan, 'coach', 5), NOT_ALLOWED);
    await assert.rejects(createRole(ana, 'coach', 5), NOT_ALLOWED);
  });

  test('can only create roles below your own rank', async () => {
    await allowManagers();
    await createRole(dan, 'coach', 25);
    await assert.rejects(createRole(dan, 'peer', 30), NOT_ALLOWED);
    await assert.rejects(createRole(dan, 'boss', 31), NOT_ALLOWED);
    await assert.rejects(createRole(eva, 'above', 1001), NOT_ALLOWED);
  });

  test('a person with the permission turned off cannot create roles', async () => {
    await allowManagers();
    await db.exec(`
      insert into public.user_permission_overrides (user_id, permission, granted)
      values ('${dan}', 'roles.manage', false)
    `);
    await assert.rejects(createRole(dan, 'coach', 25), NOT_ALLOWED);
  });

  test('rejects invalid keys and a taken rank', async () => {
    await assert.rejects(createRole(eva, 'Bad Key', 5), /Invalid role key/);
    await assert.rejects(createRole(eva, 'roles', 5), /Invalid role key/);
    await assert.rejects(createRole(eva, 'coach', 20), /duplicate key/);
  });

  test('a new lowest role picks up accounts with no profile, and new sign-ups', async () => {
    await db.exec(`delete from public.profiles where id = '${ana}'`);
    await createRole(eva, 'visitor', 5);
    assert.equal(await roleOf(ana), 'visitor');
    assert.equal(await roleOf(ion), 'staff');
    const newUser = uuid(8);
    await signUp(newUser);
    assert.equal(await roleOf(newUser), 'visitor');
  });

  test('a new role above the lowest leaves accounts with no profile alone', async () => {
    await db.exec(`delete from public.profiles where id = '${ana}'`);
    await createRole(eva, 'coach', 25);
    assert.equal(
      (await rows('select id from public.profiles where id = $1', [ana]))
        .length,
      0,
    );
  });

  test('a default change reaches existing users, except a deliberate OFF', async () => {
    await setDefault(eva, 'staff', 'reports.financial', true);
    assert.equal(await has(ion, 'reports.financial'), true);
    assert.equal(await has(radu, 'reports.financial'), false);
  });

  test('the top rank can introduce a brand-new permission and holds it', async () => {
    await setDefault(eva, 'staff', 'bookings.view', true);
    assert.equal(await has(ion, 'bookings.view'), true);
    assert.equal(await has(eva, 'bookings.view'), true);
  });

  test('a null value removes the permission from the role', async () => {
    await setDefault(eva, 'staff', 'reports.operational', null);
    assert.deepEqual(await roleRows('staff', 'reports.operational'), []);
    assert.equal(await has(ion, 'reports.operational'), false);
  });

  test('setting defaults needs roles.manage', async () => {
    await assert.rejects(
      setDefault(dan, 'staff', 'orders.refund', true),
      NOT_ALLOWED,
    );
  });

  test('can only set defaults for lower roles', async () => {
    await allowManagers();
    await setDefault(dan, 'staff', 'orders.refund', true);
    assert.deepEqual(await roleRows('staff', 'orders.refund'), [
      { is_default: true },
    ]);
    await assert.rejects(
      setDefault(dan, 'manager', 'orders.refund', false),
      NOT_ALLOWED,
    );
    await assert.rejects(
      setDefault(dan, 'super_admin', 'orders.refund', false),
      NOT_ALLOWED,
    );
    await assert.rejects(
      setDefault(eva, 'unknown', 'orders.refund', true),
      NOT_ALLOWED,
    );
  });

  test('cannot set a default for a permission you do not hold, on or off', async () => {
    await allowManagers();
    await db.exec(
      `insert into public.role_permissions values ('staff', 'secret.perm', true)`,
    );
    await assert.rejects(
      setDefault(dan, 'staff', 'secret.perm', true),
      NOT_ALLOWED,
    );
    await assert.rejects(
      setDefault(dan, 'staff', 'secret.perm', false),
      NOT_ALLOWED,
    );
    await assert.rejects(
      setDefault(dan, 'staff', 'secret.perm', null),
      NOT_ALLOWED,
    );
    assert.deepEqual(await roleRows('staff', 'secret.perm'), [
      { is_default: true },
    ]);
  });

  test('a role cannot be given management of its own rank or a higher one', async () => {
    await assert.rejects(
      setDefault(eva, 'staff', 'staff.manage', true),
      NOT_AVAILABLE,
    );
    await assert.rejects(
      setDefault(eva, 'staff', 'manager.manage', true),
      NOT_AVAILABLE,
    );
    await setDefault(eva, 'staff', 'member.manage', false);
    assert.deepEqual(await roleRows('staff', 'member.manage'), [
      { is_default: false },
    ]);
  });

  test('the functions are not available without a login', async () => {
    await assert.rejects(
      as(null, () => rows(`select public.create_role('x', 1)`), 'anon'),
      PERMISSION_DENIED,
    );
    await assert.rejects(
      as(
        null,
        () => rows(`select public.set_role_permission('a', 'b', true)`),
        'anon',
      ),
      PERMISSION_DENIED,
    );
  });
});
