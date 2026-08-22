import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import AdminLayout from "./AdminLayout";

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "", location: "", address: "", specialities_text: "",
    contact_phone: "", contact_email: "", website: "", emergency_services: true
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  async function fetchHospitals() {
    try {
      setLoading(true);
      const res = await api.get("/api/hospitals");
      setHospitals(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function openModal(hospital = null) {
    if (hospital) {
      setEditingHospital(hospital.id);
      setFormData({
        name: hospital.name,
        location: hospital.location,
        address: hospital.address,
        specialities_text: hospital.specialities_text,
        contact_phone: hospital.contact_phone,
        contact_email: hospital.contact_email,
        website: hospital.website,
        emergency_services: hospital.emergency_services
      });
    } else {
      setEditingHospital(null);
      setFormData({
        name: "", location: "", address: "", specialities_text: "",
        contact_phone: "", contact_email: "", website: "", emergency_services: true
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingHospital) {
        await api.put(`/api/admin/hospitals/${editingHospital}`, formData);
      } else {
        await api.post("/api/admin/hospitals", formData);
      }
      setIsModalOpen(false);
      fetchHospitals();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this hospital?")) return;
    try {
      await api.delete(`/api/admin/hospitals/${id}`);
      fetchHospitals();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  const filtered = hospitals.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Hospitals</h1>
            <p className="mt-1 text-sm text-slate-500">Manage the hospital directory.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Search hospitals..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-slate-200 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button onClick={() => openModal()} className="btn-primary">
              Add Hospital
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(h => (
              <div key={h.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">{h.name}</h3>
                    <p className="text-slate-500 text-sm mt-1">{h.location}</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                    ★ {h.rating}
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 mb-4 flex-1">
                  <p className="line-clamp-2">{h.specialities_text || "General"}</p>
                  <p className="mt-2 text-xs font-medium text-slate-400">Doctors: {h.doctors_count || 0}</p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button onClick={() => openModal(h)} className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleDelete(h.id)} className="text-sm font-medium text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">
                No hospitals found.
              </div>
            )}
          </div>
        )}

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-display font-bold text-xl">{editingHospital ? "Edit Hospital" : "Add Hospital"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Location (City)</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Specialities</label>
                  <input type="text" value={formData.specialities_text} onChange={e => setFormData({...formData, specialities_text: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                  <input type="text" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="flex items-center space-x-2 mt-6">
                    <input type="checkbox" checked={formData.emergency_services} onChange={e => setFormData({...formData, emergency_services: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-bold text-slate-700">Has Emergency Services</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" className="btn-primary px-6">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
