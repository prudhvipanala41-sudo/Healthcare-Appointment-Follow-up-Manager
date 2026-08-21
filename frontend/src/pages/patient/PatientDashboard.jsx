import { useEffect, useState, useCallback } from "react";
import NavBar from "../../components/NavBar";
import api, { errorMessage } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import UrgencyBadge from "../../components/UrgencyBadge";
import BookingModal from "./BookingModal";
import { useAuth } from "../../AuthContext";

function safeParseJSON(str) {
  if (!str) return null;
  try {
    const v = typeof str === "string" ? JSON.parse(str) : str;
    return typeof v === "object" && v !== null ? v : null;
  } catch {
    return null;
  }
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("book");
  const [doctors, setDoctors] = useState([]);
  const [specialisation, setSpecialisation] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [error, setError] = useState("");
  const [symptomDraft, setSymptomDraft] = useState({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAppts, setLoadingAppts] = useState(false);

  const loadDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    setError("");
    try {
      const res = await api.get("/api/patient/doctors", { params: { specialisation } });
      setDoctors(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingDoctors(false);
    }
  }, [specialisation]);

  const loadAppointments = useCallback(async () => {
    setLoadingAppts(true);
    try {
      const res = await api.get("/api/patient/appointments");
      setAppointments(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingAppts(false);
    }
  }, []);

  useEffect(() => { loadDoctors(); }, []);
  useEffect(() => { if (tab === "appointments") loadAppointments(); }, [tab]);

  async function submitSymptoms(appointmentId) {
    const text = symptomDraft[appointmentId];
    if (!text?.trim()) return;
    try {
      await api.post(`/api/patient/appointments/${appointmentId}/symptoms`, { symptoms: text });
      await loadAppointments();
      setSymptomDraft((d) => { const n = {...d}; delete n[appointmentId]; return n; });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function cancelAppointment(id) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.post(`/api/patient/appointments/${id}/cancel`);
      await loadAppointments();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  // Stats
  const booked = appointments.filter((a) => a.status === "booked").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status.startsWith("cancelled")).length;

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-5 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-ink">
              Hello, <span className="text-gradient">{user?.name?.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-ink-muted text-sm mt-1">Find a doctor, book a slot, and track your visits.</p>
          </div>
          <div className="tab-bar">
            <button
              className={`tab-btn ${tab === "book" ? "active" : ""}`}
              onClick={() => setTab("book")}
            >
              🔍 Find Doctor
            </button>
            <button
              className={`tab-btn ${tab === "appointments" ? "active" : ""}`}
              onClick={() => setTab("appointments")}
            >
              📋 My Appointments
              {booked > 0 && (
                <span className="ml-1.5 bg-accent text-bg-secondary text-xs rounded-full w-5 h-5 inline-flex items-center justify-center font-bold">
                  {booked}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats row */}
        {tab === "appointments" && appointments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Upcoming", value: booked,    icon: "📅", color: "text-accent",   bg: "from-accent/15 to-accent/5" },
              { label: "Completed", value: completed, icon: "✅", color: "text-emerald",  bg: "from-emerald/15 to-emerald/5" },
              { label: "Cancelled", value: cancelled, icon: "❌", color: "text-rose",     bg: "from-rose/15 to-rose/5" },
            ].map((s) => (
              <div key={s.label} className={`card p-4 bg-gradient-to-br ${s.bg} flex items-center gap-3`}>
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
                  <p className="text-ink-faint text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-rose bg-rose/10 border border-rose/20 rounded-xl px-4 py-3 mb-4">
            <span>⚠</span> {error}
            <button onClick={() => setError("")} className="ml-auto text-rose/60 hover:text-rose">×</button>
          </div>
        )}

        {/* ── Find Doctor Tab ── */}
        {tab === "book" && (
          <div className="animate-slide-up">
            <div className="flex gap-3 mb-6 max-w-lg">
              <input
                id="doctor-search-input"
                className="input"
                placeholder="Search by specialisation (e.g. Dermatologist)"
                value={specialisation}
                onChange={(e) => setSpecialisation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDoctors()}
              />
              <button id="doctor-search-btn" className="btn-primary shrink-0" onClick={loadDoctors} disabled={loadingDoctors}>
                {loadingDoctors ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Search"}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((d) => (
                <div key={d.id} className="card p-5 flex flex-col group hover:border-accent/30 transition-all duration-200">
                  {/* Doctor avatar */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg flex-shrink-0"
                         style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(20,184,166,0.1))" }}>
                      <span className="text-accent">{d.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink truncate">Dr. {d.name}</p>
                      <p className="text-accent text-xs font-semibold">{d.specialisation}</p>
                    </div>
                  </div>
                  <p className="text-ink-muted text-xs mb-3 line-clamp-2 flex-1">
                    {d.bio || "Experienced specialist ready to help."}
                  </p>
                  <div className="flex items-center gap-2 text-ink-faint text-xs mb-4">
                    <span>🕐 {d.working_start}–{d.working_end}</span>
                    <span>·</span>
                    <span>{d.slot_duration_minutes} min slots</span>
                  </div>
                  <button
                    id={`book-doctor-${d.id}`}
                    className="btn-primary"
                    onClick={() => setSelectedDoctor(d)}
                  >
                    View slots & book
                  </button>
                </div>
              ))}
              {!loadingDoctors && doctors.length === 0 && (
                <div className="col-span-full card p-10 text-center">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-ink-muted">No doctors found. Try a different specialisation.</p>
                </div>
              )}
              {loadingDoctors && [...Array(3)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-glass-light" />
                    <div className="flex-1 space-y-2"><div className="h-4 bg-glass-light rounded w-3/4" /><div className="h-3 bg-glass-light rounded w-1/2" /></div>
                  </div>
                  <div className="h-3 bg-glass-light rounded mb-2" /><div className="h-3 bg-glass-light rounded w-2/3 mb-4" />
                  <div className="h-10 bg-glass-light rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── My Appointments Tab ── */}
        {tab === "appointments" && (
          <div className="animate-slide-up">
            {loadingAppts ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="flex gap-3"><div className="flex-1 space-y-2"><div className="h-5 bg-glass-light rounded w-1/3" /><div className="h-3 bg-glass-light rounded w-1/2" /></div><div className="w-20 h-6 bg-glass-light rounded-full" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((a) => {
                  const summary = safeParseJSON(a.previsit_summary);
                  return (
                    <div key={a.id} className="card p-5 hover:border-glass-border-light transition-all">
                      {/* Appointment header */}
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                               style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(20,184,166,0.1))" }}>
                            <span className="text-accent">Dr</span>
                          </div>
                          <div>
                            <p className="font-display font-bold text-ink">Dr. {a.doctor_name}</p>
                            <p className="text-ink-muted text-sm">{a.specialisation}</p>
                            <p className="text-ink-faint text-xs mt-0.5">
                              📅 {a.appointment_date} at {a.start_time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {summary && <UrgencyBadge level={summary.urgency} />}
                          <StatusBadge status={a.status} />
                        </div>
                      </div>

                      {/* Symptom form — only if booked and no symptoms yet */}
                      {a.status === "booked" && !a.symptoms_text && (
                        <div className="mt-4 border-t border-glass-border pt-4">
                          <label className="label">Tell the doctor how you're feeling</label>
                          <textarea
                            id={`symptoms-${a.id}`}
                            className="input min-h-[80px] resize-none"
                            placeholder="Describe your symptoms before the visit…"
                            value={symptomDraft[a.id] || ""}
                            onChange={(e) => setSymptomDraft({ ...symptomDraft, [a.id]: e.target.value })}
                          />
                          <button
                            id={`submit-symptoms-${a.id}`}
                            className="btn-secondary mt-2"
                            onClick={() => submitSymptoms(a.id)}
                          >
                            Submit symptoms & get AI summary
                          </button>
                        </div>
                      )}

                      {/* Already submitted symptoms */}
                      {a.symptoms_text && !summary && (
                        <div className="mt-3 px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-sm text-ink-muted">
                          <span className="font-semibold text-ink-faint text-xs uppercase tracking-wide">Symptoms submitted: </span>
                          {a.symptoms_text}
                        </div>
                      )}

                      {/* AI pre-visit summary */}
                      {summary && (
                        <div className="mt-4 border-t border-glass-border pt-4 rounded-b-xl">
                          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3">🤖 AI Pre-Visit Summary</p>
                          {a.previsit_llm_failed && (
                            <p className="text-xs text-amber bg-amber/10 border border-amber/20 rounded-lg px-3 py-2 mb-3">
                              ⚠ AI summary unavailable — showing default assessment.
                            </p>
                          )}
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="bg-glass rounded-xl p-3 border border-glass-border">
                              <p className="text-xs text-ink-faint mb-1">Chief complaint</p>
                              <p className="text-sm text-ink font-medium">{summary.chief_complaint}</p>
                            </div>
                            <div className="bg-glass rounded-xl p-3 border border-glass-border">
                              <p className="text-xs text-ink-faint mb-1">Urgency level</p>
                              <UrgencyBadge level={summary.urgency} />
                            </div>
                          </div>
                          {summary.suggested_questions?.length > 0 && (
                            <div className="mt-3 bg-glass rounded-xl p-3 border border-glass-border">
                              <p className="text-xs text-ink-faint mb-2">Questions to ask the doctor</p>
                              <ul className="space-y-1">
                                {summary.suggested_questions.map((q, i) => (
                                  <li key={i} className="text-sm text-ink-muted flex gap-2">
                                    <span className="text-accent text-xs mt-0.5">→</span> {q}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Post-visit summary */}
                      {a.postvisit_summary && (
                        <div className="mt-4 border-t border-glass-border pt-4">
                          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3">📋 Visit Summary</p>
                          {a.postvisit_llm_failed && (
                            <p className="text-xs text-amber bg-amber/10 border border-amber/20 rounded-lg px-3 py-2 mb-3">
                              ⚠ AI summary unavailable — showing doctor's raw notes.
                            </p>
                          )}
                          <div className="bg-glass rounded-xl p-4 border border-glass-border">
                            <p className="text-sm text-ink whitespace-pre-line leading-relaxed">{a.postvisit_summary}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {a.status === "booked" && (
                        <div className="mt-4 pt-3 border-t border-glass-border flex gap-2">
                          <button
                            id={`cancel-appt-${a.id}`}
                            className="btn-danger btn-sm"
                            onClick={() => cancelAppointment(a.id)}
                          >
                            Cancel appointment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {appointments.length === 0 && (
                  <div className="card p-12 text-center">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-ink-muted text-lg font-semibold">No appointments yet</p>
                    <p className="text-ink-faint text-sm mt-1">Switch to "Find Doctor" to book your first appointment.</p>
                    <button className="btn-primary mt-4" onClick={() => setTab("book")}>Find a doctor</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onBooked={() => {
            setSelectedDoctor(null);
            setTab("appointments");
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}
