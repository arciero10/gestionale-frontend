import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { App } from './app';
import { loadApiConfiguration } from './app/auth/api-config';

loadApiConfiguration().then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
