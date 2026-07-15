import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getBlockDef } from "@/domain/blocks/library";
import { useWorkbench } from "@/features/workbench/store";
import { BlockGlyph } from "./BlockGlyph";

export interface BlockNodeData {
  blockId: string;
  type: string;
  label: string;
  rotation: 0 | 90 | 180 | 270;
  [key: string]: unknown;
}

export function BlockNode({ data, selected }: NodeProps) {
  const d = data as unknown as BlockNodeData;
  const def = getBlockDef(d.type);
  const snapshot = useWorkbench((s) => s.snapshot);
  if (!def) return null;

  const inputs = def.ports.filter((p) => p.direction === "in");
  const outputs = def.ports.filter((p) => p.direction === "out");

  // Live value overlay for display blocks
  let liveValue: string | null = null;
  if (d.type === "sink.display" && snapshot) {
    const v = snapshot.displays.get(d.blockId);
    if (v !== undefined) {
      liveValue = Number.isFinite(v) ? v.toFixed(3) : "NaN";
    }
  }

  return (
    <div
      className={
        "group relative select-none rounded-md border bg-card text-card-foreground shadow-panel transition-colors " +
        (selected ? "border-primary" : "border-border hover:border-border-strong")
      }
      style={{ minWidth: 132, minHeight: 64 }}
    >
      <div
        className="flex items-center justify-center px-3 py-2"
        style={{ transform: `rotate(${d.rotation}deg)`, transformOrigin: "center" }}
      >
        <BlockGlyph type={d.type} />
      </div>
      <div className="text-mono border-t border-border/70 px-2 py-1 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {d.label ?? def.name}
      </div>

      {liveValue !== null && (
        <div className="text-mono absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-surface-sunken px-2 py-0.5 text-xs text-primary">
          {liveValue}
        </div>
      )}

      {/* Input handles: left edge, evenly spaced */}
      {inputs.map((p, i) => (
        <Handle
          key={p.id}
          id={p.id}
          type="target"
          position={Position.Left}
          style={{
            top: `${((i + 1) / (inputs.length + 1)) * 100}%`,
            width: 10,
            height: 10,
            background: "var(--wire)",
            border: "2px solid var(--surface)",
          }}
        />
      ))}
      {/* Output handles: right edge */}
      {outputs.map((p, i) => (
        <Handle
          key={p.id}
          id={p.id}
          type="source"
          position={Position.Right}
          style={{
            top: `${((i + 1) / (outputs.length + 1)) * 100}%`,
            width: 10,
            height: 10,
            background: "var(--primary)",
            border: "2px solid var(--surface)",
          }}
        />
      ))}
    </div>
  );
}
