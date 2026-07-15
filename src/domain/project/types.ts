import type { BlockInstance, WireInstance } from "@/domain/blocks/types";

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  description?: string;
}

export interface SimulationSettings {
  timeStep: number;      // seconds
  duration: number;      // seconds, 0 = unbounded
  speed: number;         // 1 = realtime, 2 = 2x, 0.5 = half
  solver: "euler" | "rk4";
}

export interface ProjectFile {
  schemaVersion: 1;
  meta: ProjectMeta;
  blocks: BlockInstance[];
  wires: WireInstance[];
  simulation: SimulationSettings;
}

export const DEFAULT_SIM_SETTINGS: SimulationSettings = {
  timeStep: 1e-4,
  duration: 0,
  speed: 1,
  solver: "rk4",
};
