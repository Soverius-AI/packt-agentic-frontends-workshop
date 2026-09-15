import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { chatResponseSchema, type ChatMessage, type ChatResponse } from '@packt-workshop/contracts';
import { firstValueFrom } from 'rxjs';

@Service()
export class ChatApi {
  readonly #http = inject(HttpClient);

  async send(messages: readonly ChatMessage[]): Promise<ChatResponse> {
    const response = await firstValueFrom(this.#http.post<unknown>('/api/chat', { messages }));
    return chatResponseSchema.parse({ message: response });
  }
}
