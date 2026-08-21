const URGENCY_CONFIG = {
  Low:    { label: "Low urgency",    className: "bg-emerald/15 text-emerald border border-emerald/25",   icon: "●" },
  Medium: { label: "Medium urgency", className: "bg-amber/15 text-amber border border-amber/25",         icon: "●" },
  High:   { label: "High urgency",   className: "bg-rose/15 text-rose border border-rose/25 animate-pulse-slow", icon: "●" },
};

export default function UrgencyBadge({ level }) {
  const cfg = URGENCY_CONFIG[level] || {
    label: level || "Unknown",
    className: "bg-glass text-ink-muted border border-glass-border",
    icon: "●",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <span className="text-[8px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
