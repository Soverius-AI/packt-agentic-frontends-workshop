import { TestBed } from '@angular/core/testing';
import type { AngularToolCall } from '@copilotkit/angular';
import type { QueryHistorianToolInput } from '@packt-workshop/contracts';
import { HistorianQueryRenderer } from './historian-query-renderer';

describe('HistorianQueryRenderer', () => {
  it('renders generated SQL, reviewer verdict, policy metadata, and generic rows', async () => {
    const fixture = TestBed.createComponent(HistorianQueryRenderer);
    const toolCall: AngularToolCall<QueryHistorianToolInput> = {
      name: 'query_historian',
      status: 'complete',
      args: {
        sql: 'SELECT shift_manager_name, MAX(numeric_value) FROM historian_readings',
        explanation: 'Compare maximum temperatures.',
      },
      result: JSON.stringify({
        status: 'executed',
        question: 'Compare managers.',
        sql: 'SELECT shift_manager_name, MAX(numeric_value) FROM historian_readings',
        explanation: 'Compare maximum temperatures.',
        review: { approved: true, summary: 'The SQL answers the question.', concerns: [] },
        policyVersion: 'historian-v1',
        columns: ['shift_manager_name', 'maximum'],
        rows: [['Charles Bond', 19.8]],
        rowCount: 1,
        truncated: false,
        durationMs: 4,
      }),
    };
    fixture.componentRef.setInput('toolCall', toolCall);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('The SQL answers the question.');
    expect(compiled.textContent).toContain('historian-v1');
    expect(compiled.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(compiled.querySelector('tbody tr')?.textContent).toContain('Charles Bond');
  });
});
