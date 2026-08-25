import type { MetricUpdateEvent } from "@packt-workshop/contracts";
import type { FacilityRepository } from "./repository.js";

type MetricUpdateListener = (event: MetricUpdateEvent) => void;

export interface LiveTelemetryOptions {
  readonly minimumIntervalMs?: number;
  readonly maximumIntervalMs?: number;
  readonly random?: () => number;
}

export class LiveTelemetry {
  readonly #listeners = new Set<MetricUpdateListener>();
  readonly #minimumIntervalMs: number;
  readonly #maximumIntervalMs: number;
  readonly #random: () => number;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly repository: FacilityRepository,
    options: LiveTelemetryOptions = {},
  ) {
    this.#minimumIntervalMs = options.minimumIntervalMs ?? 1_200;
    this.#maximumIntervalMs = options.maximumIntervalMs ?? 4_000;
    this.#random = options.random ?? Math.random;
  }

  start(): void {
    if (!this.#timer) {
      this.#scheduleNext();
    }
  }

  stop(): void {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  subscribe(listener: MetricUpdateListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  emitNext(): MetricUpdateEvent {
    const event = this.repository.recordRandomReading(this.#random);
    for (const listener of this.#listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Live telemetry subscriber failed", error);
      }
    }
    return event;
  }

  #scheduleNext(): void {
    const intervalRange = Math.max(
      0,
      this.#maximumIntervalMs - this.#minimumIntervalMs,
    );
    const delay =
      this.#minimumIntervalMs + Math.floor(this.#random() * intervalRange);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      try {
        this.emitNext();
      } catch (error) {
        console.error("Live telemetry generation failed", error);
      }
      this.#scheduleNext();
    }, delay);
  }
}
