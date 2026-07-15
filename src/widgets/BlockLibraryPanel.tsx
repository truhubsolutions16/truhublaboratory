import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BLOCK_LIBRARY } from "@/domain/blocks/library";
import type { BlockCategory } from "@/domain/blocks/types";
import { BlockGlyph } from "@/domain/rendering/BlockGlyph";

const CATEGORY_ORDER: BlockCategory[] = [
  "signal",
  "control",
  "ics",
  "power",
  "electrical",
  "semiconductors",
  "mechanical",
  "communication",
];

const CATEGORY_LABEL: Record<BlockCategory, string> = {
  signal: "Signal & Sources",
  control: "Math & Control",
  ics: "Logic & ICs",
  power: "Power",
  electrical: "Electrical",
  semiconductors: "Semiconductors",
  mechanical: "Mechanical",
  communication: "Communication",
};

export function BlockLibraryPanel() {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<BlockCategory, Array<(typeof BLOCK_LIBRARY)[number]>>();
    for (const b of BLOCK_LIBRARY) {
      if (q && !b.name.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q)) continue;
      const arr = map.get(b.category) ?? [];
      arr.push(b);
      map.set(b.category, arr);
    }
    return map;
  }, [query]);

  return (
    <div className="flex h-full flex-col bg-panel text-panel-foreground">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Block Library
        </div>
        <div className="text-mono text-[10px] text-muted-foreground/70">
          {BLOCK_LIBRARY.length}
        </div>
      </div>
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocks…"
            className="w-full rounded-md border border-border bg-surface-sunken py-1.5 pl-7 pr-2 text-xs text-foreground outline-none focus:border-primary/60"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat);
          if (!items?.length) return null;
          return (
            <div key={cat} className="mb-3">
              <div className="text-mono px-1 pb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
                {CATEGORY_LABEL[cat]}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((b) => (
                  <div
                    key={b.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/truhub-block", b.type);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    title={b.description}
                    className="group flex cursor-grab flex-col items-center gap-1 rounded-md border border-border bg-surface-sunken px-2 py-2 transition-colors hover:border-primary/60 hover:bg-surface-raised active:cursor-grabbing"
                  >
                    <BlockGlyph type={b.type} />
                    <div className="w-full truncate text-center text-[10px] text-foreground/90">
                      {b.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {[...grouped.values()].every((v) => !v?.length) && (
          <div className="mt-8 text-center text-xs text-muted-foreground">
            No blocks match "{query}".
          </div>
        )}
      </div>
    </div>
  );
}
