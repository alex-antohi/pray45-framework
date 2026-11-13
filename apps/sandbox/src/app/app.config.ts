import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideSupabase } from '@pray45/auth';
import { provideBrand } from '@pray45/ui';
import { appRoutes } from './app.routes';
import { sandboxBrand } from './brand.config';
import { supabaseConfig } from './supabase.config';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideSupabase(supabaseConfig),
    provideBrand(sandboxBrand),
  ],
};
