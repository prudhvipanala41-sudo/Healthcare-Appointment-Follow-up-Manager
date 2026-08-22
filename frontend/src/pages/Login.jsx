import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "patient" ? "/patient" : user.role === "doctor" ? "/doctor" : "/admin");
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
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] rounded-full opacity-60 blur-[80px]" style={{ background: "radial-gradient(circle, #bfdbfe, transparent)" }} />
          <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[500px] h-[500px] rounded-full opacity-50 blur-[80px]" style={{ background: "radial-gradient(circle, #ccfbf1, transparent)" }} />
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
            Your health. <br />
            Your care. <br />
            <span className="text-blue-600">One connected experience.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-12">
            Sign in to manage your appointments, view your health records, and connect with top specialists across the country.
          </p>

          {/* Decorative Floating Cards */}
          <div className="relative h-48 w-full max-w-sm mb-12 hidden xl:block">
            <div className="absolute top-0 left-0 card p-4 flex items-center gap-4 bg-white/90 backdrop-blur-sm transform rotate-[-4deg] shadow-xl z-20 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">✓</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Appointment Confirmed</p>
                <p className="text-slate-500 text-xs">Today at 2:00 PM</p>
              </div>
            </div>
            <div className="absolute top-16 left-12 card p-4 flex items-center gap-4 bg-white/90 backdrop-blur-sm transform rotate-[3deg] shadow-xl z-10 animate-fade-in" style={{ animationDelay: "500ms" }}>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">D</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Dr. Priya Sundaram</p>
                <p className="text-slate-500 text-xs">Verified Specialist</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics - Demo labels applied */}
        <div className="relative z-10 grid grid-cols-2 gap-8 pt-8 border-t border-slate-200/60 animate-fade-in" style={{ animationDelay: "700ms" }}>
          <div>
            <p className="font-display font-bold text-2xl text-slate-900">10,000+</p>
            <p className="text-sm font-semibold text-slate-500">Patients (Demo)</p>
          </div>
          <div>
            <p className="font-display font-bold text-2xl text-slate-900">500+</p>
            <p className="text-sm font-semibold text-slate-500">Specialists (Demo)</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        
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

        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2">Sign in to your Sahayak Health account</p>
          </div>

          <div className="space-y-5">
            {message && (
              <div className="flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">✓</div>
                {message}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0">!</div>
                {error}
              </div>
            )}
            
            <form id="login-form" onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
                <input
                  id="login-email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-slate-400"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-base font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-slate-400"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Remember me for 30 days
                </label>
              </div>

              <button id="login-submit" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-body font-bold text-white transition-all duration-300 transform shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none" disabled={busy} type="submit">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign in 
                    <span aria-hidden="true" className="ml-1 text-lg leading-none">→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-600">
              New to Sahayak Health?{" "}
              <Link to="/register" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                Create your account
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-8 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500">
            <p className="font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> 
              Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                <p className="font-semibold text-rose-600 mb-1">Admin</p>
                <p>admin@clinic.com<br/>Admin@123</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                <p className="font-semibold text-blue-600 mb-1">Doctor</p>
                <p>dr.asha@clinic.com<br/>Doctor@123</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                <p className="font-semibold text-emerald-600 mb-1">Patient</p>
                <p>patient@demo.com<br/>Patient@123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
