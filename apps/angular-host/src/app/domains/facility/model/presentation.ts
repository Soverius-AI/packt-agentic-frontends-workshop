import type {
  AlarmApprovalAuditEntry,
  MetricSummary,
  HistorianEntry,
  MetricHistory,
  MetricReading,
} from '@packt-workshop/contracts';

export function metricValue(metric: MetricSummary): string {
  if (metric.currentNumericValue !== null) {
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(
      metric.currentNumericValue,
    );
  }
  return metric.currentTextValue ?? '—';
}

export function readingValue(reading: HistorianEntry): string {
  const value =
    reading.numericValue == null
      ? (reading.textValue ?? '—')
      : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(reading.numericValue);
  return reading.unit ? `${value} ${reading.unit}` : value;
}

export function alarmLabel(metric: MetricSummary): string {
  if (!metric.activeAlarm) return 'Raise alarm';
  if (metric.activeAlarm.state === 'raised') return 'Acknowledge';
  return 'Resolve';
}

export function alarmState(metric: MetricSummary): string {
  return metric.activeAlarm?.state ?? 'not raised';
}

export function chartPoints(history: MetricHistory): string {
  const values = history.readings
    .map((reading, index) => ({ index, value: reading.numericValue }))
    .filter((reading): reading is { index: number; value: number } => reading.value !== null);
  if (values.length < 2) return '';
  const min = Math.min(...values.map((reading) => reading.value));
  const max = Math.max(...values.map((reading) => reading.value));
  const range = max - min || 1;
  return values
    .map((reading, position) => {
      const x = 72 + (position / (values.length - 1)) * 672;
      const y = 168 - ((reading.value - min) / range) * 144;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function chartTicks(
  history: MetricHistory,
): readonly { label: string; value: number; y: number }[] {
  const values = history.readings
    .map((reading) => reading.numericValue)
    .filter((value): value is number => value !== null);
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const midpoint = min + (max - min) / 2;
  const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
  return [
    { label: `${format.format(max)} ${history.metric.unit}`, value: max, y: 24 },
    { label: `${format.format(midpoint)} ${history.metric.unit}`, value: midpoint, y: 96 },
    { label: `${format.format(min)} ${history.metric.unit}`, value: min, y: 168 },
  ];
}

export function historyRange(history: MetricHistory): string {
  const values = history.readings
    .map((reading) => reading.numericValue)
    .filter((value): value is number => value !== null);
  if (values.length === 0) return 'No numeric readings';
  const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
  return `${format.format(Math.min(...values))}–${format.format(Math.max(...values))} ${history.metric.unit}`;
}

export function shiftManagers(history: MetricHistory): string {
  return [...new Set(history.readings.map((reading) => reading.shiftManagerName))].join(', ');
}

export function stateChanges(history: MetricHistory): readonly MetricReading[] {
  const changes: MetricReading[] = [];
  let previous: string | null | undefined;
  for (const reading of history.readings) {
    if (reading.textValue !== previous) {
      changes.push(reading);
      previous = reading.textValue;
    }
  }
  return changes.slice(-8).reverse();
}

export function timeLabel(timestamp: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(timestamp));
}

export function alarmApprovalOutcome(entry: AlarmApprovalAuditEntry): string {
  if (entry.outcome === 'executed') return 'Alarm raised';
  if (entry.outcome === 'failed') return `Execution failed: ${entry.error}`;
  return 'No alarm raised';
}
