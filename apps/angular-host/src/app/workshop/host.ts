import type {
  ConfigureFacilityView,
  FacilityDashboard,
  FacilityViewState,
  ShowHistorianReadingsToolInput,
} from '@packt-workshop/contracts';

/** Prepared application adapter. Tools act through existing UI operations. */
export interface WorkshopHost {
  facilityViewState(): FacilityViewState;
  rooms(): FacilityDashboard['rooms'];
  shiftManagerOptions(): string[];
  listMetrics(input: unknown): Promise<unknown>;
  configureFacilityView(command: ConfigureFacilityView): Promise<unknown>;
  invalidToolPayload(message?: string): unknown;
  showHistorianReadings(result: ShowHistorianReadingsToolInput): unknown;
}
