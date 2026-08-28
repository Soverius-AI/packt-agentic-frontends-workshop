import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideCopilotChatLabels, provideCopilotKit } from '@copilotkit/angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),
    provideCopilotChatLabels({
      chatInputPlaceholder: 'Ask about this view or its history…',
      welcomeMessageText: 'Ask me to adjust this view or query the read-only historian.',
      chatDisclaimerText:
        'Chat can adjust this view and run reviewed, read-only historian queries. It cannot perform operational actions.',
    }),
  ],
};
