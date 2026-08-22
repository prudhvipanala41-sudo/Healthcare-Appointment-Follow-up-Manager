import { useEffect, useState, useCallback } from "react";
import NavBar from "../../components/NavBar";
import api, { errorMessage } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import UrgencyBadge from "../../components/UrgencyBadge";
import BookingModal from "./BookingModal";
import DoctorProfileModal from "./DoctorProfileModal";
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

const SPECIALTY_OPTIONS = [
  "All",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "Pediatrics",
  "Gynecology & Obstetrics",
  "Oncology",
  "Psychiatry",
  "Gastroenterology",
  "Pulmonology",
  "General Medicine",
  "Endocrinology",
  "Ophthalmology",
  "ENT (Otolaryngology)",
  "Urology",
  "Rheumatology",
  "Nephrology",
  "Plastic & Reconstructive Surgery",
];

const LOCATION_OPTIONS = [
  "All",
  "Bengaluru",
  "Hyderabad",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("book");
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedMode, setSelectedMode] = useState("All");
  const [sortBy, setSortBy] = useState("rating");

  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [error, setError] = useState("");
  const [symptomDraft, setSymptomDraft] = useState({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAppts, setLoadingAppts] = useState(false);

  const loadDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    setError("");
    try {
      const params = {
        search: search.trim() || undefined,
        specialisation: selectedSpecialty !== "All" ? selectedSpecialty : undefined,
        location: selectedLocation !== "All" ? selectedLocation : undefined,
        mode: selectedMode !== "All" ? selectedMode : undefined,
        sort_by: sortBy,
      };
      const res = await api.get("/api/patient/doctors", { params });
      setDoctors(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingDoctors(false);
    }
  }, [search, selectedSpecialty, selectedLocation, selectedMode, sortBy]);

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

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadDoctors();
    }, 250);
    return () => clearTimeout(debounceTimer);
  }, [loadDoctors]);

  useEffect(() => {
    if (tab === "appointments") loadAppointments();
  }, [tab, loadAppointments]);

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
            <p className="text-ink-muted text-sm mt-1">Find top-rated specialists, research their clinical background, and book instant slots.</p>
          </div>
          <div className="tab-bar">
            <button
              className={`tab-btn ${tab === "book" ? "active" : ""}`}
              onClick={() => setTab("book")}
            >
              🔍 Specialist Directory
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
          <div className="animate-slide-up space-y-6">
            {/* Search & Filter Header Panel */}
            <div className="card p-5 space-y-4 border-glass-border">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search input */}
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint text-sm">🔍</span>
                  <input
                    id="doctor-search-input"
                    className="input pl-10 w-full"
                    placeholder="Search doctor name, specialty, hospital, or clinical expertise..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Secondary Filters */}
                <div className="flex flex-wrap gap-2.5 items-center">
                  <select
                    className="input py-2 px-3 text-xs w-auto"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <option value="All">📍 All Cities</option>
                    {LOCATION_OPTIONS.filter((l) => l !== "All").map((loc) => (
                      <option key={loc} value={loc}>📍 {loc}</option>
                    ))}
                  </select>

                  <select
                    className="input py-2 px-3 text-xs w-auto"
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                  >
                    <option value="All">🌐 All Modes</option>
                    <option value="Online">💻 Online</option>
                    <option value="In-Clinic">🏥 In-Clinic</option>
                  </select>

                  <select
                    className="input py-2 px-3 text-xs w-auto"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="rating">⭐ Top Rated</option>
                    <option value="experience">🏆 Experience</option>
                    <option value="fee_asc">₹ Fee: Low to High</option>
                    <option value="fee_desc">₹ Fee: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Specialty Pills Horizontal Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin pt-1">
                {SPECIALTY_OPTIONS.map((spec) => {
                  const active = selectedSpecialty === spec;
                  return (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialty(spec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                        active
                          ? "bg-accent text-bg-primary shadow-glow-sm scale-105"
                          : "bg-glass hover:bg-glass-light text-ink-muted border border-glass-border hover:border-accent/40"
                      }`}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Count & Status */}
            <div className="flex items-center justify-between px-1 text-xs text-ink-faint">
              <span>
                Showing <strong className="text-ink">{doctors.length}</strong> specialists
                {selectedSpecialty !== "All" ? ` in ${selectedSpecialty}` : ""}
                {selectedLocation !== "All" ? ` in ${selectedLocation}` : ""}
              </span>
              {loadingDoctors && <span className="text-accent animate-pulse">Updating live results...</span>}
            </div>

            {/* Doctors Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctors.map((d) => {
                const displayName = d.name?.startsWith("Dr.") ? d.name : `Dr. ${d.name}`;
                return (
                  <div
                    key={d.id}
                    className="card p-5 flex flex-col group hover:border-accent/40 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Header: Avatar, Name, Rating */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <div
                        className="w-13 h-13 rounded-2xl flex items-center justify-center font-display font-bold text-lg flex-shrink-0 shadow-glow-sm"
                        style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(20,184,166,0.12))" }}
                      >
                        <span className="text-accent">{d.name ? d.name.replace("Dr. ", "").charAt(0) : "D"}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-display font-bold text-base text-ink truncate group-hover:text-accent transition-colors">
                            {displayName}
                          </p>
                        </div>
                        <p className="text-accent text-xs font-semibold mt-0.5 truncate">{d.specialisation}</p>
                        <p className="text-ink-faint text-[11px] mt-0.5 truncate">
                          {d.qualifications || "MBBS, MD"} · {d.experience_years || 10}y exp
                        </p>
                      </div>
                    </div>

                    {/* Hospital & Location Tag */}
                    <div className="text-xs text-ink-muted mb-2.5 flex items-center gap-1.5 truncate">
                      <span>🏥</span>
                      <span className="truncate">{d.hospital_name || "City Hospital"}</span>
                      <span>·</span>
                      <span className="text-ink font-medium shrink-0">📍 {d.location || "Bengaluru"}</span>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-ink-muted text-xs mb-3 line-clamp-2 flex-1 leading-relaxed">
                      {d.bio || "Experienced clinical specialist providing patient-centered therapeutic care."}
                    </p>

                    {/* Quick Badges Row: Rating, Mode, Fee */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-glass border border-glass-border text-xs mb-4">
                      <div className="flex items-center gap-1">
                        <span className="text-amber font-bold">★ {d.rating || "4.9"}</span>
                        <span className="text-ink-faint text-[11px]">({d.review_count || 45})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-ink font-bold text-sm">₹{d.consultation_fee || 800}</span>
                        <span className="text-ink-faint text-[10px] block">{d.consultation_mode?.includes("Online") ? "🌐 Online / Clinic" : "🏥 In-Clinic"}</span>
                      </div>
                    </div>

                    {/* Action Buttons: View Profile + Book */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button
                        onClick={() => setViewingDoctor(d)}
                        className="btn-ghost text-xs py-2 px-3 border border-glass-border hover:border-accent/40 font-semibold"
                      >
                        View Profile
                      </button>
                      <button
                        id={`book-doctor-${d.id}`}
                        className="btn-primary text-xs py-2 px-3 font-semibold shadow-glow-sm"
                        onClick={() => setSelectedDoctor(d)}
                      >
                        Book Slot →
                      </button>
                    </div>
                  </div>
                );
              })}

              {!loadingDoctors && doctors.length === 0 && (
                <div className="col-span-full card p-12 text-center">
                  <p className="text-4xl mb-3">🔍</p>
                  <h3 className="text-lg font-bold text-ink mb-1">No specialists match your filter</h3>
                  <p className="text-ink-muted text-sm max-w-md mx-auto mb-4">
                    Try broadening your specialty or city filter to view our verified medical directory.
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedSpecialty("All");
                      setSelectedLocation("All");
                      setSelectedMode("All");
                    }}
                    className="btn-ghost text-xs px-4 py-2"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              {loadingDoctors && doctors.length === 0 && [...Array(6)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse space-y-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-glass-light" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-glass-light rounded w-3/4" />
                      <div className="h-3 bg-glass-light rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-glass-light rounded" />
                  <div className="h-3 bg-glass-light rounded w-2/3" />
                  <div className="h-10 bg-glass-light rounded-xl" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-glass-light rounded-lg" />
                    <div className="h-8 bg-glass-light rounded-lg" />
                  </div>
                </div>
              ))}
            </div>

            {/* Doctor Profile Detailed Modal */}
            {viewingDoctor && (
              <DoctorProfileModal
                doctor={viewingDoctor}
                onClose={() => setViewingDoctor(null)}
                onBook={(doc) => {
                  setViewingDoctor(null);
                  setSelectedDoctor(doc);
                }}
              />
            )}
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
