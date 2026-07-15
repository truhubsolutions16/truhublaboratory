import type { BlockInstance } from "@/domain/blocks/types";
import type { BlockRuntime, SimContext } from "./types";

/**
 * Runtime implementations for each block type.
 * Kept separate from the library so definitions remain serializable.
 */

const p = (b: BlockInstance, k: string, d: number): number => {
  const v = b.params[k];
  return typeof v === "number" ? v : d;
};
const ps = (b: BlockInstance, k: string, d: string): string => {
  const v = b.params[k];
  return typeof v === "string" ? v : d;
};

export const RUNTIMES: Record<string, BlockRuntime<unknown>> = {
  "src.constant": {
    init: () => null,
    step: (s, _i, _c, b) => ({ state: s, outputs: { y: p(b, "value", 1) } }),
  },
  "src.step": {
    init: () => null,
    step: (s, _i, c, b) => ({
      state: s,
      outputs: { y: c.t >= p(b, "tStart", 0.5) ? p(b, "amplitude", 1) : 0 },
    }),
  },
  "src.sine": {
    init: () => null,
    step: (s, _i, c, b) => {
      const A = p(b, "amplitude", 1);
      const f = p(b, "frequency", 1);
      const ph = p(b, "phase", 0);
      const bias = p(b, "bias", 0);
      return { state: s, outputs: { y: A * Math.sin(2 * Math.PI * f * c.t + ph) + bias } };
    },
  },
  "src.noise": {
    init: () => null,
    step: (s, _i, _c, b) => {
      const A = p(b, "amplitude", 0.2);
      return { state: s, outputs: { y: (Math.random() * 2 - 1) * A } };
    },
  },
  "src.pulse": {
    init: () => null,
    step: (s, _i, c, b) => {
      const f = p(b, "frequency", 5);
      const duty = p(b, "duty", 0.5);
      const hi = p(b, "high", 1);
      const lo = p(b, "low", 0);
      const phase = (c.t * f) % 1;
      return { state: s, outputs: { y: phase < duty ? hi : lo } };
    },
  },

  "math.gain": {
    init: () => null,
    step: (s, i, _c, b) => ({ state: s, outputs: { y: p(b, "k", 2) * (i.u ?? 0) } }),
  },
  "math.sum": {
    init: () => null,
    step: (s, i, _c, b) => {
      const sign = ps(b, "sign", "+") === "-" ? -1 : 1;
      return { state: s, outputs: { y: (i.a ?? 0) + sign * (i.b ?? 0) } };
    },
  },
  "math.product": {
    init: () => null,
    step: (s, i) => ({ state: s, outputs: { y: (i.a ?? 0) * (i.b ?? 0) } }),
  },
  "math.abs": {
    init: () => null,
    step: (s, i) => ({ state: s, outputs: { y: Math.abs(i.u ?? 0) } }),
  },
  "math.saturation": {
    init: () => null,
    step: (s, i, _c, b) => {
      const lo = p(b, "min", -1);
      const hi = p(b, "max", 1);
      return { state: s, outputs: { y: Math.min(hi, Math.max(lo, i.u ?? 0)) } };
    },
  },

  "dyn.integrator": {
    init: (b) => ({ y: p(b, "y0", 0) }),
    step: (s, i, c) => {
      const state = s as { y: number };
      const y = state.y + (i.u ?? 0) * c.dt;
      return { state: { y }, outputs: { y } };
    },
  },
  "dyn.derivative": {
    init: () => ({ prev: 0, hasPrev: false }),
    step: (s, i, c) => {
      const state = s as { prev: number; hasPrev: boolean };
      const u = i.u ?? 0;
      const y = state.hasPrev ? (u - state.prev) / c.dt : 0;
      return { state: { prev: u, hasPrev: true }, outputs: { y } };
    },
  },
  "dyn.tf1": {
    init: () => ({ y: 0 }),
    step: (s, i, c, b) => {
      const state = s as { y: number };
      const K = p(b, "K", 1);
      const tau = Math.max(1e-6, p(b, "tau", 0.2));
      // backward-Euler: y = (y_prev + dt/tau * K*u) / (1 + dt/tau)
      const a = c.dt / tau;
      const y = (state.y + a * K * (i.u ?? 0)) / (1 + a);
      return { state: { y }, outputs: { y } };
    },
  },
  "ctrl.pid": {
    init: () => ({ integ: 0, prevErr: 0, hasPrev: false }),
    step: (s, i, c, b) => {
      const state = s as { integ: number; prevErr: number; hasPrev: boolean };
      const err = i.u ?? 0;
      const Kp = p(b, "Kp", 1);
      const Ki = p(b, "Ki", 0.5);
      const Kd = p(b, "Kd", 0.05);
      const uMin = p(b, "uMin", -10);
      const uMax = p(b, "uMax", 10);
      const integ = state.integ + err * c.dt;
      const deriv = state.hasPrev ? (err - state.prevErr) / c.dt : 0;
      let u = Kp * err + Ki * integ + Kd * deriv;
      let integClamped = integ;
      if (u > uMax) {
        u = uMax;
        integClamped = state.integ; // anti-windup: reject last increment
      } else if (u < uMin) {
        u = uMin;
        integClamped = state.integ;
      }
      return {
        state: { integ: integClamped, prevErr: err, hasPrev: true },
        outputs: { y: u },
      };
    },
  },

  "logic.comparator": {
    init: () => null,
    step: (s, i, _c, b) => ({
      state: s,
      outputs: { y: (i.a ?? 0) > (i.b ?? 0) ? p(b, "high", 1) : p(b, "low", 0) },
    }),
  },
  "logic.and": {
    init: () => null,
    step: (s, i) => ({ state: s, outputs: { y: (i.a ?? 0) > 0.5 && (i.b ?? 0) > 0.5 ? 1 : 0 } }),
  },
  "logic.or": {
    init: () => null,
    step: (s, i) => ({ state: s, outputs: { y: (i.a ?? 0) > 0.5 || (i.b ?? 0) > 0.5 ? 1 : 0 } }),
  },
  "logic.not": {
    init: () => null,
    step: (s, i) => ({ state: s, outputs: { y: (i.u ?? 0) > 0.5 ? 0 : 1 } }),
  },

  "sink.scope": {
    init: () => null,
    step: (s, i) => ({ state: s, outputs: { ...i } }),
  },
  "sink.display": {
    init: () => null,
    step: (s, i) => ({ state: s, outputs: { u: i.u ?? 0 } }),
  },
};

export function getRuntime(type: string): BlockRuntime<unknown> | undefined {
  return RUNTIMES[type];
}

export type { SimContext };
