import { Component, computed, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import {
  historianToolResultSchema,
  type HistorianToolResult,
  type QueryHistorianToolInput,
} from '@packt-workshop/contracts';

export function parseHistorianResult(value: string | undefined): HistorianToolResult | undefined {
  if (!value) return undefined;
  try {
    const parsed = historianToolResultSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

@Component({
  selector: 'app-historian-query-renderer',
  templateUrl: './historian-query-renderer.html',
  styleUrl: './historian-query-renderer.scss',
})
export class HistorianQueryRenderer implements ToolRenderer<QueryHistorianToolInput> {
  readonly toolCall = input.required<AngularToolCall<QueryHistorianToolInput>>();
  protected readonly result = computed(() => parseHistorianResult(this.toolCall().result));
}
