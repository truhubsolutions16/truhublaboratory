import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkbench } from "@/features/workbench/store";
import { BlockNode } from "@/domain/rendering/BlockNode";

const nodeTypes = { block: BlockNode };

function CanvasInner() {
  const rf = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const blocks = useWorkbench((s) => s.blocks);
  const wires = useWorkbench((s) => s.wires);
  const addBlock = useWorkbench((s) => s.addBlock);
  const addWire = useWorkbench((s) => s.addWire);
  const removeBlocks = useWorkbench((s) => s.removeBlocks);
  const removeWires = useWorkbench((s) => s.removeWires);
  const updateBlock = useWorkbench((s) => s.updateBlock);
  const select = useWorkbench((s) => s.select);
  const copySelected = useWorkbench((s) => s.copySelected);
  const paste = useWorkbench((s) => s.paste);
  const undo = useWorkbench((s) => s.undo);
  const redo = useWorkbench((s) => s.redo);
  const rotate = useWorkbench((s) => s.rotateSelected);

  const nodes: Node[] = useMemo(
    () =>
      blocks.map((b) => ({
        id: b.id,
        type: "block",
        position: b.position,
        data: { blockId: b.id, type: b.type, label: b.label ?? "", rotation: b.rotation },
      })),
    [blocks],
  );

  const edges: Edge[] = useMemo(
    () =>
      wires.map((w) => ({
        id: w.id,
        source: w.source.blockId,
        sourceHandle: w.source.portId,
        target: w.target.blockId,
        targetHandle: w.target.portId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--wire-active)", strokeWidth: 1.6 },
      })),
    [wires],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Persist position updates; ignore RF-internal ones we don't care about
      const updated = applyNodeChanges(changes, nodes);
      for (const ch of changes) {
        if (ch.type === "position" && ch.dragging === false) {
          const n = updated.find((x) => x.id === ch.id);
          if (n) updateBlock(n.id, { position: n.position });
        }
        if (ch.type === "remove") removeBlocks([ch.id]);
        if (ch.type === "select") {
          const selIds = updated.filter((x) => x.selected).map((x) => x.id);
          select(selIds);
        }
      }
    },
    [nodes, updateBlock, removeBlocks, select],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      applyEdgeChanges(changes, edges);
      for (const ch of changes) {
        if (ch.type === "remove") removeWires([ch.id]);
      }
    },
    [edges, removeWires],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || !c.sourceHandle || !c.targetHandle) return;
      addWire({
        source: { blockId: c.source, portId: c.sourceHandle },
        target: { blockId: c.target, portId: c.targetHandle },
      });
      addEdge(c, edges);
    },
    [addWire, edges],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/truhub-block");
      if (!type) return;
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addBlock(type, { x: Math.round(pos.x / 16) * 16, y: Math.round(pos.y / 16) * 16 });
    },
    [rf, addBlock],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (meta && e.key === "c") { e.preventDefault(); copySelected(); }
      else if (meta && e.key === "v") { e.preventDefault(); paste(); }
      else if (e.key === "r" || e.key === "R") { rotate(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, copySelected, paste, rotate]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        snapToGrid
        snapGrid={[16, 16]}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Shift"]}
        panOnScroll
        selectionOnDrag
        minZoom={0.2}
        maxZoom={3}
        defaultEdgeOptions={{ type: "smoothstep" }}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--grid-strong)"
        />
        <Background
          variant={BackgroundVariant.Lines}
          gap={128}
          lineWidth={0.5}
          color="var(--grid)"
        />
        <Controls
          className="!rounded-md !border !border-border !bg-panel !shadow-panel [&>button]:!border-border [&>button]:!bg-surface [&>button]:!text-foreground [&>button:hover]:!bg-surface-raised"
          showInteractive={false}
        />
        <MiniMap
          className="!rounded-md !border !border-border !bg-panel !shadow-panel"
          nodeColor="var(--primary)"
          nodeStrokeColor="var(--border-strong)"
          maskColor="oklch(0.14 0.012 250 / 0.75)"
          pannable
          zoomable
        />
      </ReactFlow>

      {blocks.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="panel px-6 py-4 text-center">
            <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Empty canvas
            </div>
            <div className="mt-1 text-sm text-foreground/90">
              Drag a block from the library to begin.
            </div>
            <div className="text-mono mt-2 text-[10px] text-muted-foreground">
              R rotate · ⌘Z undo · ⌘C/V copy·paste · Del remove
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
