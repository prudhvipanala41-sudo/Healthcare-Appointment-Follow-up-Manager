import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
             style={{ background: "radial-gradient(circle, #14b8a6, transparent)" }} />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center font-display font-bold text-2xl mb-4 shadow-glow"
               style={{ background: "linear-gradient(135deg, #22d3ee, #14b8a6)" }}>
            <span className="text-bg-secondary">⚕</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Welcome back</h1>
          <p className="text-ink-muted text-sm mt-1">Sign in to Sahayak Health</p>
        </div>

        <div className="card p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose bg-rose/10 border border-rose/20 rounded-xl px-4 py-3">
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
              <label className="label">Password</label>
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

        <p className="text-center text-sm text-ink-muted mt-5">
          New patient?{" "}
          <Link to="/register" className="text-accent font-semibold hover:text-accent-glow transition-colors">
            Create an account
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-6 card p-4 text-xs text-ink-faint text-center leading-relaxed">
          <p className="font-semibold text-ink-muted mb-2">Demo accounts (after running seed.py)</p>
          <div className="space-y-1">
            <p><span className="text-rose">Admin:</span> admin@clinic.com / Admin@123</p>
            <p><span className="text-accent">Doctor:</span> dr.asha@clinic.com / Doctor@123</p>
            <p><span className="text-emerald">Patient:</span> patient@demo.com / Patient@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
