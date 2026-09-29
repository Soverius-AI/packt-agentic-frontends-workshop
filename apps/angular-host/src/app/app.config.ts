import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideCopilotChatLabels, provideCopilotKit } from '@copilotkit/angular';

import { investigationActivityType, investigationProgressSchema } from '@packt-workshop/contracts';
import { InvestigationProgressCard } from './domains/facility/feat-dashboard/agent/investigation-progress-card';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideCopilotKit({
      runtimeUrl: '/api/copilotkit',
      renderActivityMessages: [
        {
          activityType: investigationActivityType,
          content: investigationProgressSchema,
          component: InvestigationProgressCard,
        },
      ],
    }),
    provideCopilotChatLabels({
      chatInputPlaceholder: 'Ask about this view or its history…',
      welcomeMessageText: 'Ask me to adjust this view or query the read-only historian.',
      chatDisclaimerText:
        'Chat can propose an alarm, but only the operator can approve the audited action.',
    }),
  ],
};
