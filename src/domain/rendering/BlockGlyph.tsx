import type { ReactElement } from "react";

/**
 * Compact SVG glyphs for each block. Purely presentational.
 */

interface Props {
  type: string;
}

const stroke = "currentColor";

export function BlockGlyph({ type }: Props) {
  const g = GLYPHS[type];
  return (
    <svg viewBox="0 0 64 28" className="h-6 w-16 text-foreground/90" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {g ?? DEFAULT_GLYPH}
    </svg>
  );
}

const DEFAULT_GLYPH = <rect x="12" y="6" width="40" height="16" rx="2" />;

const GLYPHS: Record<string, ReactElement> = {
  "src.constant": <>
    <text x="32" y="19" textAnchor="middle" fontSize="12" fill="currentColor" stroke="none" fontFamily="ui-monospace">k</text>
  </>,
  "src.step": <>
    <path d="M6 20 H28 V8 H58" />
  </>,
  "src.sine": <>
    <path d="M6 14 Q14 2 22 14 T38 14 T54 14" />
  </>,
  "src.noise": <>
    <path d="M6 14 L12 8 L16 20 L22 6 L28 22 L34 10 L40 18 L46 6 L52 20 L58 14" />
  </>,
  "src.pulse": <>
    <path d="M6 20 H16 V8 H24 V20 H34 V8 H42 V20 H52 V8 H58" />
  </>,
  "math.gain": <>
    <path d="M12 6 L52 14 L12 22 Z" />
    <text x="30" y="17" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="ui-monospace">k</text>
  </>,
  "math.sum": <>
    <circle cx="32" cy="14" r="10" />
    <path d="M27 14 H37 M32 9 V19" />
  </>,
  "math.product": <>
    <circle cx="32" cy="14" r="10" />
    <path d="M28 10 L36 18 M36 10 L28 18" />
  </>,
  "math.abs": <>
    <path d="M14 6 V22 M50 6 V22" />
    <text x="32" y="18" textAnchor="middle" fontSize="10" fill="currentColor" stroke="none" fontFamily="ui-monospace">u</text>
  </>,
  "math.saturation": <>
    <path d="M6 22 L20 22 L44 6 L58 6" />
  </>,
  "dyn.integrator": <>
    <text x="32" y="21" textAnchor="middle" fontSize="18" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">∫</text>
  </>,
  "dyn.derivative": <>
    <text x="32" y="19" textAnchor="middle" fontSize="10" fill="currentColor" stroke="none" fontFamily="ui-monospace">du/dt</text>
  </>,
  "dyn.tf1": <>
    <line x1="16" y1="14" x2="48" y2="14" />
    <text x="32" y="11" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontFamily="ui-monospace">K</text>
    <text x="32" y="23" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontFamily="ui-monospace">τs+1</text>
  </>,
  "ctrl.pid": <>
    <text x="32" y="19" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" fontFamily="ui-monospace" fontWeight="600">PID</text>
  </>,
  "logic.comparator": <>
    <path d="M14 6 L14 22 L50 14 Z" />
  </>,
  "logic.and": <>
    <path d="M18 6 H32 A8 8 0 0 1 32 22 H18 Z" />
  </>,
  "logic.or": <>
    <path d="M16 6 Q24 14 16 22 Q34 22 46 14 Q34 6 16 6 Z" />
  </>,
  "logic.not": <>
    <path d="M18 6 L18 22 L44 14 Z" />
    <circle cx="48" cy="14" r="3" />
  </>,
  "sink.scope": <>
    <rect x="12" y="6" width="40" height="16" rx="2" />
    <path d="M16 18 L22 14 L28 16 L34 10 L40 14 L48 12" stroke="var(--primary)" />
  </>,
  "sink.display": <>
    <rect x="12" y="6" width="40" height="16" rx="2" />
    <text x="32" y="19" textAnchor="middle" fontSize="9" fill="var(--primary)" stroke="none" fontFamily="ui-monospace">0.00</text>
  </>,
};
