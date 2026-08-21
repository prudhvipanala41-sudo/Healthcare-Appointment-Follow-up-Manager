import { useEffect, useState, useCallback } from "react";
import NavBar from "../../components/NavBar";
import api, { errorMessage } from "../../api";

const emptyDoctor = {
  name: "", email: "", password: "", specialisation: "",
  slot_duration_minutes: 20, working_start: "09:00",
  working_end: "17:00", working_days: "0,1,2,3,4", bio: "",
};
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function DayPicker({ value, onChange }) {
  function toggle(idx) {
    const days = new Set(value.split(",").filter(Boolean));
    if (days.has(String(idx))) days.delete(String(idx));
    else days.add(String(idx));
    onChange(Array.from(days).sort().join(","));
  }
  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAY_LABELS.map((label, idx) => {
        const active = value.split(",").includes(String(idx));
        return (
          <button
            type="button" key={label}
            onClick={() => toggle(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
              active ? "border-accent/60 text-bg-secondary shadow-glow-sm" : "bg-glass border-glass-border text-ink-muted hover:border-accent/30"
            }`}
            style={active ? { background: "linear-gradient(135deg, #22d3ee, #14b8a6)" } : {}}
          >{label}</button>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("doctors");
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyDoctor);
  const [editDoc, setEditDoc] = useState(null);       // doctor being edited
  const [editForm, setEditForm] = useState({});
  const [expandedLeaves, setExpandedLeaves] = useState({}); // doctorId -> leave list
  const [leaveDrafts, setLeaveDrafts] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function notify(msg, isError = false) {
    if (isError) setError(msg); else setMessage(msg);
    setTimeout(() => { setError(""); setMessage(""); }, 5000);
  }

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/doctors");
      setDoctors(res.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createDoctor(e) {
    e.preventDefault();
    try {
      await api.post("/api/admin/doctors", form);
      setForm(emptyDoctor);
      notify("Doctor profile created successfully.");
      await load();
    } catch (err) { notify(errorMessage(err), true); }
  }

  async function saveEdit() {
    try {
      await api.put(`/api/admin/doctors/${editDoc.id}`, editForm);
      setEditDoc(null);
      notify("Doctor profile updated.");
      await load();
    } catch (err) { notify(errorMessage(err), true); }
  }

  async function deleteDoctor(id, name) {
    if (!confirm(`Delete Dr. ${name} permanently? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/doctors/${id}`);
      notify("Doctor deleted.");
      await load();
    } catch (err) { notify(errorMessage(err), true); }
  }

  async function markLeave(doctorId) {
    const draft = leaveDrafts[doctorId];
    if (!draft?.date) return;
    try {
      const res = await api.post(`/api/admin/doctors/${doctorId}/leave`, { date: draft.date, reason: draft.reason || "" });
      const n = res.data.affected_appointments.length;
      notify(n > 0
        ? `Leave recorded. ${n} appointment(s) cancelled and both sides notified.`
        : "Leave recorded. No existing appointments affected."
      );
      setLeaveDrafts({ ...leaveDrafts, [doctorId]: {} });
    } catch (err) { notify(errorMessage(err), true); }
  }

  async function toggleLeaveList(doctorId) {
    if (expandedLeaves[doctorId] !== undefined) {
      setExpandedLeaves({ ...expandedLeaves, [doctorId]: undefined });
      return;
    }
    try {
      const res = await api.get(`/api/admin/doctors/${doctorId}/leaves`);
      setExpandedLeaves({ ...expandedLeaves, [doctorId]: res.data });
    } catch (err) { notify(errorMessage(err), true); }
  }

  async function removeLeave(doctorId, leaveId) {
    try {
      await api.delete(`/api/admin/doctors/${doctorId}/leaves/${leaveId}`);
      const res = await api.get(`/api/admin/doctors/${doctorId}/leaves`);
      setExpandedLeaves({ ...expandedLeaves, [doctorId]: res.data });
      notify("Leave day removed.");
    } catch (err) { notify(errorMessage(err), true); }
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-5 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-ink">
              Admin <span className="text-gradient">Portal</span>
            </h1>
            <p className="text-ink-muted text-sm mt-1">Manage doctor profiles, schedules, and leave days.</p>
          </div>
          <div className="tab-bar">
            <button className={`tab-btn ${tab === "doctors" ? "active" : ""}`} onClick={() => setTab("doctors")}>
              👨‍⚕️ Doctors
            </button>
            <button className={`tab-btn ${tab === "add" ? "active" : ""}`} onClick={() => setTab("add")}>
              ➕ Add Doctor
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose bg-rose/10 border border-rose/20 rounded-xl px-4 py-3 mb-4">
            <span>⚠</span> {error}
          </div>
        )}
        {message && (
          <div className="flex items-center gap-2 text-sm text-emerald bg-emerald/10 border border-emerald/20 rounded-xl px-4 py-3 mb-4">
            <span>✓</span> {message}
          </div>
        )}

        {/* ── Doctors List Tab ── */}
        {tab === "doctors" && (
          <div className="animate-slide-up space-y-4">
            {doctors.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-4xl mb-3">👨‍⚕️</p>
                <p className="text-ink-muted">No doctors yet. Add one using the "Add Doctor" tab.</p>
              </div>
            )}
            {doctors.map((d) => (
              <div key={d.id} className="card p-5">
                {/* Doctor info row */}
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                         style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(20,184,166,0.1))" }}>
                      <span className="text-accent">{d.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-ink">Dr. {d.name}</p>
                      <p className="text-accent text-sm font-semibold">{d.specialisation}</p>
                      <p className="text-ink-faint text-xs mt-0.5">
                        {d.working_start}–{d.working_end} · {d.slot_duration_minutes} min slots · {d.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      id={`edit-doctor-${d.id}`}
                      className="btn-secondary btn-sm"
                      onClick={() => {
                        setEditDoc(d);
                        setEditForm({
                          specialisation: d.specialisation,
                          slot_duration_minutes: d.slot_duration_minutes,
                          working_start: d.working_start,
                          working_end: d.working_end,
                          working_days: d.working_days,
                          bio: d.bio,
                        });
                      }}
                    >
                      Edit profile
                    </button>
                    <button
                      id={`view-leaves-${d.id}`}
                      className="btn-ghost btn-sm"
                      onClick={() => toggleLeaveList(d.id)}
                    >
                      {expandedLeaves[d.id] ? "Hide leaves" : "View leaves"}
                    </button>
                    <button
                      id={`delete-doctor-${d.id}`}
                      className="btn-danger btn-sm"
                      onClick={() => deleteDoctor(d.id, d.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Leave management */}
                <div className="border-t border-glass-border pt-4">
                  <div className="flex gap-2 flex-wrap items-end">
                    <div>
                      <label className="label">Mark leave date</label>
                      <input
                        id={`leave-date-${d.id}`}
                        type="date"
                        className="input w-40"
                        value={leaveDrafts[d.id]?.date || ""}
                        onChange={(e) => setLeaveDrafts({ ...leaveDrafts, [d.id]: { ...leaveDrafts[d.id], date: e.target.value } })}
                      />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="label">Reason</label>
                      <input
                        id={`leave-reason-${d.id}`}
                        className="input"
                        placeholder="Optional"
                        value={leaveDrafts[d.id]?.reason || ""}
                        onChange={(e) => setLeaveDrafts({ ...leaveDrafts, [d.id]: { ...leaveDrafts[d.id], reason: e.target.value } })}
                      />
                    </div>
                    <button
                      id={`mark-leave-${d.id}`}
                      className="btn-danger btn-sm"
                      disabled={!leaveDrafts[d.id]?.date}
                      onClick={() => markLeave(d.id)}
                    >
                      Mark leave
                    </button>
                  </div>

                  {/* Expanded leave list */}
                  {expandedLeaves[d.id] && expandedLeaves[d.id].length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-ink-faint font-semibold uppercase tracking-wide">Scheduled leaves</p>
                      {expandedLeaves[d.id].map((l) => (
                        <div key={l.id} className="flex items-center justify-between bg-glass rounded-xl px-4 py-2 border border-glass-border">
                          <div>
                            <p className="text-sm text-ink font-medium">📅 {l.leave_date}</p>
                            {l.reason && <p className="text-ink-faint text-xs">{l.reason}</p>}
                          </div>
                          <button
                            id={`remove-leave-admin-${l.id}`}
                            className="btn-ghost btn-sm text-rose"
                            onClick={() => removeLeave(d.id, l.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {expandedLeaves[d.id] && expandedLeaves[d.id].length === 0 && (
                    <p className="text-ink-faint text-xs mt-3">No scheduled leave days.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Add Doctor Tab ── */}
        {tab === "add" && (
          <div className="animate-slide-up max-w-2xl">
            <h2 className="font-display font-semibold text-xl text-ink mb-5">Add a new doctor</h2>
            <form id="add-doctor-form" onSubmit={createDoctor} className="card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full name</label>
                  <input id="doc-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Specialisation</label>
                  <input id="doc-spec" className="input" required value={form.specialisation} onChange={(e) => setForm({ ...form, specialisation: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input id="doc-email" className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Temp password</label>
                  <input id="doc-pass" className="input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Start</label><input id="doc-start" type="time" className="input" value={form.working_start} onChange={(e) => setForm({ ...form, working_start: e.target.value })} /></div>
                <div><label className="label">End</label><input id="doc-end" type="time" className="input" value={form.working_end} onChange={(e) => setForm({ ...form, working_end: e.target.value })} /></div>
                <div><label className="label">Slot (min)</label><input id="doc-slot" type="number" min={5} className="input" value={form.slot_duration_minutes} onChange={(e) => setForm({ ...form, slot_duration_minutes: Number(e.target.value) })} /></div>
              </div>
              <div>
                <label className="label">Working days</label>
                <DayPicker value={form.working_days} onChange={(v) => setForm({ ...form, working_days: v })} />
              </div>
              <div>
                <label className="label">Bio (optional)</label>
                <textarea id="doc-bio" className="input min-h-[60px] resize-none" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <button id="create-doctor-btn" className="btn-primary w-full py-3" type="submit">Create doctor profile</button>
            </form>
          </div>
        )}

        {/* ── Edit Doctor Modal ── */}
        {editDoc && (
          <div className="fixed inset-0 backdrop-blur-sm z-50 grid place-items-center p-4 animate-fade-in"
               style={{ background: "rgba(0,0,0,0.7)" }}
               onClick={() => setEditDoc(null)}>
            <div className="card w-full max-w-lg p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-xl text-ink">Edit Dr. {editDoc.name}</h2>
                <button className="text-ink-faint hover:text-ink text-2xl" onClick={() => setEditDoc(null)}>×</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Specialisation</label>
                  <input className="input" value={editForm.specialisation} onChange={(e) => setEditForm({ ...editForm, specialisation: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="label">Start</label><input type="time" className="input" value={editForm.working_start} onChange={(e) => setEditForm({ ...editForm, working_start: e.target.value })} /></div>
                  <div><label className="label">End</label><input type="time" className="input" value={editForm.working_end} onChange={(e) => setEditForm({ ...editForm, working_end: e.target.value })} /></div>
                  <div><label className="label">Slot (min)</label><input type="number" min={5} className="input" value={editForm.slot_duration_minutes} onChange={(e) => setEditForm({ ...editForm, slot_duration_minutes: Number(e.target.value) })} /></div>
                </div>
                <div>
                  <label className="label">Working days</label>
                  <DayPicker value={editForm.working_days || ""} onChange={(v) => setEditForm({ ...editForm, working_days: v })} />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea className="input min-h-[60px] resize-none" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button id="save-edit-doctor-btn" className="btn-primary flex-1" onClick={saveEdit}>Save changes</button>
                  <button className="btn-ghost" onClick={() => setEditDoc(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
