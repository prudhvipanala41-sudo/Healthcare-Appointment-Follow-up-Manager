import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar";
import api, { errorMessage } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import UrgencyBadge from "../../components/UrgencyBadge";

function safeParseJSON(str) {
  if (!str) return null;
  try {
    const v = typeof str === "string" ? JSON.parse(str) : str;
    return typeof v === "object" && v !== null ? v : null;
  } catch {
    return null;
  }
}

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [symptomDraft, setSymptomDraft] = useState({});

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/patient/appointments");
      setAppointments(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

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
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.post(`/api/patient/appointments/${id}/cancel`);
      await loadAppointments();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function acceptSummary(id) {
    try {
      await api.post(`/api/patient/appointments/${id}/accept_summary`);
      await loadAppointments();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const booked = appointments.filter((a) => a.status === "pending" || a.status === "confirmed").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled" || a.status === "cancelled_by_leave" || a.status === "rejected").length;

  return (
    <div className="min-h-screen bg-slate-50 font-body pb-20">
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-5 pt-8 animate-fade-in">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-6">
          <Link to="/patient" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">My Appointments</span>
        </div>

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Appointments</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage your upcoming visits and view medical history.</p>
          </div>
          <Link to="/patient/doctors" className="btn-primary">
            Book New Appointment
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">⚠</div>
            <div>
              <p className="font-bold">Error loading appointments</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        {!loading && appointments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">📅</div>
              <div>
                <p className="text-3xl font-display font-bold text-slate-900">{booked}</p>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Upcoming</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">✅</div>
              <div>
                <p className="text-3xl font-display font-bold text-slate-900">{completed}</p>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl">❌</div>
              <div>
                <p className="text-3xl font-display font-bold text-slate-900">{cancelled}</p>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Cancelled</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse">
                <div className="flex gap-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-2xl"></div>
                  <div className="flex-1 space-y-4 py-2">
                    <div className="h-5 bg-slate-100 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🗓️</div>
            <h3 className="font-display font-bold text-slate-900 text-2xl mb-2">No appointments yet</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">You haven't booked any appointments. Search for a specialist to get started.</p>
            <Link to="/patient/doctors" className="btn-primary px-8">Find a Doctor</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((appt) => {
              const aiAnalysis = safeParseJSON(appt.previsit_summary);
              const isUpcoming = appt.status === "pending" || appt.status === "confirmed";
              
              const d = new Date(appt.appointment_date);
              const month = d.toLocaleDateString('en-US', { month: 'short' });
              const day = d.getDate();
              const time = appt.start_time.substring(0,5);
              
              return (
                <div key={appt.id} className={`bg-white rounded-3xl border ${isUpcoming ? 'border-blue-200 shadow-md shadow-blue-100' : 'border-slate-200 shadow-sm'} overflow-hidden relative group`}>
                  {isUpcoming && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>}
                  
                  {/* Appt Header */}
                  <div className={`px-8 py-6 border-b ${isUpcoming ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50/50 border-slate-100'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
                    <div className="flex items-center gap-6">
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center min-w-[80px]">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{month}</p>
                        <p className="text-3xl font-display font-bold text-slate-900 leading-none my-1">{day}</p>
                        <p className="text-sm font-semibold text-blue-600">{time}</p>
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-xl mb-1">Dr. {appt.doctor_name}</h3>
                        <p className="text-slate-600 flex items-center gap-2 font-medium">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          {appt.hospital_name || "Clinic"}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${appt.consultation_mode === 'Online' || appt.consultation_mode === 'Online & In-Clinic' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {appt.consultation_mode === 'Online' || appt.consultation_mode === 'Online & In-Clinic' ? 'Video Call' : 'In Clinic'}
                          </span>
                          <StatusBadge status={appt.status} />
                        </div>
                      </div>
                    </div>
                    
                    {isUpcoming && (
                      <div className="flex flex-row md:flex-col gap-3 shrink-0">
                        {appt.consultation_mode === "online" && (
                          <a href={appt.meet_link} target="_blank" rel="noreferrer" className="btn-primary w-full shadow-md shadow-blue-500/20 text-center">
                            Join Video Call
                          </a>
                        )}
                        <button className="btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 w-full" onClick={() => cancelAppointment(appt.id)}>
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Appt Body */}
                  <div className="px-8 py-6">
                    {/* Symptoms Input */}
                    {isUpcoming && !appt.symptoms_text && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-2 flex flex-col md:flex-row gap-6 items-start shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shrink-0">💡</div>
                        <div className="flex-1 w-full">
                          <h4 className="font-display font-bold text-amber-900 text-lg mb-1">Help your doctor prepare</h4>
                          <p className="text-amber-700 mb-4 font-medium">Describe your symptoms beforehand to receive an AI-assisted initial analysis. This is secure and only shared with your doctor.</p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              className="input flex-1 border-amber-300 focus:border-amber-500 focus:ring-amber-500/20 bg-white shadow-sm"
                              placeholder="E.g., I've had a headache and mild fever since yesterday..."
                              value={symptomDraft[appt.id] || ""}
                              onChange={(e) => setSymptomDraft({ ...symptomDraft, [appt.id]: e.target.value })}
                            />
                            <button className="btn bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md font-bold px-6 shrink-0 transition-all" onClick={() => submitSymptoms(appt.id)}>
                              Analyze Symptoms
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Symptoms Display */}
                    {appt.symptoms_text && (
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Reported Symptoms</h4>
                        <p className="text-slate-800 bg-slate-50 p-4 rounded-xl font-medium border border-slate-200">{appt.symptoms_text}</p>
                      </div>
                    )}

                    {/* AI Analysis Display */}
                    {aiAnalysis && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-2 shadow-sm">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h4 className="font-display font-bold text-indigo-900 text-lg">AI Health Assistant Analysis</h4>
                          </div>
                          {aiAnalysis.urgency && <UrgencyBadge urgency={aiAnalysis.urgency} />}
                        </div>
                        
                        {aiAnalysis.chief_complaint && (
                          <div className="bg-white rounded-xl p-4 mb-4 border border-indigo-50 shadow-sm">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Chief Complaint</span>
                            <span className="font-semibold text-slate-800">{aiAnalysis.chief_complaint}</span>
                          </div>
                        )}
                        
                        {aiAnalysis.recommended_questions?.length > 0 && (
                          <div>
                            <p className="text-sm font-bold text-indigo-800 mb-3">Recommended questions to ask your doctor:</p>
                            <ul className="space-y-2">
                              {aiAnalysis.recommended_questions.map((q, i) => (
                                <li key={i} className="text-indigo-900 bg-white/60 p-3 rounded-lg border border-indigo-100 font-medium flex gap-3">
                                  <span className="text-indigo-400">?</span>
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Diagnosis / Prescription (Completed or Review) */}
                    {(appt.status === "completed" || appt.status === "patient_review") && (appt.doctor_notes || appt.prescription_text || appt.postvisit_summary) && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        {appt.status === "patient_review" && (
                          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <h4 className="font-bold text-amber-900 mb-2">Doctor has sent the consultation summary for your review</h4>
                            <p className="text-amber-800 text-sm mb-4">Please review the clinical notes, prescription, and AI-generated summary below. Once reviewed, click accept to formally complete the appointment.</p>
                            <button onClick={() => acceptSummary(appt.id)} className="btn bg-emerald-600 text-white hover:bg-emerald-700 px-6 font-bold shadow-md">
                              Accept Summary & Complete Appointment
                            </button>
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-6">
                          {appt.doctor_notes && (
                            <div>
                              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="text-emerald-500">⚕️</span> Clinical Notes
                              </h4>
                              <p className="text-slate-800 bg-emerald-50 p-4 rounded-xl border border-emerald-100 font-medium whitespace-pre-line">{appt.doctor_notes}</p>
                            </div>
                          )}
                          {appt.prescription_text && (
                            <div>
                              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="text-blue-500">💊</span> Prescription
                              </h4>
                              <p className="text-slate-800 bg-blue-50 p-4 rounded-xl border border-blue-100 font-medium whitespace-pre-line leading-relaxed">{appt.prescription_text}</p>
                            </div>
                          )}
                        </div>
                        {appt.postvisit_summary && (
                          <div className="mt-6">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <span className="text-indigo-500">🤖</span> AI Post-Visit Summary
                            </h4>
                            <p className="text-slate-800 bg-indigo-50 p-4 rounded-xl border border-indigo-100 font-medium whitespace-pre-line leading-relaxed">{appt.postvisit_summary}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
