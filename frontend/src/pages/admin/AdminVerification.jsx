import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import AdminLayout from "./AdminLayout";

export default function AdminVerification() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/doctors");
      setDoctors(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/api/admin/doctors/${id}`, { verification_status: status });
      fetchDoctors();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  const filtered = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.specialisation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Doctors & Verification</h1>
            <p className="mt-1 text-sm text-slate-500">Review and verify doctor profiles.</p>
          </div>
          <div className="w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Search doctors..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
           <div className="p-8 text-center text-red-500 font-medium bg-white rounded-xl border border-red-100">
            {error}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Doctor Info</th>
                  <th className="px-6 py-4">Specialisation</th>
                  <th className="px-6 py-4">Hospital</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-xs text-slate-500">{d.email}</div>
                    </td>
                    <td className="px-6 py-4">{d.specialisation}</td>
                    <td className="px-6 py-4">{d.hospital_name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                        d.verification_status.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-800' :
                        d.verification_status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {d.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {d.verification_status.toLowerCase() !== 'verified' && d.verification_status.toLowerCase() !== 'verified specialist' && (
                        <button 
                          onClick={() => updateStatus(d.id, "Verified")}
                          className="text-green-600 hover:text-green-800 font-medium text-sm transition-colors"
                        >
                          Verify
                        </button>
                      )}
                      {d.verification_status.toLowerCase() !== 'rejected' && (
                         <button 
                         onClick={() => updateStatus(d.id, "Rejected")}
                         className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                       >
                         Reject
                       </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No doctors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
