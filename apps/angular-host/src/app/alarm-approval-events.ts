import { Service } from '@angular/core';
import type { AlarmApprovalAuditEntry } from '@packt-workshop/contracts';
import { Subject } from 'rxjs';

@Service()
export class AlarmApprovalEvents {
  readonly #recorded = new Subject<AlarmApprovalAuditEntry>();
  readonly recorded$ = this.#recorded.asObservable();

  notify(record: AlarmApprovalAuditEntry): void {
    this.#recorded.next(record);
  }
}
