import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AccessSnapshot, NO_ACCESS } from '../access/access.model';
import { AccessLoader, provideAccess } from '../access/access.service';

export interface SupabaseConfig {
  readonly url: string;
  readonly publishableKey: string;
}

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>(
  'SUPABASE_CLIENT',
);

/** Connects the app to Supabase and loads access from the current session. */
export function provideSupabase(config: SupabaseConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => createClient(config.url, config.publishableKey),
    },
    provideAccess(() => supabaseAccessLoader(inject(SUPABASE_CLIENT))),
  ]);
}

export function supabaseAccessLoader(client: SupabaseClient): AccessLoader {
  return async () => {
    const { data: auth } = await client.auth.getSession();
    if (auth.session === null) {
      return NO_ACCESS;
    }
    const { data, error } = await client.rpc('my_access');
    if (error) {
      throw error;
    }
    return data as AccessSnapshot;
  };
}
