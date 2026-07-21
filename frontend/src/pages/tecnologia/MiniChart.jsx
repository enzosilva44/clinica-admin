// Gráfico de linha/área minimalista em SVG puro — sem dependências.
export default function MiniChart({ series = [], color = "#00704A", height = 64, unit = "", maxHint }) {
  const pts = series.filter((p) => p.v != null);
  if (pts.length < 2) {
    return <div className="text-xs text-gray-300 py-6 text-center">Sem dados suficientes.</div>;
  }

  const W = 100, H = height;
  const values = pts.map((p) => p.v);
  const max = Math.max(maxHint ?? 0, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;

  const coords = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - ((p.v - min) / range) * (H - 6) - 3;
    return [x, y];
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1].v;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-2xl font-black" style={{ color }}>
          {typeof last === "number" ? last.toFixed(last < 10 ? 1 : 0) : last}{unit}
        </span>
        <span className="text-[10px] text-gray-400">máx {max.toFixed(max < 10 ? 1 : 0)}{unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <path d={area} fill={color} opacity="0.1" />
        <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
