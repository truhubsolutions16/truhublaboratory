import type { BlockInstance } from "@/domain/blocks/types";

export type SimStatus = "idle" | "running" | "paused" | "stopped" | "error";

export interface SimContext {
  t: number;            // current time (s)
  dt: number;           // step size (s)
  step: number;         // step index
}

export interface BlockRuntime<S = unknown> {
  /** Called once when simulation starts. */
  init(block: BlockInstance): S;
  /** Called every step. Returns new state + output port values. */
  step(
    state: S,
    inputs: Record<string, number>,
    ctx: SimContext,
    block: BlockInstance,
  ): { state: S; outputs: Record<string, number> };
}

export interface TraceSample {
  t: number;
  value: number;
}

export interface Trace {
  id: string;                     // blockId:portId
  label: string;
  samples: TraceSample[];
}
