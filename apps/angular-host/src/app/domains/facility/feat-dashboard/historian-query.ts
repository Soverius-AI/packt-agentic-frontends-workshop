import { Component, inject, signal } from '@angular/core';
import { FacilityStore } from '../data/facility-store';
import { form, FormField, required, maxLength } from '@angular/forms/signals';
import type { HistorianToolResult } from '@packt-workshop/contracts';
import { FacilityClient } from '../data/facility-client';

@Component({
  selector: 'app-historian-query',
  imports: [FormField],
  template: `
    <aside aria-labelledby="chat-title">
      <div class="chat-heading">
        <div>
          <p class="eyebrow">Historian</p>
          <h2 id="chat-title">Ask about the readings</h2>
        </div>
      </div>
      <p class="chat-boundary">
        Describe the readings you need. The results appear in the existing table.
      </p>
      <form
        (submit)="$event.preventDefault(); investigate(question().text)"
        [attr.aria-busy]="busy()"
      >
        <label for="question">Your question</label>
        <textarea
          [formField]="questionForm.text"
          id="question"
          rows="4"
          placeholder="Show the highest air temperature for each shift manager"
        ></textarea>
        <button type="submit" [disabled]="busy() || questionForm().invalid()">
          {{ busy() ? 'Investigating…' : 'Find readings' }}
        </button>
      </form>
      <div aria-live="polite">
        @if (error()) {
          <p role="alert">{{ error() }}</p>
        }
        @if (response(); as result) {
          @if (result.status === 'executed') {
            <p>{{ result.rowCount }} readings found.</p>
          } @else {
            <p role="alert">{{ result.message }}</p>
          }
          <details>
            <summary>Query and review</summary>
            <pre>{{ result.sql }}</pre>
            <p>{{ result.review.summary }}</p>
          </details>
        }
      </div>
    </aside>
  `,
  styles: `
    :host {
      position: sticky;
      top: 24px;
      display: flex;
      align-self: start;
      height: clamp(520px, calc(100vh - 48px), 900px);
      min-width: 0;
      min-height: 0;
      margin: -22px -22px -22px 0;
      padding: 22px;
      overflow: hidden;
      border-left: 1px solid #e0d8cf;
      background: #faf8f4;
      color: #211c18;
      contain: size;
    }

    * {
      box-sizing: border-box;
    }

    aside {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }

    .eyebrow {
      margin: 0;
      color: #73513a;
      font-size: 0.68rem;
      font-weight: 850;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .chat-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .chat-heading h2 {
      margin: 3px 0 0;
      font-size: 1.45rem;
      line-height: 1.1;
    }

    .chat-heading > span {
      padding: 6px 9px;
      border-radius: 999px;
      background: #e8e4ee;
      color: #473e55;
      font-size: 0.68rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .chat-boundary {
      margin: 14px 0;
      color: #655d56;
      font-size: 0.82rem;
    }

    @media (max-width: 1100px) {
      :host {
        position: static;
        order: -1;
        height: 620px;
        min-height: 480px;
        margin: 0;
        padding: 20px 0 22px;
        border-left: 0;
        border-bottom: 1px solid #e0d8cf;
        background: transparent;
      }
    }
    form {
      display: grid;
      gap: 12px;
    }
    label {
      font-weight: 650;
    }
    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #8b8178;
      border-radius: 8px;
      font: inherit;
      resize: vertical;
    }
    button {
      padding: 12px;
      border: 0;
      border-radius: 8px;
      background: #584034;
      color: white;
      font: inherit;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.65;
      cursor: wait;
    }
    pre {
      font-size: 13px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    details {
      margin-top: 20px;
    }
    summary {
      cursor: pointer;
    }
  `,
})
export class HistorianQuery {
  private readonly api = inject(FacilityClient);
  private readonly store = inject(FacilityStore);
  protected readonly question = signal({ text: '' });
  protected readonly questionForm = form(this.question, (path) => {
    required(path.text);
    maxLength(path.text, 4000);
  });
  protected readonly busy = signal(false);
  protected readonly response = signal<HistorianToolResult | undefined>(undefined);
  protected readonly error = signal('');

  protected async investigate(question: string): Promise<void> {
    if (this.busy() || this.questionForm().invalid() || !question.trim()) return;
    this.busy.set(true);
    this.response.set(undefined);
    this.error.set('');
    try {
      const result = await this.api.investigate(question.trim());
      this.response.set(result);
      if (result.status === 'executed')
        this.store.showHistorianResult({ ...result, id: crypto.randomUUID() });
    } catch {
      this.error.set('The investigation could not finish. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
