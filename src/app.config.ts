import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import MyPreset from './mypreset';
import { includeBearerTokenInterceptor, provideKeycloak } from 'keycloak-angular';
import { provideKeycloakAngular } from '@/keycloak.config';
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideKeycloakAngular(),
        provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: MyPreset, options: { darkModeSelector: '.app-dark' } } }),
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection(),
    ]
};

