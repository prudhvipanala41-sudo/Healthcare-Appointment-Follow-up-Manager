import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../api";

export default function HospitalList() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    fetchHospitals();
  }, [search, specialty]);

  async function fetchHospitals() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("location", search);
      if (specialty) params.append("specialty", specialty);
      
      const res = await api.get(`/api/patient/hospitals?${params.toString()}`);
      setHospitals(res.data);
    } catch (err) {
      console.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-slate-900 tracking-tight mb-4">
            Find Top Hospitals
          </h1>
          <p className="text-lg text-slate-600">
            Discover premium healthcare facilities, specialized treatment centers, and trusted clinics near you.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search by location (e.g. Bengaluru)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border-0 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
            />
          </div>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Filter by specialty (e.g. Cardiology)"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="w-full border-0 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse">
                <div className="h-48 bg-slate-200 rounded-2xl mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : hospitals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hospitals.map(h => (
              <Link 
                key={h.id} 
                to={`/hospitals/${h.id}`}
                className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative">
                  {h.image_url ? (
                    <img src={h.image_url} alt={h.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-400 font-medium">No Image</span>
                    </div>
                  )}
                  {h.verification_status.toLowerCase() === 'verified' && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Verified
                    </div>
                  )}
                  {h.emergency_services && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                      24/7 ER
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-display font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{h.name}</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {h.location}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">{h.specialities_text}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">★ {h.rating}</span>
                    <span className="text-xs text-slate-500 font-medium">{h.doctors_count} Doctors</span>
                  </div>
                  <span className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 mb-2">No hospitals found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
            <button 
              onClick={() => {setSearch(""); setSpecialty("");}}
              className="mt-6 text-blue-600 font-medium hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
