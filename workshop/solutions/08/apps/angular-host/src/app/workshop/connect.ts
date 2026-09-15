import type { WorkshopHost } from './host';
import { connectViewContext, registerFacilityTools, registerAlarmApproval } from './prepared-tools';

export function connectWorkshop(host: WorkshopHost): void {
  connectViewContext(host);
  registerFacilityTools(host);
  registerAlarmApproval();
}
