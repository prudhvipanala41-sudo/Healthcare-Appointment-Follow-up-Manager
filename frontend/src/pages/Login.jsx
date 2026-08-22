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
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Soft clinical background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-50 blur-3xl"
             style={{ background: "radial-gradient(circle, #dbeafe, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-40 blur-3xl"
             style={{ background: "radial-gradient(circle, #ccfbf1, transparent)" }} />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-xl items-center justify-center bg-blue-600 text-white shadow-md mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              <path d="M12 7h5M12 17H7" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M19 12H5" />
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1.5">Sign in to Sahayak Health Portal</p>
        </div>

        <div className="card p-7 space-y-5 bg-white border border-slate-200 shadow-elevated rounded-2xl">
          {message && (
            <div className="flex items-center gap-2 text-sm text-emerald-600-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <span>✅</span> {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
              <span>⚠</span> {error}
            </div>
          )}
          <form id="login-form" onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                id="login-email"
                className="input"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-500 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                className="input"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button id="login-submit" className="btn-primary w-full py-3" disabled={busy} type="submit">
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          New patient?{" "}
          <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Create an account
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-6 card p-4 text-xs text-slate-400 text-center leading-relaxed">
          <p className="font-semibold text-slate-600 mb-2">Demo accounts (after running seed.py)</p>
          <div className="space-y-1">
            <p><span className="text-rose-600-600">Admin:</span> admin@clinic.com / Admin@123</p>
            <p><span className="text-blue-600">Doctor:</span> dr.asha@clinic.com / Doctor@123</p>
            <p><span className="text-emerald-600-600">Patient:</span> patient@demo.com / Patient@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
