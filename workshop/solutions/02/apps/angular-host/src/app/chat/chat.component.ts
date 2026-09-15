import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import type { ChatMessage } from '@packt-workshop/contracts';
import { ChatApi } from './chat-api';

@Component({
  selector: 'app-chat',
  imports: [FormField],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  readonly #api = inject(ChatApi);
  private readonly conversation = viewChild<ElementRef<HTMLOListElement>>('conversation');

  protected readonly messages = signal<readonly ChatMessage[]>([]);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly draft = signal({ content: '' });
  protected readonly chatForm = form(this.draft, (path) => {
    required(path.content, { message: 'Enter a message.' });
    maxLength(path.content, 4_000, {
      message: 'Keep the message below 4,000 characters.',
    });
  });

  constructor() {
    effect(() => {
      this.messages();
      this.pending();
      const conversation = this.conversation()?.nativeElement;
      if (!conversation) return;
      queueMicrotask(() => {
        conversation.scrollTop = conversation.scrollHeight;
      });
    });
  }

  protected send(): void {
    if (this.pending()) return;
    submit(this.chatForm, async () => {
      const content = this.draft().content.trim();
      if (!content) return;
      const previousMessages = this.messages();
      const messages: readonly ChatMessage[] = [...previousMessages, { role: 'user', content }];
      this.messages.set(messages);
      this.pending.set(true);
      this.error.set(undefined);
      try {
        const response = await this.#api.send(messages);
        this.messages.set([...messages, response.message]);
        this.draft.set({ content: '' });
        this.chatForm().reset();
      } catch (error) {
        this.messages.set(previousMessages);
        this.error.set(error instanceof Error ? error.message : 'Unexpected chat error.');
      } finally {
        this.pending.set(false);
      }
    });
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    this.send();
  }
}
