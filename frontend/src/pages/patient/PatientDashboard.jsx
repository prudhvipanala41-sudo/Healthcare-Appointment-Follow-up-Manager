import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../../components/NavBar";
import api from "../../api";
import { useAuth } from "../../AuthContext";
import DoctorProfileModal from "./DoctorProfileModal";
import BookingModal from "./BookingModal";

const SPECIALTIES = [
  { name: "Cardiology", icon: "❤️" },
  { name: "Neurology", icon: "🧠" },
  { name: "Orthopedics", icon: "🦴" },
  { name: "Dermatology", icon: "🧴" },
  { name: "Pediatrics", icon: "👶" },
  { name: "Gynecology", icon: "🤰" },
  { name: "Oncology", icon: "🎗" },
  { name: "Psychiatry", icon: "🧠" },
];

const TOP_HOSPITALS = [
  { name: "Apollo Hospitals", city: "Hyderabad", rating: 4.8, reviews: 1240, img: "🏥", tags: ["Cardiology", "Oncology"] },
  { name: "Fortis Healthcare", city: "Mumbai", rating: 4.7, reviews: 980, img: "🏥", tags: ["Neurology", "Orthopedics"] },
  { name: "Max Super Speciality", city: "Delhi", rating: 4.9, reviews: 2100, img: "🏥", tags: ["General", "Emergency"] },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [topDoctors, setTopDoctors] = useState([]);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [docRes, journeyRes] = await Promise.all([
          api.get("/api/patient/doctors"),
          api.get("/api/patient/journey")
        ]);
        setTopDoctors(docRes.data.slice(0, 4));
        setJourney(journeyRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Patient";

  return (
    <div className="min-h-screen bg-slate-50 font-body pb-20">
      <NavBar />
      
      {/* 1. HERO SECTION */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
        <div className="max-w-7xl mx-auto px-5 relative z-10">
          <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight mb-3 animate-slide-up">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-lg text-slate-600 mb-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
            Find the right specialist for your healthcare needs.
          </p>
          
          <div className="max-w-3xl relative animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-300 shadow-lg shadow-slate-200/50 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg transition-all"
              placeholder="Search doctors, hospitals, specialties or conditions..."
              onClick={() => { /* Navigation handled via quick actions below for now */ }}
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 space-y-16 -mt-8 relative z-20">
        
        {/* 2. QUICK ACTIONS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <Link to="/patient/doctors" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h3 className="font-bold text-slate-900">Find a Doctor</h3>
            <p className="text-sm text-slate-500 mt-1">Search top specialists</p>
          </Link>
          <Link to="/hospitals" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="font-bold text-slate-900">Hospitals</h3>
            <p className="text-sm text-slate-500 mt-1">Browse top facilities</p>
          </Link>
          <Link to="/patient/appointments" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="font-bold text-slate-900">Appointments</h3>
            <p className="text-sm text-slate-500 mt-1">Manage your visits</p>
          </Link>
          <Link to="/patient/records" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="font-bold text-slate-900">Health Records</h3>
            <p className="text-sm text-slate-500 mt-1">View medical history</p>
          </Link>
        </section>

        {/* 2.5 CARE JOURNEY */}
        {journey && (journey.completed_appointments.length > 0 || journey.follow_ups.length > 0) && (
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-slate-900">Your Care Journey</h2>
            </div>
            
            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-200 pl-2">
              {journey.follow_ups.map((f, i) => (
                <div key={`f-${i}`} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-blue-100 rounded-full border-4 border-white flex items-center justify-center text-blue-600 shadow-sm z-10">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="text-sm font-bold text-blue-600 mb-1 uppercase tracking-wider">Recommended Follow-up</div>
                    <div className="text-lg font-bold text-slate-900">{new Date(f.recommended_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <p className="text-slate-600 mt-2 text-sm">{f.reason || "Routine follow-up"}</p>
                    <button onClick={() => setBookingDoctor({id: f.doctor_id})} className="mt-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
              
              {journey.completed_appointments.slice(0, 3).map((a, i) => (
                <div key={`a-${i}`} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-emerald-100 rounded-full border-4 border-white flex items-center justify-center text-emerald-600 shadow-sm z-10">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-500 mb-1">{a.appointment_date}</div>
                    <div className="text-lg font-bold text-slate-900">Consultation with {a.doctor_name}</div>
                    <div className="text-sm text-slate-600 mt-1">{a.symptoms_text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. SPECIALTY EXPLORER */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">Explore specialties</h2>
            <Link to="/patient/doctors" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">View all →</Link>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
            {SPECIALTIES.map(s => (
              <Link key={s.name} to={`/patient/doctors?specialty=${s.name}`} className="flex-shrink-0 bg-white border border-slate-200 rounded-full px-6 py-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-md transition-all">
                <span className="text-xl">{s.icon}</span>
                <span className="font-semibold text-slate-700">{s.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. TOP SPECIALISTS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">Top specialists near you</h2>
            <Link to="/patient/doctors" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">See all doctors →</Link>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-slate-200 rounded-2xl"></div>
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {topDoctors.map(doctor => (
                <div key={doctor.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 group">
                  <div className="flex gap-5">
                    {/* Doctor Avatar */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-display font-bold text-3xl shadow-inner overflow-hidden">
                        {doctor.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow-sm">
                        <div className="bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">Dr. {doctor.name}</h3>
                      <p className="text-blue-600 font-semibold text-sm">{doctor.specialisation}</p>
                      
                      <div className="mt-2 text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          {doctor.hospital_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {doctor.location}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="font-bold text-slate-700 text-sm">{doctor.rating?.toFixed(1) || "4.8"}</span>
                        <span className="text-slate-400 text-xs ml-1">(120+ reviews)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-5 border-t border-slate-100 flex gap-3">
                    <button 
                      onClick={() => setViewingDoctor(doctor)}
                      className="flex-1 btn-secondary text-sm"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => setBookingDoctor(doctor)}
                      className="flex-1 btn-primary text-sm shadow-md shadow-blue-500/20"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. TOP HOSPITALS (DEMO) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">Verified Hospitals</h2>
            <Link to="/patient/hospitals" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">View all →</Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {TOP_HOSPITALS.map((h, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                <div className="h-32 bg-slate-100 relative">
                  {/* Mock image background */}
                  <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">{h.img}</div>
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verified
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg text-slate-900">{h.name}</h3>
                  <p className="text-slate-500 text-sm mb-3">{h.city}</p>
                  
                  <div className="flex items-center gap-1 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="font-bold text-slate-700 text-sm">{h.rating}</span>
                    <span className="text-slate-400 text-xs ml-1">({h.reviews} Reviews)</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {h.tags.map(t => (
                      <span key={t} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. TRUST & SAFETY */}
        <section className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">Your healthcare information is protected</h2>
          <div className="flex flex-wrap justify-center gap-y-3 gap-x-8 text-slate-600 font-medium">
            <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Verified healthcare professionals</span>
            <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Secure appointment booking</span>
            <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Protected patient information</span>
          </div>
        </section>

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
