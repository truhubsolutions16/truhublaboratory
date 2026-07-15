import { useRef } from "react";
import {
  Play, Pause, Square, RotateCcw, Undo2, Redo2, Save, FolderOpen, FilePlus2, Gauge,
} from "lucide-react";
import { useWorkbench } from "@/features/workbench/store";
import type { ProjectFile } from "@/domain/project/types";

export function Toolbar() {
  const status = useWorkbench((s) => s.status);
  const speed = useWorkbench((s) => s.speed);
  const timeStep = useWorkbench((s) => s.timeStep);
  const simTime = useWorkbench((s) => s.simTime);
  const meta = useWorkbench((s) => s.meta);

  const play = useWorkbench((s) => s.play);
  const pause = useWorkbench((s) => s.pause);
  const stop = useWorkbench((s) => s.stop);
  const reset = useWorkbench((s) => s.resetSim);
  const undo = useWorkbench((s) => s.undo);
  const redo = useWorkbench((s) => s.redo);
  const setSpeed = useWorkbench((s) => s.setSpeed);
  const setTimeStep = useWorkbench((s) => s.setTimeStep);
  const newProject = useWorkbench((s) => s.newProject);
  const loadProject = useWorkbench((s) => s.loadProject);
  const toProjectFile = useWorkbench((s) => s.toProjectFile);

  const fileInput = useRef<HTMLInputElement>(null);

  const doSave = () => {
    const p = toProjectFile();
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.meta.name}.truhub.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const doOpen = (file: File) => {
    file.text().then((txt) => {
      try {
        const p = JSON.parse(txt) as ProjectFile;
        loadProject(p);
      } catch (e) {
        useWorkbench.getState().log("error", "Failed to open project: " + (e as Error).message);
      }
    });
  };

  return (
    <div className="flex h-11 items-center justify-between gap-2 border-b border-border bg-surface px-3">
      {/* Left: brand + file ops */}
      <div className="flex items-center gap-1">
        <div className="mr-3 flex items-center gap-2">
          <div className="glow-ring grid h-7 w-7 place-items-center rounded-md bg-surface-raised">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2-6 4 12 2-6h6" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Truhub Lab</div>
            <div className="text-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {meta.name}
            </div>
          </div>
        </div>
        <ToolBtn onClick={newProject} icon={<FilePlus2 className="h-4 w-4" />} label="New" />
        <ToolBtn
          onClick={() => fileInput.current?.click()}
          icon={<FolderOpen className="h-4 w-4" />}
          label="Open"
        />
        <ToolBtn onClick={doSave} icon={<Save className="h-4 w-4" />} label="Save" />
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doOpen(f);
            e.target.value = "";
          }}
        />
        <Sep />
        <ToolBtn onClick={undo} icon={<Undo2 className="h-4 w-4" />} label="Undo" />
        <ToolBtn onClick={redo} icon={<Redo2 className="h-4 w-4" />} label="Redo" />
      </div>

      {/* Center: transport */}
      <div className="flex items-center gap-1 rounded-md border border-border bg-surface-raised p-0.5">
        {status !== "running" ? (
          <TransportBtn onClick={play} icon={<Play className="h-4 w-4 fill-current" />} label="Play" primary />
        ) : (
          <TransportBtn onClick={pause} icon={<Pause className="h-4 w-4 fill-current" />} label="Pause" />
        )}
        <TransportBtn onClick={stop} icon={<Square className="h-3.5 w-3.5 fill-current" />} label="Stop" />
        <TransportBtn onClick={reset} icon={<RotateCcw className="h-4 w-4" />} label="Reset" />
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="text-mono flex items-center gap-1.5 px-2 text-[11px] text-muted-foreground">
          <StatusDot status={status} />
          <span className="text-foreground">{simTime.toFixed(3)}s</span>
        </div>
      </div>

      {/* Right: speed & timestep */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Gauge className="h-3.5 w-3.5" />
          <span className="text-mono">{speed.toFixed(2)}x</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-24 accent-primary"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-mono">dt</span>
          <select
            value={timeStep}
            onChange={(e) => setTimeStep(Number(e.target.value))}
            className="text-mono rounded border border-border bg-surface-sunken px-1.5 py-0.5 text-[11px] text-foreground outline-none"
          >
            <option value={1e-4}>0.1 ms</option>
            <option value={1e-3}>1 ms</option>
            <option value={5e-3}>5 ms</option>
            <option value={1e-2}>10 ms</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function ToolBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
    >
      {icon}
    </button>
  );
}

function TransportBtn({
  onClick, icon, label, primary,
}: { onClick: () => void; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={
        "inline-flex h-7 items-center gap-1 rounded px-2 text-xs transition-colors " +
        (primary
          ? "bg-primary text-primary-foreground hover:brightness-110"
          : "text-foreground/80 hover:bg-surface-sunken hover:text-foreground")
      }
    >
      {icon}
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-6 w-px bg-border" />;
}

function StatusDot({ status }: { status: "idle" | "running" | "paused" }) {
  const color =
    status === "running" ? "bg-success shadow-[0_0_8px_var(--success)]"
    : status === "paused" ? "bg-warning" : "bg-muted-foreground/60";
  return <span className={"inline-block h-1.5 w-1.5 rounded-full " + color} />;
}
