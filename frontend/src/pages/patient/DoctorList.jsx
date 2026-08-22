import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavBar from "../../components/NavBar";
import api, { errorMessage } from "../../api";
import DoctorProfileModal from "./DoctorProfileModal";
import BookingModal from "./BookingModal";

const SPECIALTY_OPTIONS = [
  "All",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "Pediatrics",
  "Gynecology",
  "Oncology",
  "Psychiatry",
  "Gastroenterology",
  "Pulmonology",
  "General Medicine"
];

const LOCATION_OPTIONS = [
  "All", "Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Chennai", "Kolkata", "Ahmedabad"
];

export default function DoctorList() {
  const [searchParams] = useSearchParams();
  const initSpecialty = searchParams.get("specialty") || "All";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState(initSpecialty);
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedMode, setSelectedMode] = useState("All");
  const [sortBy, setSortBy] = useState("rating");

  // Modals
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        search: search.trim() || undefined,
        specialisation: selectedSpecialty !== "All" ? selectedSpecialty : undefined,
        location: selectedLocation !== "All" ? selectedLocation : undefined,
        mode: selectedMode !== "All" ? selectedMode : undefined,
        sort_by: sortBy,
      };
      const res = await api.get("/api/patient/doctors", { params });
      setDoctors(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, selectedSpecialty, selectedLocation, selectedMode, sortBy]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadDoctors();
    }, 250);
    return () => clearTimeout(debounceTimer);
  }, [loadDoctors]);

  return (
    <div className="min-h-screen bg-slate-50 font-body pb-20">
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-5 pt-8 animate-fade-in">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-6">
          <Link to="/patient" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Find a Doctor</span>
        </div>

        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Find your specialist</h1>
          <p className="text-slate-500 mt-2 text-lg">Search and book appointments with top-rated doctors.</p>
        </div>

        {/* Premium Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search doctors, hospitals or expertise..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option disabled>Specialty</option>
              {SPECIALTY_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>

            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option disabled>Location</option>
              {LOCATION_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>

            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            >
              <option disabled>Consultation</option>
              <option value="All">Online + Clinic</option>
              <option value="online">Online Only</option>
              <option value="in_person">Clinic Only</option>
            </select>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
            <span className="text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-full">{doctors.length} specialists available</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium hidden sm:inline">Sort by:</span>
              <select
                className="bg-transparent text-blue-600 font-bold focus:ring-0 cursor-pointer border-none p-0 pr-6"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Top Rated</option>
                <option value="experience">Experience</option>
                <option value="fee">Consultation Fee</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">⚠</div>
            <div>
              <p className="font-bold">Something went wrong</p>
              <p className="text-sm">We couldn't load specialist information. Please try again.</p>
            </div>
          </div>
        )}

        {/* 3-Column Desktop Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex gap-3">
                  <div className="h-10 bg-slate-100 rounded-xl flex-1"></div>
                  <div className="h-10 bg-slate-100 rounded-xl flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🔍</div>
            <h3 className="font-display font-bold text-slate-900 text-2xl mb-2">No specialists found</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">We couldn't find specialists matching your current filters. Try changing your specialty, city or consultation type.</p>
            <button 
              className="btn-secondary px-6"
              onClick={() => {
                setSearch("");
                setSelectedSpecialty("All");
                setSelectedLocation("All");
                setSelectedMode("All");
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-display font-bold text-3xl shadow-inner overflow-hidden">
                        {doctor.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow-sm" title="Verified Specialist">
                        <div className="bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">Dr. {doctor.name}</h3>
                      <p className="text-blue-600 font-bold text-sm mt-0.5">{doctor.specialisation}</p>
                      
                      <div className="mt-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="font-bold text-slate-700 text-sm">{doctor.rating?.toFixed(1) || "4.8"}</span>
                        <span className="text-slate-400 text-xs ml-1">(164 reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-slate-600 mb-6 flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <span className="font-semibold text-slate-700">{doctor.hospital_name}</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{doctor.location}</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>₹{doctor.consultation_fee} per consultation</span>
                  </p>
                  
                  <div className="flex gap-2 pt-2 border-t border-slate-200 mt-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">Online</span>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">In Clinic</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <button 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-body font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md"
                    onClick={() => setViewingDoctor(doctor)}
                  >
                    View Profile
                  </button>
                  <button 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-body font-bold text-white transition-all shadow-sm shadow-blue-500/20 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/30"
                    onClick={() => setBookingDoctor(doctor)}
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODALS */}
      {viewingDoctor && (
        <DoctorProfileModal 
          doctor={viewingDoctor} 
          onClose={() => setViewingDoctor(null)} 
          onBook={(doc) => setBookingDoctor(doc)}
        />
      )}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onSuccess={() => {
            setBookingDoctor(null);
          }}
        />
      )}
    </div>
  );
}
