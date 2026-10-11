import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { App } from './app';
import { loadApiConfiguration } from './app/auth/api-config';
import { rememberOnboardingInvitation } from './app/auth/onboarding-invitation';

rememberOnboardingInvitation();
loadApiConfiguration().then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
