import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
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
import { getApiConfiguration } from './app/auth/api-config';
import { PlatformAuthInterceptor } from './app/auth/platform-auth.interceptor';
import { MSAL_AUTHORITY, MSAL_CLIENT_ID } from './app/auth/entra-settings';
export { MSAL_AUTHORITY, MSAL_CLIENT_ID, MSAL_TENANT_ID, MSAL_EXTERNAL_TENANT_NAME } from './app/auth/entra-settings';


export function MSALInstanceFactory() {
  const origin = window.location.origin;

  return new PublicClientApplication({
    auth: {
      // Redirect URI da registrare nella SPA del tenant Microsoft Entra External ID:
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
  const api = getApiConfiguration();
  const protectedResourceMap = new Map<string, string[]>();
  if (api.apiScope) {
    protectedResourceMap.set(`${new URL(api.apiBaseUrl).origin}/*`, [api.apiScope]);
  } else {
    console.warn('[API] API_SCOPE non configurato: login disponibile, contesto API non attivo.');
  }
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
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
      useClass: PlatformAuthInterceptor,
      multi: true
    },
    MsalInterceptor,
    MsalService,
    MsalBroadcastService,

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
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
};
