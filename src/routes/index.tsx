import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Cpu, GitBranch, Layers, LineChart, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Truhub Lab — Engineering Simulation Platform" },
      {
        name: "description",
        content:
          "Truhub Lab is a modern desktop-class platform for circuit, control, and signal simulation. Design, wire, and simulate — all in one workspace.",
      },
      { property: "og:title", content: "Truhub Lab — Engineering Simulation Platform" },
      {
        property: "og:description",
        content:
          "Design, wire, and simulate circuits and systems with a professional dark-themed workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="h-screen w-screen overflow-auto bg-background text-foreground">
      <BackgroundGrid />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Truhub Lab</div>
              <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                v0.1 · phase 1
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#pillars" className="hover:text-foreground transition-colors">
              Pillars
            </a>
            <a href="#stack" className="hover:text-foreground transition-colors">
              Stack
            </a>
            <a href="#roadmap" className="hover:text-foreground transition-colors">
              Roadmap
            </a>
          </nav>
        </header>

        <main className="flex flex-1 flex-col justify-center py-16">
          <div className="max-w-3xl animate-fade-in">
            <div className="text-mono inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
              Architecture ready
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              A professional
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                simulation workspace
              </span>
              <br />
              for engineers.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Truhub Lab is a desktop-class platform for circuit, control, signal, and
              mechanical simulation. Drag blocks onto an infinite canvas, wire them up,
              hit play, and read the scope — all inside one dockable workspace.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="glow-ring inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4" />
                Open workspace (Phase 2)
              </Link>
              <a
                href="#pillars"
                className="inline-flex h-11 items-center rounded-md border border-border bg-surface-raised px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                View architecture
              </a>
            </div>
          </div>

          <section
            id="pillars"
            className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                className="panel group relative overflow-hidden p-5 transition-colors hover:border-border-strong"
                style={{ animation: `fade-in 0.5s ease-out both`, animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-surface-sunken text-primary">
                    <p.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-sm font-semibold">{p.title}</div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
                <div className="text-mono mt-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                  {p.tag}
                </div>
              </div>
            ))}
          </section>

          <section id="stack" className="mt-20 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="panel p-6">
              <div className="text-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Layered Architecture
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Feature-Sliced Design
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Strict layering keeps the simulator, canvas, and UI decoupled. Each
                layer imports only from layers below.
              </p>
              <ol className="mt-5 space-y-2">
                {LAYERS.map((l) => (
                  <li
                    key={l.name}
                    className="flex items-center justify-between rounded-md border border-border bg-surface-sunken px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-mono text-[10px] text-muted-foreground">
                        {l.k}
                      </span>
                      <span className="text-sm font-medium">{l.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{l.desc}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="panel p-6">
              <div className="text-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Domain Modules
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Simulation core
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Independent domain slices under <span className="text-mono">src/domain/*</span>.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {DOMAINS.map((d) => (
                  <div
                    key={d}
                    className="text-mono rounded-md border border-border bg-surface-sunken px-3 py-2 text-xs text-foreground/90"
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="roadmap" className="mt-20">
            <div className="text-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Delivery Roadmap
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Phased build</h2>
            <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PHASES.map((p) => (
                <li
                  key={p.n}
                  className={
                    "panel flex flex-col gap-1 p-4 " +
                    (p.done ? "border-primary/40" : "")
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Phase {p.n}
                    </span>
                    {p.done && (
                      <span className="text-mono rounded-sm bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                        Done
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium">{p.title}</div>
                </li>
              ))}
            </ol>
          </section>
        </main>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>© Truhub Lab · Engineering Simulation Platform</div>
            <div className="text-mono">phase 1 · architecture</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="glow-ring grid h-9 w-9 place-items-center rounded-md bg-surface-raised">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </svg>
    </div>
  );
}

function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 opacity-[0.35]"
      style={{
        backgroundImage:
          "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage:
          "radial-gradient(ellipse at 50% 30%, black 40%, transparent 80%)",
      }}
    />
  );
}

const PILLARS = [
  {
    icon: Layers,
    title: "Dockable workspace",
    desc: "Resizable panels for the canvas, block library, property inspector, console, and scopes.",
    tag: "widgets",
  },
  {
    icon: GitBranch,
    title: "Infinite canvas",
    desc: "Pan, zoom, snap-to-grid, multi-select, rotation, copy/paste, undo/redo.",
    tag: "domain/canvas",
  },
  {
    icon: Cpu,
    title: "Modular block library",
    desc: "Electrical, semiconductors, ICs, power, control, DSP, mechanical, comms.",
    tag: "domain/blocks",
  },
  {
    icon: Activity,
    title: "Discrete-time solver",
    desc: "Topological scheduler with Euler and RK4 integrators, variable speed.",
    tag: "domain/simulation",
  },
  {
    icon: LineChart,
    title: "Scopes & analysis",
    desc: "Voltage, current, power traces and FFT with CSV / PNG export.",
    tag: "widgets/scope",
  },
  {
    icon: Zap,
    title: "Project lifecycle",
    desc: "New, open, save, autosave, recents, import/export — all local-first.",
    tag: "domain/project",
  },
];

const LAYERS = [
  { k: "L6", name: "app", desc: "providers · routing" },
  { k: "L5", name: "pages", desc: "route compositions" },
  { k: "L4", name: "widgets", desc: "toolbar · inspector" },
  { k: "L3", name: "features", desc: "drag · sim · file-io" },
  { k: "L2", name: "entities", desc: "block · wire · project" },
  { k: "L1", name: "shared", desc: "ui · hooks · utils" },
];

const DOMAINS = [
  "simulation/",
  "blocks/",
  "canvas/",
  "serialization/",
  "rendering/",
  "project/",
  "history/",
  "settings/",
];

const PHASES = [
  { n: 1, title: "Architecture", done: true },
  { n: 2, title: "UI shell", done: false },
  { n: 3, title: "Canvas", done: false },
  { n: 4, title: "Block library", done: false },
  { n: 5, title: "Simulation engine", done: false },
  { n: 6, title: "Graphs", done: false },
  { n: 7, title: "File system", done: false },
  { n: 8, title: "Optimization", done: false },
];
