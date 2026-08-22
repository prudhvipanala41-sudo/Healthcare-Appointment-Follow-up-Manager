import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
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
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Soft clinical background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-50 blur-3xl"
             style={{ background: "radial-gradient(circle, #ccfbf1, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-40 blur-3xl"
             style={{ background: "radial-gradient(circle, #dbeafe, transparent)" }} />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-10 my-8">
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
          <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Create account</h1>
          <p className="text-slate-500 text-sm mt-1.5">Book appointments and track your visits</p>
        </div>

        <div className="card p-7 space-y-5 bg-white border border-slate-200 shadow-elevated rounded-2xl">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
              <span>⚠</span> {error}
            </div>
          )}
          <form id="register-form" onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                id="register-name"
                className="input"
                required
                placeholder="Jane Doe"
                value={form.name}
                onChange={update("name")}
              />
            </div>
            <div>
              <label className="label">Email address</label>
              <input
                id="register-email"
                className="input"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
              />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input
                id="register-phone"
                className="input"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={update("phone")}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                id="register-password"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={update("password")}
              />
            </div>
            <button id="register-submit" className="btn-primary w-full py-3" disabled={busy} type="submit">
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-slate-400 mt-2 px-4 leading-relaxed">
          Doctor and admin accounts are created by the clinic — ask your administrator for access.
        </p>
      </div>
    </div>
  );
}
