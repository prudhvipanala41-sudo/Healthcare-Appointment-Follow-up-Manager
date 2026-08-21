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
      navigate("/patient");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: "radial-gradient(circle, #14b8a6, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
             style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center font-display font-bold text-2xl mb-4 shadow-glow"
               style={{ background: "linear-gradient(135deg, #22d3ee, #14b8a6)" }}>
            <span className="text-bg-secondary">⚕</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Create your account</h1>
          <p className="text-ink-muted text-sm mt-1">Book appointments and track your visits</p>
        </div>

        <div className="card p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose bg-rose/10 border border-rose/20 rounded-xl px-4 py-3">
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

        <p className="text-center text-sm text-ink-muted mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-semibold hover:text-accent-glow transition-colors">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-ink-faint mt-2 px-4">
          Doctor and admin accounts are created by the clinic — ask your administrator for access.
        </p>
      </div>
    </div>
  );
}
