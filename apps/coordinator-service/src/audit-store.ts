import { randomUUID } from "node:crypto";
import type { AuditEvent } from "@packt-workshop/contracts";

export class AuditStore {
  readonly #events = new Map<string, AuditEvent[]>();

  append(
    correlationId: string,
    event: Omit<AuditEvent, "eventId" | "correlationId" | "occurredAt">,
  ): AuditEvent {
    const stored: AuditEvent = {
      ...event,
      eventId: randomUUID(),
      correlationId,
      occurredAt: new Date().toISOString(),
    };
    const events = this.#events.get(correlationId) ?? [];
    events.push(stored);
    this.#events.set(correlationId, events);
    return structuredClone(stored);
  }

  list(correlationId: string): AuditEvent[] {
    return structuredClone(this.#events.get(correlationId) ?? []);
  }
}
