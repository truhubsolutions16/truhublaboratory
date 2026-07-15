import { useMemo, useRef } from "react";
import { useWorkbench } from "@/features/workbench/store";
import { Download, Camera } from "lucide-react";
import type { ScopeSnapshot } from "@/domain/simulation/simulator";

const CH_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function ScopePanel() {
  const snapshot = useWorkbench((s) => s.snapshot);
  const scopes = snapshot ? [...snapshot.scopes.values()] : [];

  if (scopes.length === 0) {
    return (
      <div className="flex h-full flex-col bg-panel">
        <PanelHeader />
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-muted-foreground">
          Drop a Scope block on the canvas and wire signals into ch1–ch4 to see traces.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-panel">
      <PanelHeader />
      <div className="flex-1 overflow-y-auto p-2">
        <div className={"grid gap-2 " + (scopes.length > 1 ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1")}>
          {scopes.map((sc) => (
            <ScopeView key={sc.blockId} scope={sc} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelHeader() {
  const t = useWorkbench((s) => s.simTime);
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Scopes
      </div>
      <div className="text-mono text-[10px] text-muted-foreground">
        t = {t.toFixed(3)} s
      </div>
    </div>
  );
}

function ScopeView({ scope }: { scope: ScopeSnapshot }) {
  const blocks = useWorkbench((s) => s.blocks);
  const label = blocks.find((b) => b.id === scope.blockId)?.label ?? "Scope";
  const svgRef = useRef<SVGSVGElement>(null);

  const { paths, xTicks, yTicks, tMin, tMax, yMin, yMax } = useMemo(() => {
    const width = 600;
    const height = 220;
    const padL = 40, padR = 12, padT = 10, padB = 24;
    const iw = width - padL - padR;
    const ih = height - padT - padB;

    let yMinL = Infinity, yMaxL = -Infinity, tMinL = Infinity, tMaxL = -Infinity;
    for (const ch of scope.channels) {
      for (const s of ch.samples) {
        if (s.v < yMinL) yMinL = s.v;
        if (s.v > yMaxL) yMaxL = s.v;
        if (s.t < tMinL) tMinL = s.t;
        if (s.t > tMaxL) tMaxL = s.t;
      }
    }
    if (!isFinite(yMinL)) { yMinL = -1; yMaxL = 1; }
    if (!isFinite(tMinL)) { tMinL = 0; tMaxL = 1; }
    if (yMaxL - yMinL < 1e-9) { yMinL -= 1; yMaxL += 1; }
    if (tMaxL - tMinL < 1e-9) tMaxL = tMinL + 1e-6;
    const pad = (yMaxL - yMinL) * 0.08;
    yMinL -= pad; yMaxL += pad;

    const sx = (t: number) => padL + ((t - tMinL) / (tMaxL - tMinL)) * iw;
    const sy = (v: number) => padT + (1 - (v - yMinL) / (yMaxL - yMinL)) * ih;

    const paths = scope.channels.map((ch, idx) => {
      if (!ch.samples.length) return { path: "", color: CH_COLORS[idx % CH_COLORS.length], label: ch.label };
      let d = "";
      for (let i = 0; i < ch.samples.length; i++) {
        const s = ch.samples[i];
        d += (i === 0 ? "M" : "L") + sx(s.t).toFixed(1) + "," + sy(s.v).toFixed(1);
      }
      return { path: d, color: CH_COLORS[idx % CH_COLORS.length], label: ch.label };
    });

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const v = yMinL + ((yMaxL - yMinL) * i) / 4;
      return { v, y: sy(v) };
    });
    const xTicks = Array.from({ length: 5 }, (_, i) => {
      const v = tMinL + ((tMaxL - tMinL) * i) / 4;
      return { v, x: sx(v) };
    });

    return { paths, xTicks, yTicks, tMin: tMinL, tMax: tMaxL, yMin: yMinL, yMax: yMaxL };
  }, [scope]);

  const exportCsv = () => {
    let csv = "t," + scope.channels.map((c) => c.label).join(",") + "\n";
    // union time axis: use channel with most samples
    const base = scope.channels.reduce((a, b) => (a.samples.length >= b.samples.length ? a : b));
    for (let i = 0; i < base.samples.length; i++) {
      const t = base.samples[i].t;
      const row = [t.toFixed(6)];
      for (const ch of scope.channels) {
        const s = ch.samples[i];
        row.push(s ? s.v.toFixed(6) : "");
      }
      csv += row.join(",") + "\n";
    }
    downloadBlob(new Blob([csv], { type: "text/csv" }), `${label}.csv`);
  };

  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.viewBox.baseVal.width * 2;
      canvas.height = svg.viewBox.baseVal.height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#1a1e28";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => b && downloadBlob(b, `${label}.png`));
    };
    img.src = "data:image/svg+xml;base64," + svg64;
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium">{label}</div>
          <div className="text-mono text-[10px] text-muted-foreground">
            [{yMin.toFixed(2)} … {yMax.toFixed(2)}] / [{tMin.toFixed(2)} … {tMax.toFixed(2)}]s
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 pr-2">
            {paths.map((p, i) => p.path && (
              <div key={i} className="flex items-center gap-1 text-[10px]">
                <span className="inline-block h-1 w-3" style={{ background: p.color }} />
                <span className="text-mono text-muted-foreground">{p.label}</span>
              </div>
            ))}
          </div>
          <button onClick={exportCsv} title="Export CSV"
            className="rounded p-1 text-muted-foreground hover:bg-surface-raised hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={exportPng} title="Export PNG"
            className="rounded p-1 text-muted-foreground hover:bg-surface-raised hover:text-foreground">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <svg ref={svgRef} viewBox="0 0 600 220" className="block h-[220px] w-full bg-surface-sunken">
        {yTicks.map((t, i) => (
          <g key={"y" + i}>
            <line x1={40} x2={588} y1={t.y} y2={t.y} stroke="var(--grid)" strokeWidth="0.5" />
            <text x={36} y={t.y + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)" fontFamily="ui-monospace">
              {t.v.toFixed(2)}
            </text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <g key={"x" + i}>
            <line x1={t.x} x2={t.x} y1={10} y2={196} stroke="var(--grid)" strokeWidth="0.5" />
            <text x={t.x} y={210} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)" fontFamily="ui-monospace">
              {t.v.toFixed(2)}s
            </text>
          </g>
        ))}
        {paths.map((p, i) => p.path && (
          <path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth="1.4" />
        ))}
      </svg>
    </div>
  );
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
