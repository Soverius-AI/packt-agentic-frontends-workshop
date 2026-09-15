import type { WorkshopHost } from './host';
import {
  connectViewContext,
  registerFacilityTools,
  registerHistorianView,
  registerAlarmApproval,
} from './prepared-tools';

export function connectWorkshop(host: WorkshopHost): void {
  connectViewContext(host);
  registerFacilityTools(host);
  registerHistorianView(host);
  registerAlarmApproval();
}
