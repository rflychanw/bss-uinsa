type MotifProps = {
  uid: string;
  dots?: boolean;
  on?: number;
  className?: string;
};

/**
 * The loop: two arcs turning in one direction, arrowheads at the ends,
 * four stops where the steps of a setoran sit. Drawn once, reused everywhere.
 */
export default function Motif({ uid, dots = true, on = -1, className }: MotifProps) {
  const stops = [
    { x: 180, y: 30 },
    { x: 330, y: 180 },
    { x: 180, y: 330 },
    { x: 30, y: 180 },
  ];

  return (
    <svg
      viewBox="0 0 360 360"
      className={className}
      role="img"
      aria-label="Lingkaran empat langkah: pilah, setor, timbang, saldo"
    >
      <defs>
        <marker
          id={`g-${uid}`}
          viewBox="0 0 26 26"
          refX="20"
          refY="13"
          markerWidth="26"
          markerHeight="26"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M5 3 L23 13 L5 23 Z" fill="var(--green-bright)" />
        </marker>
        <marker
          id={`b-${uid}`}
          viewBox="0 0 26 26"
          refX="20"
          refY="13"
          markerWidth="26"
          markerHeight="26"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M5 3 L23 13 L5 23 Z" fill="var(--blue)" />
        </marker>
      </defs>

      <path
        className="ring__arc"
        d="M35.1 141.2 A150 150 0 0 1 324.9 141.2"
        stroke="var(--green-bright)"
        markerEnd={`url(#g-${uid})`}
      />
      <path
        className="ring__arc"
        d="M324.9 218.8 A150 150 0 0 1 35.1 218.8"
        stroke="var(--blue)"
        markerEnd={`url(#b-${uid})`}
      />

      {dots &&
        stops.map((s, i) => (
          <circle
            key={i}
            className="ring__dot"
            cx={s.x}
            cy={s.y}
            r={i === on ? 17 : 13}
            fill={i === on ? "var(--amber)" : "var(--paper-2)"}
            data-on={i === on}
          />
        ))}
    </svg>
  );
}
