import { Component, input } from '@angular/core';
import {
  anyActivityContentSchema,
  registerRenderActivityMessage,
  type ActivityRenderer,
} from '@copilotkit/angular';
export function registerGeneratedViewNotice(): void {
  registerRenderActivityMessage({
    activityType: 'a2ui-surface',
    agentId: 'default',
    content: anyActivityContentSchema,
    component: MainResultNotice,
  });
}
@Component({
  selector: 'app-main-result-notice',
  template: '<p>The generated view is available in the main area.</p>',
})
class MainResultNotice implements ActivityRenderer {
  readonly activityType = input.required<string>();
  readonly content = input.required<unknown>();
  readonly message = input.required<ReturnType<ActivityRenderer['message']>>();
  readonly agent = input<ReturnType<ActivityRenderer['agent']>>();
}
