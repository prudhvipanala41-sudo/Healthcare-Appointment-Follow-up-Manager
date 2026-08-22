import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ ...form, role: "patient" });
      navigate("/login", { state: { message: "Account created successfully! Please log in." } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-body">
      {/* LEFT SIDE - HERO SECTION */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 relative flex-col justify-between overflow-hidden border-r border-slate-200 p-12">
        {/* Soft background elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 -ml-40 -mt-40 w-[600px] h-[600px] rounded-full opacity-50 blur-[80px]" style={{ background: "radial-gradient(circle, #ccfbf1, transparent)" }} />
          <div className="absolute bottom-0 right-0 -mr-40 -mb-40 w-[500px] h-[500px] rounded-full opacity-40 blur-[80px]" style={{ background: "radial-gradient(circle, #dbeafe, transparent)" }} />
        </div>

        <div className="relative z-10 flex-shrink-0 animate-fade-in">
          <Link to="/" className="flex items-center gap-3 group inline-flex">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                <path d="M12 7h5M12 17H7" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M19 12H5" />
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">Sahayak Health</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg animate-slide-up" style={{ animationDelay: "150ms" }}>
          <h1 className="font-display font-bold text-5xl text-slate-900 leading-tight mb-6">
            Join the future of <br />
            <span className="text-blue-600">healthcare.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-12">
            Create an account to book appointments with top-rated specialists, manage your health records, and experience seamless care.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Trusted Specialists</h3>
                <p className="text-slate-500 text-sm">Access to hundreds of verified medical experts.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Easy Booking</h3>
                <p className="text-slate-500 text-sm">Instant appointment scheduling and calendar sync.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistics - Demo labels applied */}
        <div className="relative z-10 grid grid-cols-2 gap-8 pt-8 border-t border-slate-200/60 animate-fade-in" style={{ animationDelay: "700ms" }}>
          <div>
            <p className="font-display font-bold text-2xl text-slate-900">24/7</p>
            <p className="text-sm font-semibold text-slate-500">Care Support (Demo)</p>
          </div>
          <div>
            <p className="font-display font-bold text-2xl text-slate-900">50+</p>
            <p className="text-sm font-semibold text-slate-500">Hospitals (Demo)</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden animate-fade-in">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                <path d="M12 7h5M12 17H7" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M19 12H5" />
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">Sahayak Health</span>
          </Link>
        </div>

        <div className="w-full max-w-md animate-slide-up mt-16 lg:mt-0 py-8">
          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Create account</h2>
            <p className="text-slate-500 mt-2">Sign up as a patient to book appointments and track your visits.</p>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0">!</div>
                {error}
              </div>
            )}
            
            <form id="register-form" onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full name</label>
                <input
                  id="register-name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-slate-400"
                  required
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={update("name")}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
                <input
                  id="register-email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-slate-400"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={update("email")}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone (optional)</label>
                <input
                  id="register-phone"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-slate-400"
                  type="tel"
                  placeholder="+1 234 567 890"
                  value={form.phone}
                  onChange={update("phone")}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="register-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-base font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-slate-400"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={update("password")}
                  />
                  <button 
                    type="button" 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start mt-4 mb-2">
                <input id="terms" type="checkbox" required className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <label htmlFor="terms" className="ml-2 block text-xs text-slate-500">
                  By creating an account, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <button id="register-submit" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-body font-bold text-white transition-all duration-300 transform shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2" disabled={busy} type="submit">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <>
                    Create account 
                    <span aria-hidden="true" className="ml-1 text-lg leading-none">→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          
          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
            Doctor and admin accounts are created by the clinic — ask your administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
}
