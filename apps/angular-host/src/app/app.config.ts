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
      chatInputPlaceholder: 'Ask about incident management…',
      welcomeMessageText: 'Ask a general question about incident management.',
      chatDisclaimerText:
        'Chat can adjust this view and its filters, but cannot inspect readings or perform operational actions.',
    }),
  ],
};
