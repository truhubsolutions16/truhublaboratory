import { useWorkbench } from "@/features/workbench/store";
import { getBlockDef } from "@/domain/blocks/library";
import { RotateCw, Trash2 } from "lucide-react";

export function PropertyInspector() {
  const selection = useWorkbench((s) => s.selection);
  const blocks = useWorkbench((s) => s.blocks);
  const updateParam = useWorkbench((s) => s.updateParam);
  const updateBlock = useWorkbench((s) => s.updateBlock);
  const removeBlocks = useWorkbench((s) => s.removeBlocks);
  const rotateSelected = useWorkbench((s) => s.rotateSelected);

  const block = selection.length === 1 ? blocks.find((b) => b.id === selection[0]) : null;
  const def = block ? getBlockDef(block.type) : null;

  return (
    <div className="flex h-full flex-col bg-panel text-panel-foreground">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Inspector
        </div>
        {selection.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={rotateSelected}
              title="Rotate 90° (R)"
              className="rounded p-1 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => removeBlocks(selection)}
              title="Delete"
              className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!block || !def ? (
          <div className="mt-6 text-center text-xs text-muted-foreground">
            {selection.length > 1
              ? `${selection.length} blocks selected`
              : "Select a block to edit its properties."}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {def.category}
              </div>
              <div className="mt-1 text-sm font-semibold">{def.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{def.description}</div>
            </div>

            <Field label="Label">
              <input
                value={block.label ?? ""}
                onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                className="w-full rounded-md border border-border bg-surface-sunken px-2 py-1 text-xs text-foreground outline-none focus:border-primary/60"
              />
            </Field>

            {def.params.map((p) => {
              const value = block.params[p.key] ?? p.default;
              if (p.type === "number") {
                return (
                  <Field key={p.key} label={p.label + (p.unit ? ` (${p.unit})` : "")}>
                    <input
                      type="number"
                      value={value as number}
                      min={p.min}
                      max={p.max}
                      step={p.step ?? 1}
                      onChange={(e) =>
                        updateParam(block.id, p.key, Number(e.target.value))
                      }
                      className="text-mono w-full rounded-md border border-border bg-surface-sunken px-2 py-1 text-xs text-foreground outline-none focus:border-primary/60"
                    />
                  </Field>
                );
              }
              if (p.type === "boolean") {
                return (
                  <Field key={p.key} label={p.label}>
                    <input
                      type="checkbox"
                      checked={!!value}
                      onChange={(e) => updateParam(block.id, p.key, e.target.checked)}
                    />
                  </Field>
                );
              }
              if (p.type === "enum") {
                return (
                  <Field key={p.key} label={p.label}>
                    <select
                      value={String(value)}
                      onChange={(e) => updateParam(block.id, p.key, e.target.value)}
                      className="w-full rounded-md border border-border bg-surface-sunken px-2 py-1 text-xs text-foreground outline-none focus:border-primary/60"
                    >
                      {p.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                );
              }
              return (
                <Field key={p.key} label={p.label}>
                  <input
                    value={String(value)}
                    onChange={(e) => updateParam(block.id, p.key, e.target.value)}
                    className="w-full rounded-md border border-border bg-surface-sunken px-2 py-1 text-xs text-foreground outline-none focus:border-primary/60"
                  />
                </Field>
              );
            })}

            <div className="border-t border-border pt-3">
              <div className="text-mono mb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Ports
              </div>
              <div className="space-y-1">
                {def.ports.map((port) => (
                  <div key={port.id} className="flex items-center justify-between text-xs">
                    <span className="text-mono text-muted-foreground">{port.id}</span>
                    <span className="text-foreground/80">
                      {port.label} · {port.direction} · {port.kind}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-mono mb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}
