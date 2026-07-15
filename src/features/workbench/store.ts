import { create } from "zustand";
import type { BlockInstance, WireInstance } from "@/domain/blocks/types";
import { getBlockDef } from "@/domain/blocks/library";
import { Simulator, type SimulationSnapshot } from "@/domain/simulation/simulator";
import type { ProjectFile, ProjectMeta } from "@/domain/project/types";
import { DEFAULT_SIM_SETTINGS } from "@/domain/project/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export type SimStatus = "idle" | "running" | "paused";

interface HistoryEntry {
  blocks: BlockInstance[];
  wires: WireInstance[];
}

interface LogEntry {
  ts: number;
  level: "info" | "warn" | "error";
  msg: string;
}

interface State {
  meta: ProjectMeta;
  blocks: BlockInstance[];
  wires: WireInstance[];
  selection: string[];
  timeStep: number;
  speed: number;
  status: SimStatus;
  simTime: number;
  snapshot: SimulationSnapshot | null;
  logs: LogEntry[];
  history: HistoryEntry[];
  future: HistoryEntry[];

  addBlock: (type: string, position: { x: number; y: number }) => void;
  updateBlock: (id: string, patch: Partial<BlockInstance>) => void;
  updateParam: (id: string, key: string, value: unknown) => void;
  removeBlocks: (ids: string[]) => void;
  addWire: (w: Omit<WireInstance, "id">) => void;
  removeWires: (ids: string[]) => void;
  select: (ids: string[]) => void;
  rotateSelected: () => void;
  copySelected: () => void;
  paste: () => void;

  play: () => void;
  pause: () => void;
  stop: () => void;
  resetSim: () => void;
  setSpeed: (s: number) => void;
  setTimeStep: (dt: number) => void;

  newProject: () => void;
  loadProject: (p: ProjectFile) => void;
  toProjectFile: () => ProjectFile;

  undo: () => void;
  redo: () => void;
  log: (level: LogEntry["level"], msg: string) => void;
  clearLogs: () => void;

  _tickSnapshot: (s: SimulationSnapshot) => void;
}

