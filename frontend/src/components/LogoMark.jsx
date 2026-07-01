/**
 * LogoMark — símbolo oficial "Iaso" (o arco), igual ao do app principal.
 * variant: "color" (verde) | "rev" (creme, p/ fundo escuro) | "mono" (currentColor)
 */
const FILLS = {
  color: { arc: "#00704A", knot: "#A9DEC8" },
  mono:  { arc: "currentColor", knot: "currentColor" },
  rev:   { arc: "#FAF7F2", knot: "#A9DEC8" },
};

export default function LogoMark({ variant = "color", size = 30, className = "" }) {
  const f = FILLS[variant] || FILLS.color;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-label="Iaso">
      <path d="M70.66 22.5 A36 36 0 1 1 29.34 22.5 L37.4 34 A22 22 0 1 0 62.6 34 Z" fill={f.arc} />
      <circle cx="50" cy="16" r="7.5" fill={f.knot} />
    </svg>
  );
}
