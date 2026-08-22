import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../../api";

export default function HospitalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHospital() {
      try {
        setLoading(true);
        const res = await api.get(`/api/patient/hospitals/${id}`);
        setHospital(res.data);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchHospital();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Hospital not found</h2>
          <p className="text-slate-500 mb-6">{error || "The hospital you're looking for doesn't exist."}</p>
          <button onClick={() => navigate("/hospitals")} className="btn-primary w-full">Back to Directory</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body pb-20">
      
      {/* Hero Section */}
      <div className="relative h-[400px] sm:h-[500px] w-full bg-slate-900">
        {hospital.image_url && (
          <img 
            src={hospital.image_url} 
            alt={hospital.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
            <Link to="/hospitals" className="inline-flex items-center text-slate-300 hover:text-white mb-6 transition-colors text-sm font-medium">
              ← Back to Hospitals
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {hospital.verification_status.toLowerCase() === 'verified' && (
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Verified
                </span>
              )}
              {hospital.emergency_services && (
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  24/7 ER
                </span>
              )}
              <span className="bg-slate-800/80 backdrop-blur text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full">
                ★ {hospital.rating} Rating
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight mb-4 leading-tight">
              {hospital.name}
            </h1>
            
            <div className="flex flex-wrap items-center text-slate-300 gap-x-6 gap-y-2 text-sm sm:text-base">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {hospital.address || hospital.location}
              </span>
              {hospital.contact_phone && (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  {hospital.contact_phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Overview & Services) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-display font-bold text-slate-900 mb-4">Overview & Specialties</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                {hospital.name} is a premier healthcare facility located in {hospital.location}. 
                Equipped with state-of-the-art technology and a team of highly qualified medical professionals, 
                we provide comprehensive care across multiple specialties.
              </p>
              
              <div className="flex flex-wrap gap-2">
                {hospital.specialities_text.split(',').map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Doctors List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-slate-900">Affiliated Doctors</h2>
                <span className="text-slate-500 font-medium">{hospital.doctors.length} Specialists</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hospital.doctors.map(d => (
                  <Link key={d.id} to={`/patient/doctors/${d.id}`} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group flex items-center gap-4">
                    <img src={d.image_url || "https://ui-avatars.com/api/?name=" + d.name} alt={d.name} className="w-16 h-16 rounded-full object-cover bg-slate-100" />
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{d.name}</h3>
                      <p className="text-sm text-slate-500">{d.specialisation}</p>
                      <p className="text-xs font-medium text-slate-400 mt-1">{d.experience_years} Yrs Exp • ★ {d.rating}</p>
                    </div>
                  </Link>
                ))}
                {hospital.doctors.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">
                    No doctors currently affiliated with this hospital.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Info Card) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-24">
              <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Contact Information</h3>
              <ul className="space-y-4">
                {hospital.contact_phone && (
                  <li className="flex items-start gap-3 text-slate-600 text-sm">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    <div>
                      <div className="font-bold text-slate-900">Phone</div>
                      <a href={`tel:${hospital.contact_phone}`} className="hover:text-blue-600">{hospital.contact_phone}</a>
                    </div>
                  </li>
                )}
                {hospital.contact_email && (
                  <li className="flex items-start gap-3 text-slate-600 text-sm">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <div>
                      <div className="font-bold text-slate-900">Email</div>
                      <a href={`mailto:${hospital.contact_email}`} className="hover:text-blue-600">{hospital.contact_email}</a>
                    </div>
                  </li>
                )}
                {hospital.website && (
                  <li className="flex items-start gap-3 text-slate-600 text-sm">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                    <div>
                      <div className="font-bold text-slate-900">Website</div>
                      <a href={hospital.website.startsWith('http') ? hospital.website : `https://${hospital.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                        {hospital.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </li>
                )}
              </ul>
              
              <hr className="my-6 border-slate-100" />
              
              <div className="space-y-3">
                <a href={`https://maps.google.com/?q=${hospital.name} ${hospital.address || hospital.location}`} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full justify-center">
                  Get Directions
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
