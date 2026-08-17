export type MachineState = "running" | "at-risk" | "isolated";

export class PlantSimulator {
  readonly #states = new Map<string, MachineState>();

  get(machineId: string): MachineState {
    return this.#states.get(machineId) ?? "running";
  }

  flagRisk(machineId: string): MachineState {
    if (this.get(machineId) !== "isolated") {
      this.#states.set(machineId, "at-risk");
    }
    return this.get(machineId);
  }

  isolate(machineId: string): MachineState {
    this.#states.set(machineId, "isolated");
    return this.get(machineId);
  }
}
