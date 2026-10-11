import { BELT_COLORS } from "../utils/beltUtils";

export default function BeltBadge({ belt, size = "md" }) {
  const colors = BELT_COLORS[belt] || BELT_COLORS.White;
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base font-semibold",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border} ${sizes[size]}`}>
      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      {belt} Belt
    </span>
  );
}