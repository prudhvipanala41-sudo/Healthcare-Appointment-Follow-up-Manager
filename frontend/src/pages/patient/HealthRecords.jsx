import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import NavBar from "../../components/NavBar";
import StatusBadge from "../../components/StatusBadge";

export default function HealthRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      setLoading(true);
      const res = await api.get("/api/patient/records");
      setRecords(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body">
      <NavBar />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Health Records</h1>
            <p className="mt-1 text-sm text-slate-500">View your past consultation summaries and prescriptions.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No records found</h3>
            <p className="text-slate-500 max-w-md mx-auto">You do not have any completed consultations yet. Your clinical notes and prescriptions will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* List */}
            <div className="lg:col-span-1 space-y-4">
              {records.map((record) => (
                <div 
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`bg-white p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${selectedRecord?.id === record.id ? 'border-blue-500 shadow-sm ring-1 ring-blue-500' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {new Date(record.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md">Completed</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">Dr. {record.doctor_name}</h3>
                  <p className="text-sm text-slate-500 truncate">{record.specialisation} &bull; {record.hospital_name || "Clinic"}</p>
                </div>
              ))}
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2">
              {selectedRecord ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
                  <div className="px-8 py-6 border-b bg-slate-50/50 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Consultation Summary</h2>
                      <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(selectedRecord.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">Dr. {selectedRecord.doctor_name}</p>
                      <p className="text-sm text-slate-500">{selectedRecord.specialisation}</p>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Doctor Notes */}
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Clinical Notes
                      </h3>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <p className="text-slate-700 whitespace-pre-wrap">{selectedRecord.doctor_notes || "No clinical notes provided."}</p>
                      </div>
                    </section>

                    {/* Prescription */}
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-400 uppercase tracking-widest mb-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        Prescription
                      </h3>
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                        <p className="text-indigo-900 font-medium whitespace-pre-wrap">{selectedRecord.prescription_text || "No prescription provided."}</p>
                      </div>
                    </section>

                    {/* AI Post-visit Summary */}
                    {selectedRecord.postvisit_summary && (
                      <section>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-purple-400 uppercase tracking-widest mb-3">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          AI Patient Summary
                        </h3>
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 shadow-sm">
                          <p className="text-purple-900 font-medium whitespace-pre-wrap">{selectedRecord.postvisit_summary}</p>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-full min-h-[400px] flex items-center justify-center text-slate-400 font-medium p-8 text-center">
                  Select a consultation from the list to view its details.
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
