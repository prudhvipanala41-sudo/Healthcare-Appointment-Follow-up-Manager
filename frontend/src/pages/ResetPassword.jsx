import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      navigate("/login?reset=success");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Soft clinical background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-50 blur-3xl"
             style={{ background: "radial-gradient(circle, #dbeafe, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-40 blur-3xl"
             style={{ background: "radial-gradient(circle, #ccfbf1, transparent)" }} />
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
          <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">New Password</h1>
          <p className="text-slate-500 text-sm mt-1.5">Enter your new secure password below.</p>
        </div>

        <div className="card p-7 space-y-5 bg-white border border-slate-200 shadow-elevated rounded-2xl">
          {error && <div className="flex items-center gap-2 text-sm text-rose-600-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3"><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm font-semibold"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

