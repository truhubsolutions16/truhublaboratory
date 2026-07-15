import type { BlockDefinition } from "./types";

/**
 * Signal-domain block library.
 * Every block operates on scalar numeric signals sampled at the sim time step.
 * Circuit-domain (SPICE) blocks will be added on top of this same contract.
 */
export const BLOCK_LIBRARY: ReadonlyArray<BlockDefinition> = [
  // ---------- SOURCES ----------
  {
    type: "src.constant",
    name: "Constant",
    category: "signal",
    description: "Emits a constant value.",
    ports: [{ id: "y", label: "y", direction: "out", kind: "signal" }],
    params: [
      { key: "value", label: "Value", type: "number", default: 1, step: 0.1 },
    ],
  },
  {
    type: "src.step",
    name: "Step",
    category: "signal",
    description: "0 until t≥tStart, then amplitude.",
    ports: [{ id: "y", label: "y", direction: "out", kind: "signal" }],
    params: [
      { key: "tStart", label: "Start time", type: "number", default: 0.5, unit: "s", min: 0, step: 0.1 },
      { key: "amplitude", label: "Amplitude", type: "number", default: 1, step: 0.1 },
    ],
  },
  {
    type: "src.sine",
    name: "Sine Wave",
    category: "signal",
    description: "A·sin(2π·f·t + φ) + bias",
    ports: [{ id: "y", label: "y", direction: "out", kind: "signal" }],
    params: [
      { key: "amplitude", label: "Amplitude", type: "number", default: 1, step: 0.1 },
      { key: "frequency", label: "Frequency", type: "number", default: 1, unit: "Hz", min: 0, step: 0.1 },
      { key: "phase", label: "Phase", type: "number", default: 0, unit: "rad", step: 0.1 },
      { key: "bias", label: "Bias", type: "number", default: 0, step: 0.1 },
    ],
  },
  {
    type: "src.noise",
    name: "Noise",
    category: "signal",
    description: "White noise, uniform in [-A, A].",
    ports: [{ id: "y", label: "y", direction: "out", kind: "signal" }],
    params: [{ key: "amplitude", label: "Amplitude", type: "number", default: 0.2, step: 0.05 }],
  },
  {
    type: "src.pulse",
    name: "PWM",
    category: "power",
    description: "Pulse train — duty cycle & frequency.",
    ports: [{ id: "y", label: "y", direction: "out", kind: "signal" }],
    params: [
      { key: "frequency", label: "Frequency", type: "number", default: 5, unit: "Hz", min: 0.01, step: 0.1 },
      { key: "duty", label: "Duty", type: "number", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "high", label: "High level", type: "number", default: 1, step: 0.1 },
      { key: "low", label: "Low level", type: "number", default: 0, step: 0.1 },
    ],
  },

  // ---------- MATH ----------
  {
    type: "math.gain",
    name: "Gain",
    category: "control",
    description: "y = k · u",
    ports: [
      { id: "u", label: "u", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "signal" },
    ],
    params: [{ key: "k", label: "Gain (k)", type: "number", default: 2, step: 0.1 }],
  },
  {
    type: "math.sum",
    name: "Sum",
    category: "control",
    description: "y = a + b · sign",
    ports: [
      { id: "a", label: "a", direction: "in", kind: "signal" },
      { id: "b", label: "b", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "signal" },
    ],
    params: [
      {
        key: "sign",
        label: "B sign",
        type: "enum",
        default: "+",
        options: [
          { value: "+", label: "+" },
          { value: "-", label: "−" },
        ],
      },
    ],
  },
  {
    type: "math.product",
    name: "Product",
    category: "control",
    description: "y = a · b",
    ports: [
      { id: "a", label: "a", direction: "in", kind: "signal" },
      { id: "b", label: "b", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "signal" },
    ],
    params: [],
  },
  {
    type: "math.abs",
    name: "Abs / Rectifier",
    category: "power",
    description: "y = |u|",
    ports: [
      { id: "u", label: "u", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "signal" },
    ],
    params: [],
  },
  {
    type: "math.saturation",
    name: "Saturation",
    category: "control",
    description: "Clamp between min and max.",
    ports: [
      { id: "u", label: "u", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "signal" },
    ],
    params: [
      { key: "min", label: "Min", type: "number", default: -1, step: 0.1 },
      { key: "max", label: "Max", type: "number", default: 1, step: 0.1 },
    ],
  },

  // ---------- DYNAMICS ----------
  {
    type: "dyn.integrator",
    name: "Integrator",
    category: "control",
    description: "y = ∫ u dt (with initial value)",
    ports: [
      { id: "u", label: "u", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "signal" },
    ],
    params: [{ key: "y0", label: "Initial value", type: "number", default: 0, step: 0.1 }],
  },
  {
    type: "dyn.derivative",
    name: "Derivative",
    category: "control",
    description: "y ≈ du/dt",
    ports: [
      { id: "u", label: "u", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "signal" },
    ],
    params: [],
  },
  {
    type: "dyn.tf1",
    name: "1st-Order TF",
    category: "control",
    description: "τ·ẏ + y = K·u  (low-pass)",
    ports: [
      { id: "u", label: "u", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "signal" },
    ],
    params: [
      { key: "K", label: "Gain K", type: "number", default: 1, step: 0.1 },
      { key: "tau", label: "τ", type: "number", default: 0.2, unit: "s", min: 0.001, step: 0.05 },
    ],
  },
  {
    type: "ctrl.pid",
    name: "PID",
    category: "control",
    description: "PID with anti-windup.",
    ports: [
      { id: "u", label: "err", direction: "in", kind: "signal" },
      { id: "y", label: "u", direction: "out", kind: "signal" },
    ],
    params: [
      { key: "Kp", label: "Kp", type: "number", default: 1, step: 0.1 },
      { key: "Ki", label: "Ki", type: "number", default: 0.5, step: 0.1 },
      { key: "Kd", label: "Kd", type: "number", default: 0.05, step: 0.01 },
      { key: "uMin", label: "u min", type: "number", default: -10, step: 0.5 },
      { key: "uMax", label: "u max", type: "number", default: 10, step: 0.5 },
    ],
  },

  // ---------- LOGIC ----------
  {
    type: "logic.comparator",
    name: "Comparator",
    category: "ics",
    description: "y = (a > b) ? high : low",
    ports: [
      { id: "a", label: "a", direction: "in", kind: "signal" },
      { id: "b", label: "b", direction: "in", kind: "signal" },
      { id: "y", label: "y", direction: "out", kind: "logic" },
    ],
    params: [
      { key: "high", label: "High", type: "number", default: 1 },
      { key: "low", label: "Low", type: "number", default: 0 },
    ],
  },
  {
    type: "logic.and",
    name: "AND Gate",
    category: "ics",
    description: "Logic AND (>0.5 = HIGH)",
    ports: [
      { id: "a", label: "a", direction: "in", kind: "logic" },
      { id: "b", label: "b", direction: "in", kind: "logic" },
      { id: "y", label: "y", direction: "out", kind: "logic" },
    ],
    params: [],
  },
  {
    type: "logic.or",
    name: "OR Gate",
    category: "ics",
    description: "Logic OR",
    ports: [
      { id: "a", label: "a", direction: "in", kind: "logic" },
      { id: "b", label: "b", direction: "in", kind: "logic" },
      { id: "y", label: "y", direction: "out", kind: "logic" },
    ],
    params: [],
  },
  {
    type: "logic.not",
    name: "NOT Gate",
    category: "ics",
    description: "Logic NOT",
    ports: [
      { id: "u", label: "u", direction: "in", kind: "logic" },
      { id: "y", label: "y", direction: "out", kind: "logic" },
    ],
    params: [],
  },

  // ---------- SINKS ----------
  {
    type: "sink.scope",
    name: "Scope",
    category: "signal",
    description: "Plots inputs vs time. Up to 4 channels.",
    ports: [
      { id: "ch1", label: "ch1", direction: "in", kind: "signal" },
      { id: "ch2", label: "ch2", direction: "in", kind: "signal" },
      { id: "ch3", label: "ch3", direction: "in", kind: "signal" },
      { id: "ch4", label: "ch4", direction: "in", kind: "signal" },
    ],
    params: [
      { key: "window", label: "Time window", type: "number", default: 5, unit: "s", min: 0.1, step: 0.5 },
    ],
  },
  {
    type: "sink.display",
    name: "Display",
    category: "signal",
    description: "Shows current value.",
    ports: [{ id: "u", label: "u", direction: "in", kind: "signal" }],
    params: [{ key: "decimals", label: "Decimals", type: "number", default: 3, min: 0, max: 8, step: 1 }],
  },
];

export const BLOCK_BY_TYPE = new Map(BLOCK_LIBRARY.map((b) => [b.type, b]));

export function getBlockDef(type: string): BlockDefinition | undefined {
  return BLOCK_BY_TYPE.get(type);
}
