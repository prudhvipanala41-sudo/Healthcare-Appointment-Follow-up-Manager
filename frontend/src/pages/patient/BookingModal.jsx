import { useEffect, useState } from "react";
import api, { errorMessage } from "../../api";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingModal({ doctor, onClose, onBooked }) {
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [holdId, setHoldId] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ── Fix: reload slots whenever date OR doctor changes ──
  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, doctor.id]);

  async function loadSlots() {
    setError("");
    setSelected(null);   // clear selection on date change
    setHoldId(null);     // release any pending hold reference
    setSlotsLoading(true);
    try {
      const res = await api.get(`/api/patient/doctors/${doctor.id}/slots`, { params: { date } });
      setSlots(res.data.slots || []);
    } catch (err) {
      setError(errorMessage(err));
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function pickSlot(slot) {
    if (selected === slot) {
      // Deselect
      setSelected(null);
      setHoldId(null);
      return;
    }
    setError("");
    try {
      const res = await api.post(`/api/patient/doctors/${doctor.id}/hold`, { date, start_time: slot });
      setSelected(slot);
      setHoldId(res.data.hold_id);
    } catch (err) {
      setError(errorMessage(err));
      loadSlots();
    }
  }

  const [booked, setBooked] = useState(false);

  async function confirmBooking() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/patient/doctors/${doctor.id}/book`, {
        date,
        start_time: selected,
        hold_id: holdId,
        symptoms: symptoms.trim() || undefined,
      });
      setBooked(true);
      // Show success screen for 2 seconds, then close and refresh
      setTimeout(() => {
        onBooked();
      }, 2000);
    } catch (err) {
      setError(errorMessage(err));
      loadSlots();
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dateObj = date ? new Date(date + "T00:00:00") : null;
  const dayLabel = dateObj ? `${DAY_NAMES[dateObj.getDay()]}, ${dateObj.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}` : "";

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm grid place-items-center p-4 z-50 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={booked ? undefined : onClose}
    >
      <div
        className="card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── SUCCESS SCREEN ── */}
        {booked ? (
          <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-glow"
                 style={{ background: "linear-gradient(135deg, #22d3ee, #14b8a6)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-ink mb-1">Booking Confirmed! 🎉</h2>
              <p className="text-ink-muted text-sm">Your appointment with Dr. {doctor.name}</p>
              <p className="text-accent font-semibold mt-1">{selected} · {date}</p>
            </div>
            <p className="text-xs text-ink-faint">A confirmation email has been sent to you. Redirecting…</p>
          </div>
        ) : (
          <>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-ink">Dr. {doctor.name}</h2>
            <p className="text-accent text-sm font-semibold mt-0.5">{doctor.specialisation}</p>
            <p className="text-ink-faint text-xs mt-1">
              {doctor.working_start}–{doctor.working_end} · {doctor.slot_duration_minutes} min slots
            </p>
          </div>
          <button
            id="close-booking-modal"
            onClick={onClose}
            className="text-ink-faint hover:text-ink transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-glass-light"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-rose bg-rose/10 border border-rose/20 rounded-xl px-4 py-3 mb-4">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Date picker */}
        <div className="mb-5">
          <label className="label">Select date</label>
          <input
            id="booking-date-picker"
            type="date"
            className="input"
            min={todayStr()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {dayLabel && <p className="text-xs text-ink-faint mt-1">{dayLabel}</p>}
        </div>

        {/* Slot grid */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Available slots</label>
            <button
              id="refresh-slots-btn"
              onClick={loadSlots}
              disabled={slotsLoading}
              className="text-xs text-accent hover:text-accent-glow transition-colors disabled:opacity-50"
            >
              {slotsLoading ? "Loading…" : "↺ Refresh"}
            </button>
          </div>

          {slotsLoading ? (
            <div className="grid grid-cols-4 gap-2 mb-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-glass-light animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
              {slots.map((s) => (
                <button
                  key={s}
                  id={`slot-${s.replace(":", "")}`}
                  onClick={() => pickSlot(s)}
                  className={`rounded-xl px-2 py-2.5 text-sm font-semibold border transition-all duration-150 ${
                    selected === s
                      ? "border-accent/60 text-bg-secondary shadow-glow-sm scale-105"
                      : "bg-glass border-glass-border text-ink-muted hover:border-accent/40 hover:text-ink"
                  }`}
                  style={selected === s ? { background: "linear-gradient(135deg, #22d3ee, #14b8a6)" } : {}}
                >
                  {s}
                </button>
              ))}
              {slots.length === 0 && (
                <p className="col-span-4 text-sm text-ink-faint py-6 text-center">
                  No slots available — the doctor may be off or fully booked this day.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Symptoms — optional, submitted with booking */}
        <div className="mb-5">
          <label className="label">Describe your symptoms <span className="normal-case font-normal text-ink-faint">(optional — helps the doctor prepare)</span></label>
          <textarea
            id="booking-symptoms"
            className="input min-h-[80px] resize-none"
            placeholder="e.g. Headache for 3 days, mild fever, sore throat…"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </div>

        {/* Confirm button */}
        <button
          id="confirm-booking-btn"
          className="btn-primary w-full py-3"
          disabled={!selected || busy}
          onClick={confirmBooking}
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Booking…
            </span>
          ) : selected ? (
            `Confirm ${selected} on ${dayLabel}`
          ) : (
            "Select a slot to continue"
          )}
        </button>
        {selected && (
          <p className="text-xs text-ink-faint mt-2 text-center">
            ⏱ This slot is held for you for 2 minutes while you confirm.
          </p>
        )}
          </>
        )}
      </div>
    </div>
  );
}
