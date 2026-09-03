import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {
  alarmApprovalAuditEntrySchema,
  alarmApprovalAuditSchema,
  facilityDashboardSchema,
  facilityReadingPageSchema,
  metricAlarmSchema,
  metricHistorySchema,
  metricUpdateEventSchema,
  type FacilityDashboard,
  type AlarmApprovalAudit,
  type AlarmApprovalAuditEntry,
  type AlarmApprovalRequest,
  type FacilityReadingPage,
  type MetricAlarm,
  type MetricHistory,
  type MetricUpdateEvent,
} from '@packt-workshop/contracts';
import { firstValueFrom } from 'rxjs';

@Service()
export class FacilityApi {
  readonly #http = inject(HttpClient);

  async getDashboard(): Promise<FacilityDashboard> {
    const response = await firstValueFrom(this.#http.get<unknown>('/api/dashboard'));
    return facilityDashboardSchema.parse(response);
  }

  async getHistory(metricId: string, hours = 168): Promise<MetricHistory> {
    const response = await firstValueFrom(
      this.#http.get<unknown>(`/api/metrics/${encodeURIComponent(metricId)}/history`, {
        params: { hours },
      }),
    );
    return metricHistorySchema.parse(response);
  }

  async getReadingEntries(filters: {
    from?: string;
    to?: string;
    shiftManager?: string;
    roomId?: string;
    metricId?: string;
    condition?: string;
    limit?: number;
    offset?: number;
  }): Promise<FacilityReadingPage> {
    const params: Record<string, string> = {};
    for (const [name, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params[name] = String(value);
    }
    const response = await firstValueFrom(this.#http.get<unknown>('/api/readings', { params }));
    return facilityReadingPageSchema.parse(response);
  }

  async raiseAlarm(metricId: string): Promise<MetricAlarm> {
    const response = await firstValueFrom(
      this.#http.post<unknown>(`/api/metrics/${encodeURIComponent(metricId)}/alarms`, {
        operatorId: 'night-reception',
      }),
    );
    return metricAlarmSchema.parse(response);
  }

  async updateAlarm(alarmId: string, state: 'acknowledged' | 'resolved'): Promise<MetricAlarm> {
    const response = await firstValueFrom(
      this.#http.patch<unknown>(`/api/alarms/${encodeURIComponent(alarmId)}`, {
        state,
        operatorId: 'night-reception',
      }),
    );
    return metricAlarmSchema.parse(response);
  }

  async getAlarmApprovalAudit(): Promise<AlarmApprovalAudit> {
    const response = await firstValueFrom(
      this.#http.get<unknown>('/api/alarm-approvals', { params: { limit: 20 } }),
    );
    return alarmApprovalAuditSchema.parse(response);
  }

  async decideAlarmApproval(request: AlarmApprovalRequest): Promise<AlarmApprovalAuditEntry> {
    const response = await firstValueFrom(
      this.#http.post<unknown>('/api/alarm-approvals', request),
    );
    return alarmApprovalAuditEntrySchema.parse(response);
  }

  subscribeToMetricUpdates(
    onUpdate: (event: MetricUpdateEvent) => void,
    onError: () => void,
  ): () => void {
    const source = new EventSource('/api/metric-updates');
    source.onmessage = (message) => {
      try {
        onUpdate(metricUpdateEventSchema.parse(JSON.parse(message.data) as unknown));
      } catch {
        onError();
      }
    };
    source.onerror = onError;
    return () => source.close();
  }
}
