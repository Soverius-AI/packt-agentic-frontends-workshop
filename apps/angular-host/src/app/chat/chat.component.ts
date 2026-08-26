import { NgComponentOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  createEnvironmentInjector,
  DestroyRef,
  EnvironmentInjector,
  inject,
  signal,
  type Type,
} from '@angular/core';

@Component({
  selector: 'app-chat',
  imports: [NgComponentOutlet],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  readonly #parentInjector = inject(EnvironmentInjector);
  readonly #destroyRef = inject(DestroyRef);

  protected readonly chatComponent = signal<Type<unknown> | undefined>(undefined);
  protected readonly chatInjector = signal<EnvironmentInjector | undefined>(undefined);
  protected readonly loadError = signal(false);

  constructor() {
    afterNextRender(() => void this.#loadChat());
    this.#destroyRef.onDestroy(() => this.chatInjector()?.destroy());
  }

  async #loadChat(): Promise<void> {
    try {
      const {
        CopilotChat,
        CopilotKit,
        CopilotkitAgentFactory,
        CopilotkitThreadsFactory,
        provideCopilotChatLabels,
        provideCopilotKit,
      } = await import('@copilotkit/angular');
      if (this.#destroyRef.destroyed) return;

      this.chatInjector.set(
        createEnvironmentInjector(
          [
            provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),
            CopilotKit,
            CopilotkitAgentFactory,
            CopilotkitThreadsFactory,
            provideCopilotChatLabels({
              chatInputPlaceholder: 'Ask about incident management…',
              welcomeMessageText: 'Ask a general question about incident management.',
              chatDisclaimerText: 'Chat cannot access current facility data or perform actions.',
            }),
          ],
          this.#parentInjector,
        ),
      );
      this.chatComponent.set(CopilotChat);
    } catch {
      this.loadError.set(true);
    }
  }
}
