import { useEffect, useState } from "react";
import api, { errorMessage } from "../../api";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingModal({ doctor, onClose, onSuccess }) {
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [holdId, setHoldId] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1); // 1 = Select Date/Time, 2 = Confirm & Details, 3 = Success

  // Reload slots whenever date or doctor changes
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
      setStep(3); // Success Screen
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2500);
    } catch (err) {
      setError(errorMessage(err));
      loadSlots();
      setSelected(null);
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dateObj = date ? new Date(date + "T00:00:00") : null;
  const dayLabel = dateObj ? `${DAY_NAMES[dateObj.getDay()]}, ${dateObj.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}` : "";

  return (
    <div
      className="fixed inset-0 backdrop-blur-md grid place-items-center p-4 z-50 animate-fade-in"
      style={{ background: "rgba(15, 23, 42, 0.4)" }}
      onClick={step === 3 ? undefined : onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 3 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-6 animate-slide-up"
                 style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">Booking Confirmed!</h2>
              <p className="text-slate-500 text-lg">Your appointment with Dr. {doctor.name}</p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-6 inline-block">
                <p className="text-emerald-600 font-bold text-lg">{selected} · {date}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-8 animate-slide-up" style={{ animationDelay: "200ms" }}>Redirecting to your dashboard…</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-display font-bold text-xl shadow-inner shrink-0">
                  {doctor.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-900 leading-tight">Dr. {doctor.name}</h2>
                  <p className="text-blue-600 font-bold text-sm mt-0.5">{doctor.specialisation}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-900 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Stepper */}
              <div className="flex items-center mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                <div className="w-full flex justify-between relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 1 ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>1</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${step >= 2 ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>2</div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-6 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center shrink-0">!</div>
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="animate-fade-in space-y-6">
                  {/* Date Picker */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Select Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-body text-slate-900 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer"
                        min={todayStr()}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    {dayLabel && <p className="text-sm text-blue-600 font-semibold mt-2 px-1">{dayLabel}</p>}
                  </div>

                  {/* Slot Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-bold text-slate-700">Available Slots</label>
                      <button
                        onClick={loadSlots}
                        disabled={slotsLoading}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 bg-blue-50 px-2 py-1 rounded-md"
                      >
                        {slotsLoading ? "Loading…" : "↺ Refresh"}
                      </button>
                    </div>

                    {slotsLoading ? (
                      <div className="grid grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {slots.map((s) => (
                          <button
                            key={s}
                            onClick={() => pickSlot(s)}
                            className={`rounded-xl px-2 py-3 text-sm font-bold border transition-all duration-200 ${
                              selected === s
                                ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105"
                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                        {slots.length === 0 && (
                          <div className="col-span-4 bg-slate-50 border border-slate-200 rounded-xl py-6 text-center">
                            <p className="text-slate-500 font-medium">No slots available for this date.</p>
                            <p className="text-xs text-slate-400 mt-1">Try selecting a different day.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-in space-y-6">
                  {/* Summary Card */}
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3">Appointment Summary</h3>
                    <div className="flex justify-between items-center bg-white rounded-xl p-4 border border-blue-50 shadow-sm">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Date & Time</p>
                        <p className="font-display font-bold text-lg text-slate-900">{selected}</p>
                        <p className="text-sm text-slate-600 font-medium">{dayLabel}</p>
                      </div>
                      <div className="text-right border-l border-slate-100 pl-4">
                        <p className="text-xs text-slate-500 font-medium">Consultation Fee</p>
                        <p className="font-display font-bold text-2xl text-blue-600">₹{doctor.consultation_fee || 800}</p>
                        <p className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block">Pay at clinic</p>
                      </div>
                    </div>
                  </div>

                  {/* Symptoms Input */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Add Symptoms (Optional)</label>
                    <p className="text-xs text-slate-500 mb-3">Help Dr. {doctor.name} prepare for your consultation.</p>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-body text-slate-900 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] resize-none"
                      placeholder="e.g. Headache for 3 days, mild fever…"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-slate-200 bg-white">
              {step === 1 ? (
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-body font-bold text-white transition-all shadow-md hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
                  disabled={!selected || busy}
                  onClick={() => setStep(2)}
                >
                  {selected ? "Continue to Details →" : "Select a slot to continue"}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    className="w-1/3 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white font-body font-bold text-slate-700 transition-all hover:bg-slate-50"
                    onClick={() => setStep(1)}
                    disabled={busy}
                  >
                    Back
                  </button>
                  <button
                    className="w-2/3 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-body font-bold text-white transition-all shadow-md hover:bg-blue-700 hover:shadow-lg disabled:opacity-70 disabled:cursor-wait"
                    onClick={confirmBooking}
                    disabled={busy}
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Confirming…
                      </span>
                    ) : (
                      "Confirm Appointment"
                    )}
                  </button>
                </div>
              )}
              {selected && step === 1 && (
                <p className="text-xs text-slate-500 font-medium text-center mt-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1 animate-pulse"></span>
                  Slot held for 2 minutes
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
