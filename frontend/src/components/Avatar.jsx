const COLORS = ["#1F4D46","#C4895A","#6F7F73","#4A8EC2","#9B59B6","#E74C3C"];

function color(name) {
  let h = 0;
  for (const c of name ?? "") h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

function initials(name) {
  return (name ?? "?").split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function Avatar({ name, size = 6 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: color(name), fontSize: size <= 6 ? "0.6rem" : "0.75rem" }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
