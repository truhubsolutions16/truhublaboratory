/**
 * Core block model. Every simulatable component in Truhub Lab implements
 * this contract. Blocks are pure descriptors — runtime state lives in the
 * simulation engine, not on the block itself.
 */

export type PortDirection = "in" | "out";
export type PortKind = "electrical" | "signal" | "mechanical" | "logic";

export interface PortDefinition {
  id: string;
  label: string;
  direction: PortDirection;
  kind: PortKind;
}

export type ParamType = "number" | "string" | "boolean" | "enum";

export interface ParamDefinition<T = unknown> {
  key: string;
  label: string;
  type: ParamType;
  default: T;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: ReadonlyArray<{ value: string; label: string }>;
  description?: string;
}

export type BlockCategory =
  | "electrical"
  | "semiconductors"
  | "ics"
  | "power"
  | "control"
  | "signal"
  | "mechanical"
  | "communication";

export interface BlockDefinition {
  type: string;                    // unique key, e.g. "electrical.resistor"
  name: string;
  category: BlockCategory;
  description: string;
  icon?: string;
  ports: ReadonlyArray<PortDefinition>;
  params: ReadonlyArray<ParamDefinition>;
  /** Update fn is attached in domain/simulation, not here — keeps blocks serializable. */
}

export interface BlockInstance {
  id: string;
  type: string;                    // → BlockDefinition.type
  position: { x: number; y: number };
  rotation: 0 | 90 | 180 | 270;
  params: Record<string, unknown>;
  label?: string;
}

export interface WireInstance {
  id: string;
  source: { blockId: string; portId: string };
  target: { blockId: string; portId: string };
}
