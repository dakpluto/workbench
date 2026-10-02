/**
 * The DAKPluto Workbench emblem, redrawn as SVG from the logo:
 * a hex core holding { }, eight orbiting nodes on cyan/violet/amber signal
 * lines, and Pluto with its ring beneath.
 */

type Signal = "cyan" | "violet" | "amber";

const NODES: { signal: Signal; glyph: string }[] = [
  { signal: "cyan", glyph: "</>" },
  { signal: "amber", glyph: "♪" },
  { signal: "cyan", glyph: "101" },
  { signal: "violet", glyph: "∿" },
  { signal: "cyan", glyph: "♪" },
  { signal: "amber", glyph: "∿" },
  { signal: "violet", glyph: "</>" },
  { signal: "violet", glyph: "∿" },
];

const C = 100; // centre of the orbit disc
const R_NODE = 72;

function polar(r: number, i: number, n = NODES.length) {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
}

function hexPath(r: number) {
  return (
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return `${i ? "L" : "M"}${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
    }).join(" ") + "Z"
  );
}

export function Emblem({ className, detailed = true }: { className?: string; detailed?: boolean }) {
  return (
    <svg className={`emblem ${className ?? ""}`} viewBox="0 0 200 244" role="img" aria-label="DAKPluto Workbench emblem">
      <defs>
        <radialGradient id="em-disc" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#13214a" />
          <stop offset="70%" stopColor="#0a1230" />
          <stop offset="100%" stopColor="#070c1f" />
        </radialGradient>
        <radialGradient id="em-planet" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#e6ecfa" />
          <stop offset="45%" stopColor="#8d9bbd" />
          <stop offset="100%" stopColor="#2a3558" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r="96" fill="url(#em-disc)" />
      {detailed &&
        [
          [52, 40], [150, 46], [36, 120], [168, 128], [70, 168], [132, 172], [118, 30], [84, 62], [126, 140], [60, 96],
        ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 0.7 : 1.1} className="em-star" />)}

      <g className="em-orbit">
        <circle cx={C} cy={C} r="92" className="em-ring" />
      </g>
      <circle cx={C} cy={C} r="46" className="em-ring em-ring-inner" />

      {NODES.map((n, i) => {
        const [x, y] = polar(R_NODE, i);
        const [mx, my] = polar(46, i);
        return (
          <g key={i} className={`em-node em-${n.signal}`}>
            <line x1={C} y1={C} x2={x} y2={y} className="em-line" />
            <circle cx={mx} cy={my} r="2" className="em-joint" />
            <circle cx={x} cy={y} r="14" className="em-node-ring" />
            {detailed && (
              <text x={x} y={y} className="em-glyph" dominantBaseline="central" textAnchor="middle">
                {n.glyph}
              </text>
            )}
          </g>
        );
      })}

      <path d={hexPath(22)} className="em-hex" />
      <text x={C} y={C + 1} className="em-core" dominantBaseline="central" textAnchor="middle">
        {"{ }"}
      </text>

      <g className="em-pluto">
        <ellipse cx={C} cy="226" rx="38" ry="7" className="em-pluto-ring" />
        <circle cx={C} cy="218" r="15" fill="url(#em-planet)" />
        <path d="M62 226 A38 7 0 0 0 138 226" className="em-pluto-ring em-pluto-ring-front" />
      </g>
    </svg>
  );
}

/** Small lockup mark for the sidebar and favicon-sized uses. */
export function EmblemMark({ className }: { className?: string }) {
  return (
    <svg className={`emblem-mark ${className ?? ""}`} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="14.5" className="mark-ring" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const sig = ["cyan", "amber", "cyan", "violet", "cyan", "violet"][i];
        return <circle key={i} cx={16 + 11 * Math.cos(a)} cy={16 + 11 * Math.sin(a)} r="1.9" className={`mark-node em-${sig}`} />;
      })}
      <path d="M16 9.5 21.6 12.75 21.6 19.25 16 22.5 10.4 19.25 10.4 12.75Z" className="mark-hex" />
      <circle cx="16" cy="16" r="2" className="mark-core" />
    </svg>
  );
}

/** The cyan → violet → amber rule from under the wordmark. */
export function SpectrumRule() {
  return (
    <div className="spectrum" aria-hidden>
      <span className="spectrum-dot em-cyan" />
      <span className="spectrum-line" />
      <span className="spectrum-dot em-violet" />
      <span className="spectrum-line spectrum-line-warm" />
      <span className="spectrum-dot em-amber" />
    </div>
  );
}
