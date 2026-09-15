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
      welcomeMessageText: 'How can I help?',
      chatDisclaimerText:
        'Check answers against facility evidence. Operational actions require operator control.',
    }),
  ],
};
