const STATUS_CONFIG = {
  booked: {
    label: "Booked",
    className: "bg-blue-600/15 text-blue-600 border border-accent/25",
    dot: "bg-blue-600",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-600 border border-emerald/25",
    dot: "bg-emerald",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-ink-faint/15 text-slate-500 border border-slate-200",
    dot: "bg-ink-faint",
  },
  cancelled_by_leave: {
    label: "Cancelled (Leave)",
    className: "bg-rose-100 text-rose-600 border border-rose/25",
    dot: "bg-rose",
  },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-white text-slate-500 border border-slate-200",
    dot: "bg-ink-faint",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
