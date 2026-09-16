import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideCopilotKit } from '@copilotkit/angular';
import { facilityWebCatalog } from './a2ui/web-catalog';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient(), provideRouter(routes), provideCopilotKit({
    runtimeUrl: '/api/copilotkit',
    a2ui: { catalog: facilityWebCatalog }
  })],
};
