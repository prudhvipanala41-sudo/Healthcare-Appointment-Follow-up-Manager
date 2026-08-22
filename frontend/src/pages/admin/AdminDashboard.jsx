import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/analytics");
      setStats(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-red-500 font-medium">
          {error}
          <div className="mt-4">
            <button onClick={fetchStats} className="btn-secondary">Try Again</button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { label: "Total Patients", value: stats.total_patients, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Doctors", value: stats.total_doctors, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Total Hospitals", value: stats.total_hospitals, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Appointments", value: stats.total_appointments, color: "text-slate-700", bg: "bg-slate-100" },
  ];

  const actionCards = [
    { label: "Today's Appointments", value: stats.todays_appointments },
    { label: "Pending Verifications", value: stats.pending_verifications, alert: stats.pending_verifications > 0 },
    { label: "Completed Consultations", value: stats.completed_consultations },
    { label: "Cancelled Appointments", value: stats.cancelled_appointments },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">System overview and analytics.</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{s.label}</div>
              <div className={`text-3xl sm:text-4xl font-display font-bold ${s.color}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Action Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
           {actionCards.map((s, i) => (
            <div key={i} className={`rounded-2xl border p-6 shadow-sm ${s.alert ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
              <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${s.alert ? 'text-amber-700' : 'text-slate-500'}`}>
                {s.label}
              </div>
              <div className={`text-2xl sm:text-3xl font-display font-bold ${s.alert ? 'text-amber-900' : 'text-slate-900'}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}
