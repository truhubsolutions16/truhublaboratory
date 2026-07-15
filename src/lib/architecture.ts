/**
 * Truhub Lab — Feature-Sliced Architecture Manifest
 *
 * Layers (top imports bottom, never the reverse):
 *
 *   app/        → app-wide providers, routing, global styles
 *   pages/      → route-level compositions (in src/routes/*)
 *   widgets/    → composite UI blocks (Toolbar, PropertyInspector, Console…)
 *   features/   → user-facing capabilities (drag-drop, simulation-control,
 *                 file-io, undo-redo, selection)
 *   entities/   → domain objects (Block, Wire, Project, ScopeTrace)
 *   shared/     → design-system primitives, hooks, utils, types
 *
 * Domain modules (under src/domain/*):
 *
 *   simulation/     Discrete-time solver, scheduler, block runtime
 *   blocks/         Block library — one folder per category
 *   canvas/         React Flow adapter, grid, snap, viewport
 *   serialization/  Project (de)serialization, versioning, migrations
 *   rendering/      Custom node/edge renderers
 *   project/        Project lifecycle, autosave, recents
 *   history/        Undo/redo command stack
 *   settings/       User preferences
 */
export const ARCHITECTURE_VERSION = "0.1.0";
