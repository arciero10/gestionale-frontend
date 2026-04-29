import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import {
  MsalService,
  MsalBroadcastService,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration
} from '@azure/msal-angular';

import { routes } from './app.routes';
import MyPreset from './mypreset';

export const MSAL_AUTHORITY = 'https://eventidicomunita.ciamlogin.com/069bb457-b363-4340-8086-d7dd3b60a2b5';
export const MSAL_KNOWN_AUTHORITIES = ['eventidicomunita.ciamlogin.com'];

export function MSALInstanceFactory() {
  const origin = window.location.origin;

  return new PublicClientApplication({
    auth: {
      // Redirect URI da registrare in Entra:
      // - https://test.eventidicomunita.it
      // - https://kind-dune-0a539c310.7.azurestaticapps.net
      // - http://localhost:4200
      // Produzione futura:
      // - https://www.eventidicomunita.it
      clientId: '21ee1eae-67e3-4c7c-86ab-db78994d8666',
      authority: MSAL_AUTHORITY,
      knownAuthorities: MSAL_KNOWN_AUTHORITIES,
      redirectUri: origin,
      postLogoutRedirectUri: origin
    },
    cache: {
      cacheLocation: 'localStorage'
    }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map()
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),

    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalService,
    MsalBroadcastService,

    provideAppInitializer(async () => {
      const msal = inject(MsalService);
      await msal.instance.initialize();
    }),

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
    provideZonelessChangeDetection()
  ]
};
