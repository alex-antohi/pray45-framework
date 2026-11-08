import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { requires } from './access.guard';
import { AccessLoader, AccessService, provideAccess } from './access.service';
import { AccessSnapshot } from './access.model';
import { filterByAccess } from './filter-by-access';

const mid: AccessSnapshot = {
  role: { key: 'mid', rank: 20 },
  permissions: ['orders.view', 'low.manage', 'peer.manage', 'high.manage'],
};

function setup(load: AccessLoader): AccessService {
  TestBed.configureTestingModule({
    providers: [provideAccess(() => load)],
  });
  return TestBed.inject(AccessService);
}

describe('AccessService', () => {
  it('denies everything before access is loaded', () => {
    const access = setup(async () => mid);
    expect(access.can('orders.view')).toBe(false);
    expect(access.role()).toBeNull();
  });

  it('checks a single permission and any of several', async () => {
    const access = setup(async () => mid);
    await access.ready();
    expect(access.can('orders.view')).toBe(true);
    expect(access.can('orders.edit')).toBe(false);
    expect(access.can({ anyOf: ['orders.edit', 'orders.view'] })).toBe(true);
    expect(access.can({ anyOf: ['orders.edit', 'orders.delete'] })).toBe(false);
  });

  it('manages only lower ranks, and only with the permission', async () => {
    const access = setup(async () => mid);
    await access.ready();
    expect(access.canManage({ key: 'low', rank: 10 })).toBe(true);
    expect(access.canManage({ key: 'peer', rank: 20 })).toBe(false);
    expect(access.canManage({ key: 'high', rank: 30 })).toBe(false);
    expect(access.canManage({ key: 'other', rank: 10 })).toBe(false);
  });

  it('manages nobody when signed out', async () => {
    const access = setup(async () => ({ role: null, permissions: [] }));
    await access.ready();
    expect(access.canManage({ key: 'low', rank: 0 })).toBe(false);
  });

  it('loads once for concurrent callers', async () => {
    const load = vi.fn(async () => mid);
    const access = setup(load);
    await Promise.all([access.ready(), access.ready()]);
    await access.ready();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('denies everything when loading fails, then retries', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const load = vi
      .fn<AccessLoader>()
      .mockResolvedValueOnce(mid)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(mid);
    const access = setup(load);

    await access.ready();
    expect(access.can('orders.view')).toBe(true);

    await access.reload();
    expect(access.can('orders.view')).toBe(false);

    await access.ready();
    expect(access.can('orders.view')).toBe(true);
    expect(load).toHaveBeenCalledTimes(3);
    error.mockRestore();
  });

  it('ignores a slow response that a newer reload has replaced', async () => {
    let finishSlow: (snapshot: AccessSnapshot) => void = () => undefined;
    const load = vi
      .fn<AccessLoader>()
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishSlow = resolve;
        }),
      )
      .mockResolvedValueOnce({ role: null, permissions: [] });
    const access = setup(load);

    const slow = access.reload();
    await access.reload();
    finishSlow(mid);
    await slow;

    expect(access.can('orders.view')).toBe(false);
  });
});

describe('requires', () => {
  function run(load: AccessLoader, rule: Parameters<typeof requires>[0]) {
    TestBed.configureTestingModule({
      providers: [provideAccess(() => load)],
    });
    return TestBed.runInInjectionContext(() => requires(rule)({} as Route, []));
  }

  it('matches when the user has the permission', async () => {
    await expect(run(async () => mid, 'orders.view')).resolves.toBe(true);
  });

  it('does not match when the user lacks it', async () => {
    await expect(run(async () => mid, 'orders.edit')).resolves.toBe(false);
  });
});

describe('filterByAccess', () => {
  interface Item {
    readonly label: string;
    readonly access?: string;
    readonly children?: readonly Item[];
  }

  const can = (rule: unknown) => rule === 'allowed';

  it('keeps open items and those the user may see', () => {
    const items: Item[] = [
      { label: 'open' },
      { label: 'yes', access: 'allowed' },
      { label: 'no', access: 'denied' },
    ];
    expect(filterByAccess(items, can).map((item) => item.label)).toEqual([
      'open',
      'yes',
    ]);
  });

  it('filters children and drops groups left empty', () => {
    const items: Item[] = [
      {
        label: 'mixed',
        children: [
          { label: 'yes', access: 'allowed' },
          { label: 'no', access: 'denied' },
        ],
      },
      { label: 'empty', children: [{ label: 'no', access: 'denied' }] },
    ];
    expect(filterByAccess(items, can)).toEqual([
      { label: 'mixed', children: [{ label: 'yes', access: 'allowed' }] },
    ]);
  });

  it('hides the children of a hidden group', () => {
    const items: Item[] = [
      {
        label: 'hidden',
        access: 'denied',
        children: [{ label: 'yes', access: 'allowed' }],
      },
    ];
    expect(filterByAccess(items, can)).toEqual([]);
  });
});
