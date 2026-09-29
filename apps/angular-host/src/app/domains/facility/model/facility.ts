import type { FacilityDashboard, HistorianToolResult } from '@packt-workshop/contracts';
export type DisplayMode = 'snapshot' | 'reading-log' | 'historian-result';
export type HistorianSelection = Extract<HistorianToolResult, { status: 'executed' }> & {
  id: string;
};
export type SnapshotRow = {
  room: FacilityDashboard['rooms'][number];
  metric: FacilityDashboard['rooms'][number]['metrics'][number];
};
export interface ReadingFilters {
  from: string;
  to: string;
  shiftManager: string;
  roomId: string;
  metricId: string;
  condition: string;
}
export const READING_PAGE_SIZE = 50;
