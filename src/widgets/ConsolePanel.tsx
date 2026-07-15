import { useEffect, useRef } from "react";
import { useWorkbench } from "@/features/workbench/store";
import { Trash2 } from "lucide-react";

export function ConsolePanel() {
  const logs = useWorkbench((s) => s.logs);
  const clear = useWorkbench((s) => s.clearLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [logs]);

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Console
        </div>
        <button
          onClick={clear}
          className="rounded p-1 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          title="Clear"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div ref={scrollRef} className="text-mono flex-1 overflow-y-auto p-2 text-[11px]">
        {logs.map((l, i) => (
          <div key={i} className="flex gap-2 py-0.5">
            <span className="shrink-0 text-muted-foreground/70">
              {new Date(l.ts).toLocaleTimeString()}
            </span>
            <span className={LEVEL_CLASS[l.level]}>[{l.level.toUpperCase()}]</span>
            <span className="text-foreground/90">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const LEVEL_CLASS: Record<string, string> = {
  info: "text-primary",
  warn: "text-warning",
  error: "text-destructive",
};
