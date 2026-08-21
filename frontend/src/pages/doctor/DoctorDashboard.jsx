import { useEffect, useState, useCallback } from "react";
import NavBar from "../../components/NavBar";
import api, { errorMessage } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import UrgencyBadge from "../../components/UrgencyBadge";
import { useAuth } from "../../AuthContext";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function safeParseJSON(str) {
  if (!str) return null;
  try {
    const v = typeof str === "string" ? JSON.parse(str) : str;
    return typeof v === "object" && v !== null ? v : null;
  } catch { return null; }
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drafts, setDrafts] = useState({});
  const [openId, setOpenId] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveBusy, setLeaveBusy] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [apptRes, profileRes, leaveRes] = await Promise.all([
        api.get("/api/doctor/appointments"),
        api.get("/api/doctor/profile"),
        api.get("/api/doctor/leaves"),
      ]);
      setAppointments(apptRes.data);
      setProfile(profileRes.data);
      setLeaves(leaveRes.data);
      if (!profileForm) {
        setProfileForm({
          working_start: profileRes.data.working_start,
          working_end:   profileRes.data.working_end,
          slot_duration_minutes: profileRes.data.slot_duration_minutes,
          working_days:  profileRes.data.working_days,
          bio:           profileRes.data.bio,
        });
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function updateDraft(id, field, value) {
    setDrafts({ ...drafts, [id]: { ...drafts[id], [field]: value } });
  }

  function toggleDay(day) {
    const days = new Set((profileForm.working_days || "").split(",").filter(Boolean));
    if (days.has(String(day))) days.delete(String(day));
    else days.add(String(day));
    setProfileForm({ ...profileForm, working_days: Array.from(days).sort().join(",") });
  }

  function notify(msg, isError = false) {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  }

  async function submitNotes(id) {
    const draft = drafts[id] || {};
    if (!draft.notes?.trim()) return;
    try {
      await api.post(`/api/doctor/appointments/${id}/notes`, {
        notes: draft.notes,
        prescription: draft.prescription || "",
      });
      await loadAll();
      setOpenId(null);
      notify("Notes saved. Patient-friendly summary generated.");
    } catch (err) {
      notify(errorMessage(err), true);
    }
  }

  async function saveProfile() {
    setProfileBusy(true);
    try {
      const res = await api.put("/api/doctor/profile", profileForm);
      setProfile(res.data);
      notify("Profile updated successfully.");
    } catch (err) {
      notify(errorMessage(err), true);
    } finally {
      setProfileBusy(false);
    }
  }

  async function addLeave() {
    if (!leaveDate) return;
    setLeaveBusy(true);
    try {
      const res = await api.post("/api/doctor/leaves", { date: leaveDate, reason: leaveReason });
      const n = res.data.affected_appointments.length;
      notify(n > 0
        ? `Leave added for ${leaveDate}. ${n} existing booking(s) cancelled and patients notified.`
        : `Leave added for ${leaveDate}. No existing bookings affected.`
      );
      setLeaveDate("");
      setLeaveReason("");
      await loadAll();
    } catch (err) {
      notify(errorMessage(err), true);
    } finally {
      setLeaveBusy(false);
    }
  }

  async function removeLeave(leaveId) {
    if (!confirm("Remove this leave day? Patients won't be automatically re-notified.")) return;
    try {
      await api.delete(`/api/doctor/leaves/${leaveId}`);
      notify("Leave day removed.");
      await loadAll();
    } catch (err) {
      notify(errorMessage(err), true);
    }
  }

  const upcoming = appointments.filter((a) => a.status === "booked");
  const past = appointments.filter((a) => a.status !== "booked");

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-5xl mx-auto px-5 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-ink">
              Dr. <span className="text-gradient">{user?.name}</span>
            </h1>
            {profile && (
              <p className="text-ink-muted text-sm mt-1">{profile.specialisation} · {profile.working_start}–{profile.working_end}</p>
            )}
          </div>
          <div className="tab-bar">
            {[
              { id: "appointments", label: "📋 Appointments", badge: upcoming.length },
              { id: "profile",      label: "⚙ Profile & Availability" },
              { id: "leaves",       label: "🗓 My Leave Days", badge: leaves.length || undefined },
            ].map((t) => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
                {t.badge > 0 && (
                  <span className="ml-1.5 bg-accent text-bg-secondary text-xs rounded-full w-5 h-5 inline-flex items-center justify-center font-bold">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose bg-rose/10 border border-rose/20 rounded-xl px-4 py-3 mb-4">
            <span>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald bg-emerald/10 border border-emerald/20 rounded-xl px-4 py-3 mb-4">
            <span>✓</span> {success}
          </div>
        )}

        {/* ── Appointments Tab ── */}
        {tab === "appointments" && (
          <div className="animate-slide-up space-y-8">
            <section>
              <h2 className="font-display font-semibold text-xl text-ink mb-4 flex items-center gap-2">
                <span className="glow-dot" /> Upcoming appointments
              </h2>
              <div className="space-y-4">
                {upcoming.map((a) => {
                  const summary = safeParseJSON(a.previsit_summary);
                  const isOpen = openId === a.id;
                  return (
                    <div key={a.id} className="card p-5 hover:border-glass-border-light">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                               style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))" }}>
                            <span className="text-emerald">{a.patient_name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-display font-bold text-ink">{a.patient_name}</p>
                            <p className="text-ink-faint text-xs">📅 {a.appointment_date} at {a.start_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {summary && <UrgencyBadge level={summary.urgency} />}
                          <StatusBadge status={a.status} />
                        </div>
                      </div>

                      {/* Pre-visit AI summary */}
                      {summary ? (
                        <div className="mt-4 rounded-xl bg-glass border border-glass-border p-4 text-sm">
                          {a.previsit_llm_failed && (
                            <p className="text-xs text-amber bg-amber/10 border border-amber/20 rounded-lg px-3 py-2 mb-3">
                              ⚠ AI summary unavailable — showing raw symptoms.
                            </p>
                          )}
                          <div className="grid sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-ink-faint text-xs mb-1">Chief complaint</p>
                              <p className="text-ink font-medium">{summary.chief_complaint}</p>
                            </div>
                            <div>
                              <p className="text-ink-faint text-xs mb-1">Raw symptoms</p>
                              <p className="text-ink-muted">{a.symptoms_text}</p>
                            </div>
                          </div>
                          {summary.suggested_questions?.length > 0 && (
                            <div>
                              <p className="text-ink-faint text-xs mb-2">Suggested questions to ask patient</p>
                              <ul className="space-y-1">
                                {summary.suggested_questions.map((q, i) => (
                                  <li key={i} className="text-ink-muted flex gap-2">
                                    <span className="text-accent text-xs mt-0.5">→</span> {q}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-faint mt-3 italic">
                          Patient hasn't submitted a symptom form yet.
                        </p>
                      )}

                      {/* Post-visit notes form */}
                      {!isOpen ? (
                        <button
                          id={`add-notes-${a.id}`}
                          className="btn-secondary mt-4"
                          onClick={() => setOpenId(a.id)}
                        >
                          📝 Add post-visit notes
                        </button>
                      ) : (
                        <div className="mt-4 border-t border-glass-border pt-4 space-y-4 animate-slide-up">
                          <div>
                            <label className="label">Clinical notes <span className="text-rose">*</span></label>
                            <textarea
                              id={`notes-${a.id}`}
                              className="input min-h-[100px] resize-none"
                              placeholder="Diagnosis, examination findings, treatment plan…"
                              value={drafts[a.id]?.notes || ""}
                              onChange={(e) => updateDraft(a.id, "notes", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="label">
                              Prescription
                              <span className="normal-case font-normal text-ink-faint ml-1">
                                (one per line — e.g. "Paracetamol 500mg – twice daily for 5 days")
                              </span>
                            </label>
                            <textarea
                              id={`prescription-${a.id}`}
                              className="input min-h-[80px] resize-none"
                              placeholder={"Paracetamol 500mg – twice daily for 5 days\nOmeprazole 20mg – once daily for 7 days"}
                              value={drafts[a.id]?.prescription || ""}
                              onChange={(e) => updateDraft(a.id, "prescription", e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              id={`save-notes-${a.id}`}
                              className="btn-primary"
                              onClick={() => submitNotes(a.id)}
                              disabled={!drafts[a.id]?.notes?.trim()}
                            >
                              Save & generate patient summary
                            </button>
                            <button className="btn-ghost" onClick={() => setOpenId(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {upcoming.length === 0 && (
                  <div className="card p-10 text-center">
                    <p className="text-4xl mb-3">🗓</p>
                    <p className="text-ink-muted">No upcoming appointments.</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl text-ink mb-4">History</h2>
              <div className="space-y-2">
                {past.map((a) => (
                  <div key={a.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink text-sm">{a.patient_name}</p>
                      <p className="text-ink-faint text-xs">📅 {a.appointment_date} at {a.start_time}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
                {past.length === 0 && <p className="text-ink-faint text-sm">No past appointments.</p>}
              </div>
            </section>
          </div>
        )}

        {/* ── Profile & Availability Tab ── */}
        {tab === "profile" && profileForm && (
          <div className="animate-slide-up max-w-2xl">
            <h2 className="font-display font-semibold text-xl text-ink mb-5">Profile & Availability</h2>
            <div className="card p-6 space-y-5">
              {/* Working hours */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Start time</label>
                  <input
                    id="profile-start"
                    type="time"
                    className="input"
                    value={profileForm.working_start}
                    onChange={(e) => setProfileForm({ ...profileForm, working_start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End time</label>
                  <input
                    id="profile-end"
                    type="time"
                    className="input"
                    value={profileForm.working_end}
                    onChange={(e) => setProfileForm({ ...profileForm, working_end: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Slot (min)</label>
                  <input
                    id="profile-slot"
                    type="number"
                    min={5}
                    max={120}
                    className="input"
                    value={profileForm.slot_duration_minutes}
                    onChange={(e) => setProfileForm({ ...profileForm, slot_duration_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Working days */}
              <div>
                <label className="label">Working days</label>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((label, idx) => {
                    const active = (profileForm.working_days || "").split(",").includes(String(idx));
                    return (
                      <button
                        key={label}
                        id={`day-${label}`}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                          active
                            ? "border-accent/60 text-bg-secondary shadow-glow-sm"
                            : "bg-glass border-glass-border text-ink-muted hover:border-accent/30"
                        }`}
                        style={active ? { background: "linear-gradient(135deg, #22d3ee, #14b8a6)" } : {}}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="label">Bio</label>
                <textarea
                  id="profile-bio"
                  className="input min-h-[80px] resize-none"
                  placeholder="Brief professional bio shown to patients…"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                />
              </div>

              <button
                id="save-profile-btn"
                className="btn-primary"
                onClick={saveProfile}
                disabled={profileBusy}
              >
                {profileBusy ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : "Save profile"}
              </button>
            </div>
          </div>
        )}

        {/* ── Leave Days Tab ── */}
        {tab === "leaves" && (
          <div className="animate-slide-up">
            <h2 className="font-display font-semibold text-xl text-ink mb-5">My Leave Days</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Add leave form */}
              <div className="card p-5 space-y-4">
                <h3 className="font-display font-semibold text-ink">Mark yourself unavailable</h3>
                <p className="text-ink-faint text-xs">
                  Adding a leave day will cancel any existing bookings on that date and notify affected patients.
                </p>
                <div>
                  <label className="label">Date</label>
                  <input
                    id="leave-date-input"
                    type="date"
                    className="input"
                    min={new Date().toISOString().slice(0, 10)}
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Reason <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                  <input
                    id="leave-reason-input"
                    className="input"
                    placeholder="Conference, personal leave, etc."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                  />
                </div>
                <button
                  id="add-leave-btn"
                  className="btn-danger w-full"
                  disabled={!leaveDate || leaveBusy}
                  onClick={addLeave}
                >
                  {leaveBusy ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Marking leave…
                    </span>
                  ) : "Mark as unavailable"}
                </button>
              </div>

              {/* Existing leaves */}
              <div>
                <h3 className="font-display font-semibold text-ink mb-3">Scheduled leave days</h3>
                {leaves.length === 0 ? (
                  <div className="card p-8 text-center">
                    <p className="text-3xl mb-2">✅</p>
                    <p className="text-ink-muted text-sm">No leave days scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaves.map((l) => (
                      <div key={l.id} className="card p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-ink text-sm">📅 {l.leave_date}</p>
                          {l.reason && <p className="text-ink-faint text-xs mt-0.5">{l.reason}</p>}
                        </div>
                        <button
                          id={`remove-leave-${l.id}`}
                          className="btn-ghost btn-sm text-rose hover:text-rose"
                          onClick={() => removeLeave(l.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
