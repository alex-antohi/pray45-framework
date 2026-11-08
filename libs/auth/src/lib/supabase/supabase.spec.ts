import { SupabaseClient } from '@supabase/supabase-js';
import { AccessSnapshot, NO_ACCESS } from '../access/access.model';
import { supabaseAccessLoader } from './supabase';

function client(session: unknown, rpc: () => Promise<unknown>) {
  return {
    auth: { getSession: async () => ({ data: { session } }) },
    rpc: vi.fn(rpc),
  } as unknown as SupabaseClient;
}

describe('supabaseAccessLoader', () => {
  it('returns no access without a session, and does not call the database', async () => {
    const supabase = client(null, async () => ({ data: null, error: null }));
    await expect(supabaseAccessLoader(supabase)()).resolves.toBe(NO_ACCESS);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('returns what my_access reports for a signed-in user', async () => {
    const snapshot: AccessSnapshot = {
      role: { key: 'mid', rank: 20 },
      permissions: ['orders.view'],
    };
    const supabase = client({ user: {} }, async () => ({
      data: snapshot,
      error: null,
    }));
    await expect(supabaseAccessLoader(supabase)()).resolves.toEqual(snapshot);
    expect(supabase.rpc).toHaveBeenCalledWith('my_access');
  });

  it('throws when the database returns an error', async () => {
    const failure = new Error('permission denied');
    const supabase = client({ user: {} }, async () => ({
      data: null,
      error: failure,
    }));
    await expect(supabaseAccessLoader(supabase)()).rejects.toBe(failure);
  });
});
