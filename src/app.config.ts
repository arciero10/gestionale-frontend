import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { BrowserCacheLocation, InteractionType, PublicClientApplication } from '@azure/msal-browser';
import {
  MsalInterceptor,
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

export const MSAL_CLIENT_ID = '22d9f8b9-a94f-432d-a9d7-c74b44ba86e4';
export const MSAL_TENANT_ID = '3534f20c-fe93-4978-899c-e62fb8ea712d';
export const MSAL_AUTHORITY = `https://login.microsoftonline.com/${MSAL_TENANT_ID}`;

export function MSALInstanceFactory() {
  const origin = window.location.origin;

  return new PublicClientApplication({
    auth: {
      // Redirect URI da registrare nella SPA Entra ID:
      // - https://test.eventidicomunita.it
      // - http://localhost:4200
      clientId: MSAL_CLIENT_ID,
      authority: MSAL_AUTHORITY,
      redirectUri: origin,
      postLogoutRedirectUri: origin
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage
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
    provideHttpClient(withInterceptorsFromDi()),

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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
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
