import type { BlockInstance, WireInstance } from "@/domain/blocks/types";
import { getBlockDef } from "@/domain/blocks/library";
import { getRuntime } from "./runtimes";
import type { SimContext, Trace } from "./types";

/**
 * Discrete-time signal-flow solver.
 *
 * Algorithm per step:
 *  1. Compute execution order by Kahn's algorithm on the block graph,
 *     BUT: integrator / dynamic blocks break cycles (their output at time t
 *     depends on state, not on this step's input) — so we don't count their
 *     input edges when computing order.
 *  2. Walk the ordered blocks. For each block, gather inputs from the last
 *     recorded outputs; run runtime.step; write outputs.
 *  3. Sample every wired signal into per-port trace ring buffers.
 */

const DYNAMIC_TYPES = new Set(["dyn.integrator", "dyn.derivative", "dyn.tf1", "ctrl.pid"]);

interface BlockState {
  state: unknown;
  outputs: Record<string, number>;
}

export interface SimulationSnapshot {
  t: number;
  step: number;
  status: "idle" | "running" | "paused";
  traces: Map<string, Trace>;   // key: `${blockId}:${portId}`
  scopes: Map<string, ScopeSnapshot>;
  displays: Map<string, number>;
}

export interface ScopeSnapshot {
  blockId: string;
  window: number;
  channels: { id: string; label: string; samples: { t: number; v: number }[] }[];
}

const MAX_SAMPLES = 4000;

export class Simulator {
  private blocks: BlockInstance[] = [];
  private wires: WireInstance[] = [];
  private order: string[] = [];
  private state = new Map<string, BlockState>();
  private traces = new Map<string, Trace>();
  private t = 0;
  private stepIdx = 0;
  dt = 1e-3;

  load(blocks: BlockInstance[], wires: WireInstance[]) {
    this.blocks = blocks;
    this.wires = wires;
    this.recompute();
  }

  reset() {
    this.t = 0;
    this.stepIdx = 0;
    this.state.clear();
    this.traces.clear();
    for (const b of this.blocks) {
      const rt = getRuntime(b.type);
      const s = rt ? rt.init(b) : null;
      this.state.set(b.id, { state: s, outputs: {} });
    }
  }

  private recompute() {
    // Kahn's, ignoring in-edges into dynamic blocks (they act as delays).
    const inDeg = new Map<string, number>();
    const succ = new Map<string, string[]>();
    for (const b of this.blocks) {
      inDeg.set(b.id, 0);
      succ.set(b.id, []);
    }
    for (const w of this.wires) {
      const targetBlock = this.blocks.find((b) => b.id === w.target.blockId);
      if (!targetBlock) continue;
      succ.get(w.source.blockId)?.push(w.target.blockId);
      if (!DYNAMIC_TYPES.has(targetBlock.type)) {
        inDeg.set(w.target.blockId, (inDeg.get(w.target.blockId) ?? 0) + 1);
      }
    }
    const queue: string[] = [];
    for (const [id, d] of inDeg) if (d === 0) queue.push(id);
    const order: string[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      order.push(id);
      for (const s of succ.get(id) ?? []) {
        const targetBlock = this.blocks.find((b) => b.id === s);
        if (!targetBlock || DYNAMIC_TYPES.has(targetBlock.type)) continue;
        inDeg.set(s, (inDeg.get(s) ?? 0) - 1);
        if (inDeg.get(s) === 0) queue.push(s);
      }
    }
    // append dynamics last (their outputs come from state, order doesn't matter)
    for (const b of this.blocks) {
      if (DYNAMIC_TYPES.has(b.type) && !order.includes(b.id)) order.push(b.id);
    }
    // any leftover (unreachable / cyclic) — add them
    for (const b of this.blocks) if (!order.includes(b.id)) order.push(b.id);
    this.order = order;
    this.reset();
  }

  tick(nSteps = 1): void {
    for (let i = 0; i < nSteps; i++) this.doStep();
  }

  private doStep() {
    const ctx: SimContext = { t: this.t, dt: this.dt, step: this.stepIdx };

    for (const id of this.order) {
      const block = this.blocks.find((b) => b.id === id);
      if (!block) continue;
      const rt = getRuntime(block.type);
      if (!rt) continue;
      const inputs = this.gatherInputs(id);
      const cur = this.state.get(id) ?? { state: rt.init(block), outputs: {} };
      const res = rt.step(cur.state, inputs, ctx, block);
      this.state.set(id, res);
    }

    // Record traces for every wired output & every scope/display input
    for (const w of this.wires) {
      const src = this.state.get(w.source.blockId);
      if (!src) continue;
      const v = src.outputs[w.source.portId] ?? 0;
      const key = `${w.source.blockId}:${w.source.portId}`;
      let tr = this.traces.get(key);
      if (!tr) {
        tr = { id: key, label: key, samples: [] };
        this.traces.set(key, tr);
      }
      tr.samples.push({ t: this.t, value: v });
      if (tr.samples.length > MAX_SAMPLES) tr.samples.splice(0, tr.samples.length - MAX_SAMPLES);
    }

    this.t += this.dt;
    this.stepIdx += 1;
  }

  private gatherInputs(blockId: string): Record<string, number> {
    const inputs: Record<string, number> = {};
    for (const w of this.wires) {
      if (w.target.blockId !== blockId) continue;
      const src = this.state.get(w.source.blockId);
      if (!src) continue;
      inputs[w.target.portId] = src.outputs[w.source.portId] ?? 0;
    }
    return inputs;
  }

  snapshot(): SimulationSnapshot {
    const scopes = new Map<string, ScopeSnapshot>();
    const displays = new Map<string, number>();
    for (const b of this.blocks) {
      if (b.type === "sink.scope") {
        const def = getBlockDef(b.type);
        const window = (b.params.window as number) ?? 5;
        const channels: ScopeSnapshot["channels"] = [];
        for (const port of def?.ports ?? []) {
          if (port.direction !== "in") continue;
          const feed = this.wires.find(
            (w) => w.target.blockId === b.id && w.target.portId === port.id,
          );
          if (!feed) continue;
          const trace = this.traces.get(`${feed.source.blockId}:${feed.source.portId}`);
          if (!trace) continue;
          const cutoff = this.t - window;
          const samples = trace.samples
            .filter((s) => s.t >= cutoff)
            .map((s) => ({ t: s.t, v: s.value }));
          channels.push({ id: port.id, label: port.label, samples });
        }
        scopes.set(b.id, { blockId: b.id, window, channels });
      } else if (b.type === "sink.display") {
        const inputs = this.gatherInputs(b.id);
        displays.set(b.id, inputs.u ?? 0);
      }
    }
    return {
      t: this.t,
      step: this.stepIdx,
      status: "running",
      traces: this.traces,
      scopes,
      displays,
    };
  }

  get time() { return this.t; }
}
