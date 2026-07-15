import { createFileRoute } from "@tanstack/react-router";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Toolbar } from "@/widgets/Toolbar";
import { BlockLibraryPanel } from "@/widgets/BlockLibraryPanel";
import { PropertyInspector } from "@/widgets/PropertyInspector";
import { ScopePanel } from "@/widgets/ScopePanel";
import { ConsolePanel } from "@/widgets/ConsolePanel";
import { Canvas } from "@/widgets/Canvas";
import { useWorkbench } from "@/features/workbench/store";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Truhub Lab" },
      { name: "description", content: "Design, wire, and simulate systems in the Truhub Lab workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  const blocks = useWorkbench((s) => s.blocks);
  const wires = useWorkbench((s) => s.wires);
  const simTime = useWorkbench((s) => s.simTime);
  const status = useWorkbench((s) => s.status);
  const timeStep = useWorkbench((s) => s.timeStep);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Toolbar />
<div className="flex-1 min-h-0 overflow-hidden">
        <PanelGroup orientation="horizontal">
         <Panel defaultSize={15} minSize={12} maxSize={20}>
            <BlockLibraryPanel />
          </Panel>
          <VHandle />

          <Panel defaultSize={67} minSize={50}>
            <PanelGroup orientation="vertical">
           <Panel defaultSize={75} minSize={45}>
                <div className="relative h-full w-full overflow-hidden bg-surface-sunken">
                  <Canvas />
                </div>
              </Panel>
              <HHandle />
             <Panel defaultSize={25} minSize={15}>
                <PanelGroup orientation="horizontal">
                  <Panel defaultSize={70} minSize={35}>
                    <ScopePanel />
                  </Panel>
                  <VHandle />
                 <Panel defaultSize={30} minSize={20}>
                    <ConsolePanel />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <VHandle />
          <Panel defaultSize={18} minSize={14} maxSize={24}>
            <PropertyInspector />
          </Panel>
        </PanelGroup>
      </div>

      {/* Status bar */}
      <div className="flex h-6 items-center justify-between border-t border-border bg-surface px-3 text-[11px] text-muted-foreground">
        <div className="text-mono flex items-center gap-4">
          <span>
            <span className="text-foreground/80">{blocks.length}</span> blocks
          </span>
          <span>
            <span className="text-foreground/80">{wires.length}</span> wires
          </span>
          <span>
            dt = <span className="text-foreground/80">{(timeStep * 1000).toFixed(2)} ms</span>
          </span>
        </div>
        <div className="text-mono flex items-center gap-4">
          <span>t = <span className="text-foreground/80">{simTime.toFixed(4)} s</span></span>
          <span className="uppercase tracking-[0.12em]">{status}</span>
        </div>
      </div>
    </div>
  );
}

function VHandle() {
  return (
    <PanelResizeHandle className="group relative w-px bg-border transition-colors data-[resize-handle-state=drag]:bg-primary">
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/20" />
    </PanelResizeHandle>
  );
}
function HHandle() {
  return (
    <PanelResizeHandle className="group relative h-px bg-border transition-colors data-[resize-handle-state=drag]:bg-primary">
      <div className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-primary/20" />
    </PanelResizeHandle>
  );
}
