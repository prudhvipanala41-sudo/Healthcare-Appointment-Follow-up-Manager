import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import DoctorLayout from "./DoctorLayout";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  
  // Follow-up modal state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpAppointmentId, setFollowUpAppointmentId] = useState(null);
  const [followUpData, setFollowUpData] = useState({ date: "", reason: "" });

  // Complete consultation modal state
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeAppointmentId, setCompleteAppointmentId] = useState(null);
  const [consultationData, setConsultationData] = useState({ notes: "", prescription: "" });

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const res = await api.get("/api/doctor/appointments");
      setAppointments(res.data);
    } catch (err) {
      console.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    if (!window.confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) return;
    try {
      setProcessingId(id);
      const res = await api.post(`/api/doctor/appointments/${id}/status`, { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? res.data : a));
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  const filteredAppointments = appointments.filter(a => {
    if (filter === "all") return true;
    if (filter === "pending") return a.status === "pending";
    if (filter === "upcoming") return a.status === "confirmed";
    if (filter === "completed") return a.status === "completed";
    return true;
  });

  async function handleFollowUpSubmit(e) {
    e.preventDefault();
    try {
      setProcessingId(followUpAppointmentId);
      await api.post(`/api/doctor/appointments/${followUpAppointmentId}/followup`, followUpData);
      setIsFollowUpModalOpen(false);
      setFollowUpAppointmentId(null);
      setFollowUpData({ date: "", reason: "" });
      alert("Follow-up recommended successfully.");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCompleteSubmit(e) {
    e.preventDefault();
    try {
      setProcessingId(completeAppointmentId);
      const res = await api.post(`/api/doctor/appointments/${completeAppointmentId}/notes`, consultationData);
      setAppointments(prev => prev.map(a => a.id === completeAppointmentId ? res.data : a));
      setIsCompleteModalOpen(false);
      setCompleteAppointmentId(null);
      setConsultationData({ notes: "", prescription: "" });
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Appointments</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your schedule and appointment requests.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 inline-flex flex-wrap gap-1">
          {["all", "pending", "upcoming", "completed"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                filter === f 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No appointments found</h3>
              <p className="text-slate-500 text-sm">There are no {filter !== "all" ? filter : ""} appointments to display.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredAppointments.map(appt => (
                <li key={appt.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Patient Info & Time */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 shrink-0">
                        {appt.patient_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-slate-900">{appt.patient_name}</h3>
                          <StatusBadge status={appt.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{appt.appointment_date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{appt.start_time} - {appt.end_time}</span>
                          </div>
                        </div>
                        {appt.symptoms_text && (
                          <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
                            <strong>Symptoms (Raw):</strong> {appt.symptoms_text}
                          </div>
                        )}
                        {appt.previsit_summary && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-slate-700">
                            <div className="flex items-center gap-2 mb-2 font-bold text-blue-900">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              AI Pre-Visit Summary
                            </div>
                            {(() => {
                              try {
                                const summary = JSON.parse(appt.previsit_summary);
                                return (
                                  <div className="space-y-2">
                                    <p><span className="font-medium text-slate-900">Urgency:</span> <span className={summary.urgency === 'High' ? 'text-rose-600 font-bold' : summary.urgency === 'Medium' ? 'text-orange-500 font-bold' : 'text-emerald-600 font-bold'}>{summary.urgency || 'Unknown'}</span></p>
                                    <p><span className="font-medium text-slate-900">Chief Complaint:</span> {summary.chief_complaint}</p>
                                    {summary.suggested_questions && summary.suggested_questions.length > 0 && (
                                      <div>
                                        <span className="font-medium text-slate-900">Suggested Questions:</span>
                                        <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                                          {summary.suggested_questions.map((q, i) => (
                                            <li key={i}>{q}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {appt.previsit_llm_failed && summary.note && (
                                      <p className="text-xs text-rose-500 mt-2 italic">{summary.note}</p>
                                    )}
                                  </div>
                                );
                              } catch (e) {
                                return <p>{appt.previsit_summary}</p>;
                              }
                            })()}
                          </div>
                        )}
                        {appt.postvisit_summary && (
                          <div className="mt-3 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-slate-700">
                            <div className="flex items-center gap-2 mb-2 font-bold text-emerald-900">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              AI Post-Visit Summary
                            </div>
                            <div className="whitespace-pre-line">{appt.postvisit_summary}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:shrink-0 mt-4 md:mt-0">
                      {appt.status === "pending" && (
                        <>
                          <button 
                            onClick={() => updateStatus(appt.id, "confirmed")}
                            disabled={processingId === appt.id}
                            className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => updateStatus(appt.id, "rejected")}
                            disabled={processingId === appt.id}
                            className="btn-secondary py-1.5 px-4 text-sm text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {appt.status === "confirmed" && (
                        <>
                          <button 
                            onClick={() => {
                              setCompleteAppointmentId(appt.id);
                              setIsCompleteModalOpen(true);
                            }}
                            disabled={processingId === appt.id}
                            className="btn-secondary py-1.5 px-4 text-sm text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                          >
                            Mark Completed
                          </button>
                          <button 
                            onClick={() => updateStatus(appt.id, "cancelled")}
                            disabled={processingId === appt.id}
                            className="btn-ghost py-1.5 px-4 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {appt.status === "completed" && (
                        <button 
                          onClick={() => {
                            setFollowUpAppointmentId(appt.id);
                            setIsFollowUpModalOpen(true);
                          }}
                          className="btn-ghost py-1.5 px-4 text-sm text-blue-600 hover:bg-blue-50"
                        >
                          Recommend Follow-up
                        </button>
                      )}
                    </div>

                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Follow-up Modal */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-display font-bold text-xl text-slate-900">Recommend Follow-up</h2>
              <button onClick={() => setIsFollowUpModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleFollowUpSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Recommended Date</label>
                <input 
                  required 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={followUpData.date} 
                  onChange={e => setFollowUpData({...followUpData, date: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reason (Optional)</label>
                <textarea 
                  rows="3"
                  value={followUpData.reason} 
                  onChange={e => setFollowUpData({...followUpData, reason: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 resize-none" 
                  placeholder="e.g. Review blood test results..."
                ></textarea>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsFollowUpModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" disabled={processingId !== null} className="btn-primary px-6 disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Consultation Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h2 className="font-display font-bold text-xl text-emerald-900">Complete Consultation</h2>
              <button onClick={() => setIsCompleteModalOpen(false)} className="text-emerald-400 hover:text-emerald-600 text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Clinical Notes (Required)</label>
                <textarea 
                  required 
                  rows="4"
                  value={consultationData.notes} 
                  onChange={e => setConsultationData({...consultationData, notes: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 resize-none" 
                  placeholder="Enter diagnosis, observations, etc..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Prescription (Optional)</label>
                <textarea 
                  rows="3"
                  value={consultationData.prescription} 
                  onChange={e => setConsultationData({...consultationData, prescription: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 resize-none" 
                  placeholder="e.g. Paracetamol - twice daily for 5 days"
                ></textarea>
                <p className="text-xs text-slate-500 mt-1">We will automatically extract medication reminders from phrases like "twice daily for 5 days".</p>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" disabled={processingId !== null} className="btn-primary bg-emerald-600 hover:bg-emerald-700 px-6 disabled:opacity-50">Mark as Completed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
