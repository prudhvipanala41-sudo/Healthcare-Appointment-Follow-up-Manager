import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import DoctorLayout from "./DoctorLayout";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
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

  const d = new Date();
  const today = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  const todaysAppointments = appointments.filter(a => a.appointment_date === today);
  const pendingRequests = appointments.filter(a => a.status === "pending");
  const upcomingAppointments = appointments.filter(a => a.appointment_date >= today && a.status === "confirmed");
  const completedAppointments = appointments.filter(a => a.status === "completed");

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Doctor Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening with your practice today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-600 text-sm">Today's Consultations</h3>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-slate-900">{todaysAppointments.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-600 text-sm">Pending Requests</h3>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-slate-900">{pendingRequests.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-600 text-sm">Upcoming (Confirmed)</h3>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-slate-900">{upcomingAppointments.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-600 text-sm">Total Completed</h3>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-slate-900">{completedAppointments.length}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Left Column: Today's Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-slate-900">Today's Schedule</h2>
                <Link to="/doctor/appointments" className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</Link>
              </div>
              <div className="p-0">
                {todaysAppointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p>No appointments scheduled for today.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {todaysAppointments.map(appt => (
                      <li key={appt.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                              {appt.patient_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{appt.patient_name}</p>
                              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{appt.start_time} - {appt.end_time}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <StatusBadge status={appt.status} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pending Requests */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-lg text-slate-900">Pending Requests</h2>
                  {pendingRequests.length > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingRequests.length} new
                    </span>
                  )}
                </div>
              </div>
              <div className="p-0">
                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p>No pending appointment requests.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {pendingRequests.slice(0, 5).map(appt => (
                      <li key={appt.id} className="p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-bold text-slate-900 text-sm">{appt.patient_name}</p>
                          <span className="text-xs font-medium text-slate-500">{appt.appointment_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{appt.start_time}</span>
                        </div>
                        <Link to="/doctor/appointments" className="btn-secondary w-full justify-center py-1.5 text-xs">
                          Review Request
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {pendingRequests.length > 5 && (
                  <div className="p-4 border-t border-slate-100 text-center">
                    <Link to="/doctor/appointments" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                      View all {pendingRequests.length} requests
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DoctorLayout>
  );
}
