const STATUS_CONFIG = {
  booked: {
    label: "Booked",
    className: "bg-accent/15 text-accent border border-accent/25",
    dot: "bg-accent",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald/15 text-emerald border border-emerald/25",
    dot: "bg-emerald",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-ink-faint/15 text-ink-muted border border-glass-border",
    dot: "bg-ink-faint",
  },
  cancelled_by_leave: {
    label: "Cancelled (Leave)",
    className: "bg-rose/15 text-rose border border-rose/25",
    dot: "bg-rose",
  },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-glass text-ink-muted border border-glass-border",
    dot: "bg-ink-faint",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
