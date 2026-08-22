import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import DoctorLayout from "./DoctorLayout";

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      setLoading(true);
      const res = await api.get("/api/doctor/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
        
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Patient Directory</h1>
            <p className="mt-1 text-sm text-slate-500">View and manage your patient records.</p>
          </div>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
          
          {/* Patient List */}
          <div className={`w-full ${selectedPatient ? 'hidden lg:flex' : 'flex'} lg:w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm flex-col overflow-hidden`}>
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-700 text-sm">All Patients ({filteredPatients.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No patients found.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredPatients.map(p => (
                    <li key={p.id}>
                      <button 
                        onClick={() => setSelectedPatient(p)}
                        className={`w-full text-left p-4 flex items-center gap-4 transition-colors ${selectedPatient?.id === p.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${selectedPatient?.id === p.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate text-sm ${selectedPatient?.id === p.id ? 'text-blue-900' : 'text-slate-900'}`}>{p.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">Last visit: {p.appointments[0]?.appointment_date}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Patient Details */}
          {selectedPatient ? (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/30">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold border border-blue-200 shadow-inner">
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-900">{selectedPatient.name}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {selectedPatient.email}
                      </span>
                      {selectedPatient.phone && (
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {selectedPatient.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Consultation History */}
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Consultation History</h3>
                <div className="space-y-6">
                  {selectedPatient.appointments.map(appt => (
                    <div key={appt.id} className="relative pl-6 border-l-2 border-slate-200 pb-2 last:pb-0 last:border-transparent">
                      <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -left-[7px] top-1"></div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 text-sm">{appt.appointment_date}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {appt.status.toUpperCase()}
                          </span>
                        </div>
                        {appt.symptoms_text && (
                          <div className="mt-2 text-sm">
                            <span className="font-bold text-slate-700">Symptoms:</span>
                            <p className="text-slate-600 mt-1">{appt.symptoms_text}</p>
                          </div>
                        )}
                        {appt.doctor_notes && (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-sm">
                            <span className="font-bold text-slate-700">Clinical Notes:</span>
                            <p className="text-slate-600 mt-1 whitespace-pre-wrap">{appt.doctor_notes}</p>
                          </div>
                        )}
                        {appt.prescription_text && (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-sm">
                            <span className="font-bold text-slate-700">Prescription:</span>
                            <p className="text-slate-600 mt-1 whitespace-pre-wrap font-mono text-xs bg-white p-2 rounded border border-slate-200">{appt.prescription_text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Select a patient</h3>
                <p className="text-slate-500 text-sm">Choose a patient from the list to view their complete history.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </DoctorLayout>
  );
}
