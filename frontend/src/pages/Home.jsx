import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import api from "../api";

export default function Home() {
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch a few doctors for the showcase
    api.get("/api/patient/doctors?sort_by=rating")
      .then(res => {
        setFeaturedDoctors(res.data.slice(0, 3));
      })
      .catch(err => console.error("Failed to load featured doctors", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center pt-24 pb-20 px-5 overflow-hidden">
        {/* Soft background shapes */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] rounded-full opacity-60 blur-[80px]" style={{ background: "radial-gradient(circle, #bfdbfe, transparent)" }} />
          <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[500px] h-[500px] rounded-full opacity-50 blur-[80px]" style={{ background: "radial-gradient(circle, #ccfbf1, transparent)" }} />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-4 mx-auto lg:mx-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              Accepting New Patients
            </div>
            
            <h1 className="font-display font-extrabold text-5xl sm:text-6xl text-slate-900 leading-tight tracking-tight">
              Exceptional care, <br className="hidden sm:block"/>
              <span className="text-blue-600">close to home.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Book appointments with top-rated specialists instantly. Experience world-class medical expertise with the convenience of modern digital healthcare.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link to="/register" className="btn-primary w-full sm:w-auto px-8 py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all">
                Book an Appointment
              </Link>
              <Link to="/login" className="btn-secondary w-full sm:w-auto px-8 py-4 text-base rounded-xl shadow-sm hover:shadow-md transition-all">
                Patient Portal Login
              </Link>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-8 text-slate-500 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-xl">🩺</span> 50+ Specialists
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span> 4.9/5 Average Rating
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block relative animate-fade-in" style={{ animationDelay: "200ms" }}>
             {/* Decorative Hero Image/Card composite */}
             <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-teal-50 rounded-full transform rotate-12 scale-105 opacity-70 blur-2xl"></div>
                <div className="card border-0 shadow-2xl p-2 rounded-[2rem] bg-white/80 backdrop-blur-sm relative z-10 overflow-hidden transform -rotate-3 hover:rotate-0 transition-all duration-500 h-full w-full flex flex-col">
                  <div className="bg-slate-50 flex-1 rounded-[1.5rem] overflow-hidden relative border border-slate-100 flex items-center justify-center">
                    {/* Minimalist medical illustration/placeholder */}
                    <div className="grid grid-cols-2 gap-4 p-8 w-full h-full opacity-60">
                       <div className="bg-blue-200/50 rounded-2xl animate-pulse"></div>
                       <div className="space-y-4">
                          <div className="h-20 bg-teal-200/50 rounded-2xl animate-pulse" style={{ animationDelay: "150ms" }}></div>
                          <div className="h-32 bg-indigo-200/50 rounded-2xl animate-pulse" style={{ animationDelay: "300ms" }}></div>
                       </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="card shadow-2xl p-6 flex items-center gap-4 border-blue-100 animate-slide-up" style={{ animationDelay: "500ms" }}>
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">👨‍⚕️</div>
                        <div>
                          <p className="font-display font-bold text-slate-900 text-lg">Dr. Vikram Sharma</p>
                          <p className="text-blue-600 font-semibold text-sm">Cardiology Specialist</p>
                          <p className="text-slate-400 text-xs mt-1">Available Today at 2:00 PM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <h2 className="font-display font-bold text-3xl text-slate-900 mb-4">Comprehensive Care Departments</h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">We offer a wide range of specialized medical services to cater to all your healthcare needs under one roof.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🫀", name: "Cardiology" },
              { icon: "🧠", name: "Neurology" },
              { icon: "🦴", name: "Orthopedics" },
              { icon: "👶", name: "Pediatrics" },
            ].map((spec, i) => (
              <div key={spec.name} className="card p-6 flex flex-col items-center justify-center gap-4 hover:border-blue-300 group cursor-default" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{spec.icon}</div>
                <h3 className="font-semibold text-slate-900">{spec.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">Meet Our Top Specialists</h2>
              <p className="text-slate-500">Highly rated, experienced, and dedicated to your health.</p>
            </div>
            <Link to="/register" className="hidden sm:inline-flex text-blue-600 font-semibold hover:text-blue-700 items-center gap-1">
              View all specialists <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-6 h-48 animate-pulse bg-white"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredDoctors.map((d, i) => (
                <div key={d.id} className="card p-6 flex flex-col group hover:border-blue-300 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}>
                   <div className="flex items-start gap-4 mb-4">
                     <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl flex-shrink-0 shadow-sm bg-blue-50 text-blue-600">
                       {d.name ? d.name.replace("Dr. ", "").charAt(0) : "D"}
                     </div>
                     <div>
                       <p className="font-display font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                         {d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`}
                       </p>
                       <p className="text-blue-600 text-sm font-semibold">{d.specialisation}</p>
                       <p className="text-amber-500 font-bold text-sm mt-1">★ {d.rating} <span className="text-slate-400 font-normal">({d.review_count} reviews)</span></p>
                     </div>
                   </div>
                   <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed flex-1">
                     {d.bio}
                   </p>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Link to="/register" className="btn-secondary w-full py-3">View all specialists</Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-sm text-center">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white font-display font-bold text-lg">
            <span className="text-blue-500">➕</span> Sahayak Health
          </div>
          <p>© {new Date().getFullYear()} Sahayak Health. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
