import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import AdminLayout from "./AdminLayout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/users");
      setUsers(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user? This will delete all associated profiles and appointments.")) {
      return;
    }
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      alert("User deleted.");
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-slate-500">Manage all users across the platform.</p>
          </div>
          <div className="w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Search by name, email, role..." 
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
            <div className="mt-4">
              <button onClick={fetchUsers} className="btn-secondary">Try Again</button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'doctor' ? 'bg-teal-100 text-teal-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{u.phone || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No users found matching "{search}"
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
