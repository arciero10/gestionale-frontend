import { ApplicationConfig, provideAppInitializer, inject, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Keycloak from 'keycloak-js';

import { routes } from './app.routes';
import MyPreset from './mypreset';
import { includeBearerTokenInterceptor } from 'keycloak-angular';
import { provideKeycloakAngular } from './app/keycloak.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideKeycloakAngular(),

    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),

    provideAnimationsAsync(),

    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    }),

    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideAppInitializer(() => {
      const kc = inject(Keycloak);
      console.log('[KC] presente:', !!kc);
      console.log('[KC] authenticated:', kc.authenticated);
      console.log('[KC] token:', !!kc.token);
    })
  ]
};
