import { Component, inject, output, signal } from '@angular/core';
import type { HistorianToolResult } from '@packt-workshop/contracts';
import { FacilityApi } from '../facility-api';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  private readonly api = inject(FacilityApi);
  readonly result = output<HistorianToolResult>();
  protected readonly busy = signal(false);
  protected readonly response = signal<HistorianToolResult | undefined>(undefined);
  protected readonly error = signal('');

  protected async investigate(question: string): Promise<void> {
    if (this.busy() || !question.trim()) return;
    this.busy.set(true);
    this.response.set(undefined);
    this.error.set('');
    try {
      const result = await this.api.investigate(question.trim());
      this.response.set(result);
      this.result.emit(result);
    } catch {
      this.error.set('The investigation could not finish. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
