import {
  ApplicationConfig,
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

export const MSAL_CLIENT_ID = '21ee1eae-67e3-4c7c-86ab-db78994d8666';
export const MSAL_TENANT_ID = '069bb457-b363-4340-8086-d7dd3b60a2b5';
export const MSAL_EXTERNAL_TENANT_NAME = 'eventidicomunita';
export const MSAL_AUTHORITY = `https://${MSAL_EXTERNAL_TENANT_NAME}.ciamlogin.com/${MSAL_TENANT_ID}`;

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