const initialMeta = (): ProjectMeta => ({
  id: uid(),
  name: "Untitled project",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const sim = new Simulator();
let rafHandle: number | null = null;
let clipboard: BlockInstance[] = [];

export const useWorkbench = create<State>((set, get) => {
  const pushHistory = () => {
    const { blocks, wires, history } = get();
    const next = [...history, { blocks: structuredClone(blocks), wires: structuredClone(wires) }];
    if (next.length > 100) next.shift();
    set({ history: next, future: [] });
  };

  const rebuild = () => {
    const { blocks, wires } = get();
    sim.load(blocks, wires);
    set({ simTime: 0, snapshot: sim.snapshot() });
  };

  const loop = () => {
    const { status, speed, timeStep } = get();
    if (status !== "running") {
      rafHandle = null;
      return;
    }
    // aim for ~30 UI updates/sec; run enough sim steps to match wall-clock * speed
    const targetSimDt = (1 / 30) * speed;
    const steps = Math.max(1, Math.min(2000, Math.round(targetSimDt / timeStep)));
    sim.tick(steps);
    set({ simTime: sim.time, snapshot: sim.snapshot() });
    rafHandle = requestAnimationFrame(loop);
  };

  return {
    meta: initialMeta(),
    blocks: [],
    wires: [],
    selection: [],
    timeStep: DEFAULT_SIM_SETTINGS.timeStep,
    speed: 1,
    status: "idle",
    simTime: 0,
    snapshot: null,
    logs: [{ ts: Date.now(), level: "info", msg: "Truhub Lab ready." }],
    history: [],
    future: [],

    addBlock: (type, position) => {
      const def = getBlockDef(type);
      if (!def) return;
      pushHistory();
      const params: Record<string, unknown> = {};
      for (const p of def.params) params[p.key] = p.default;
      const b: BlockInstance = {
        id: uid(),
        type,
        position,
        rotation: 0,
        params,
        label: def.name,
      };
      set({ blocks: [...get().blocks, b] });
      get().log("info", `Added ${def.name}`);
      rebuild();
    },

    updateBlock: (id, patch) => {
      set({
        blocks: get().blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      });
    },

    updateParam: (id, key, value) => {
      set({
        blocks: get().blocks.map((b) =>
          b.id === id ? { ...b, params: { ...b.params, [key]: value } } : b,
        ),
      });
      // hot-reload params into the simulator without resetting time
      const { blocks, wires } = get();
      sim.load(blocks, wires);
    },

    removeBlocks: (ids) => {
      pushHistory();
      const idSet = new Set(ids);
      set({
        blocks: get().blocks.filter((b) => !idSet.has(b.id)),
        wires: get().wires.filter(
          (w) => !idSet.has(w.source.blockId) && !idSet.has(w.target.blockId),
        ),
        selection: get().selection.filter((s) => !idSet.has(s)),
      });
      rebuild();
    },

    addWire: (w) => {
      // Reject duplicates (same target port already wired)
      const exists = get().wires.some(
        (x) => x.target.blockId === w.target.blockId && x.target.portId === w.target.portId,
      );
      if (exists) {
        get().log("warn", "Port already wired.");
        return;
      }
      pushHistory();
      set({ wires: [...get().wires, { ...w, id: uid() }] });
      rebuild();
    },

    removeWires: (ids) => {
      pushHistory();
      const s = new Set(ids);
      set({ wires: get().wires.filter((w) => !s.has(w.id)) });
      rebuild();
    },

    select: (ids) => set({ selection: ids }),

    rotateSelected: () => {
      const sel = new Set(get().selection);
      if (sel.size === 0) return;
      set({
        blocks: get().blocks.map((b) =>
          sel.has(b.id)
            ? { ...b, rotation: (((b.rotation + 90) % 360) as 0 | 90 | 180 | 270) }
            : b,
        ),
      });
    },

    copySelected: () => {
      const sel = new Set(get().selection);
      clipboard = get().blocks.filter((b) => sel.has(b.id)).map((b) => structuredClone(b));
      get().log("info", `Copied ${clipboard.length} block(s).`);
    },

    paste: () => {
      if (!clipboard.length) return;
      pushHistory();
      const copies = clipboard.map((b) => ({
        ...structuredClone(b),
        id: uid(),
        position: { x: b.position.x + 40, y: b.position.y + 40 },
      }));
      set({ blocks: [...get().blocks, ...copies], selection: copies.map((c) => c.id) });
      rebuild();
    },

    play: () => {
      if (get().status === "running") return;
      if (get().snapshot === null) rebuild();
      set({ status: "running" });
      get().log("info", "Simulation running.");
      if (rafHandle == null) rafHandle = requestAnimationFrame(loop);
    },

    pause: () => {
      set({ status: "paused" });
      get().log("info", "Simulation paused.");
    },

    stop: () => {
      set({ status: "idle" });
      get().log("info", "Simulation stopped.");
    },

    resetSim: () => {
      sim.reset();
      set({ simTime: 0, snapshot: sim.snapshot() });
      get().log("info", "Simulation reset.");
    },

    setSpeed: (s) => set({ speed: s }),
    setTimeStep: (dt) => {
      sim.dt = dt;
      set({ timeStep: dt });
    },

    newProject: () => {
      pushHistory();
      set({ meta: initialMeta(), blocks: [], wires: [], selection: [], status: "idle" });
      rebuild();
      get().log("info", "New project.");
    },

    loadProject: (p) => {
      pushHistory();
      sim.dt = p.simulation.timeStep;
      set({
        meta: p.meta,
        blocks: p.blocks,
        wires: p.wires,
        timeStep: p.simulation.timeStep,
        speed: p.simulation.speed,
        status: "idle",
        selection: [],
      });
      rebuild();
      get().log("info", `Loaded "${p.meta.name}".`);
    },

    toProjectFile: (): ProjectFile => {
      const { meta, blocks, wires, timeStep, speed } = get();
      return {
        schemaVersion: 1,
        meta: { ...meta, updatedAt: new Date().toISOString() },
        blocks,
        wires,
        simulation: { ...DEFAULT_SIM_SETTINGS, timeStep, speed },
      };
    },

    undo: () => {
      const { history, blocks, wires, future } = get();
      if (!history.length) return;
      const prev = history[history.length - 1];
      set({
        history: history.slice(0, -1),
        future: [...future, { blocks: structuredClone(blocks), wires: structuredClone(wires) }],
        blocks: prev.blocks,
        wires: prev.wires,
      });
      rebuild();
    },

    redo: () => {
      const { history, blocks, wires, future } = get();
      if (!future.length) return;
      const next = future[future.length - 1];
      set({
        future: future.slice(0, -1),
        history: [...history, { blocks: structuredClone(blocks), wires: structuredClone(wires) }],
        blocks: next.blocks,
        wires: next.wires,
      });
      rebuild();
    },

    log: (level, msg) =>
      set({
        logs: [...get().logs.slice(-500), { ts: Date.now(), level, msg }],
      }),
    clearLogs: () => set({ logs: [] }),

    _tickSnapshot: (s) => set({ snapshot: s, simTime: s.t }),
  };
});

// autosave
if (typeof window !== "undefined") {
  const AUTOSAVE_KEY = "truhub-lab:autosave";
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as ProjectFile;
      if (p.schemaVersion === 1) useWorkbench.getState().loadProject(p);
    }
  } catch { /* noop */ }
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  useWorkbench.subscribe((state, prev) => {
    if (state.blocks === prev.blocks && state.wires === prev.wires) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state.toProjectFile()));
      } catch { /* quota */ }
    }, 500);
  });
}
