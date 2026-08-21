import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api, { errorMessage } from "../api";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  useEffect(() => {
    if (user && (user.role === "patient" || user.role === "doctor")) {
      api.get("/api/calendar/status")
        .then(res => setIsCalendarConnected(res.data.connected))
        .catch(() => {});
    }
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const home = user?.role === "patient" ? "/patient" : user?.role === "doctor" ? "/doctor" : "/admin";

  const roleColors = {
    patient: "from-emerald/20 to-emerald/10 text-emerald border-emerald/30",
    doctor:  "from-accent/20 to-accent/10 text-accent border-accent/30",
    admin:   "from-rose/20 to-rose/10 text-rose border-rose/30",
  };

  async function connectCalendar() {
    setCalendarBusy(true);
    try {
      const res = await api.get("/api/calendar/connect");
      window.open(res.data.authorization_url, "_blank", "width=500,height=600");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setCalendarBusy(false);
    }
  }

  return (
    <header className="border-b border-glass-border sticky top-0 z-30" style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(16px)" }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? home : "/login"} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm shadow-glow-sm group-hover:shadow-glow transition-all duration-300"
               style={{ background: "linear-gradient(135deg, #22d3ee, #14b8a6)" }}>
            <span className="text-bg-secondary text-base">⚕</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-ink">Sahayak Health</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            {/* Calendar connect button — shown when Google Calendar is configured and not yet connected */}
            {(user.role === "patient" || user.role === "doctor") && !isCalendarConnected && (
              <button
                onClick={connectCalendar}
                disabled={calendarBusy}
                title="Connect Google Calendar"
                className="btn-ghost btn-sm hidden sm:flex items-center gap-1.5 text-ink-faint hover:text-accent"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-xs">Calendar</span>
              </button>
            )}

            {/* User info */}
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-semibold text-ink leading-tight">{user.name}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r border mt-0.5 capitalize ${roleColors[user.role] || "text-ink-muted"}`}>
                {user.role}
              </span>
            </div>

            {/* Avatar circle */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm border border-glass-border"
                 style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(20,184,166,0.1))" }}>
              <span className="text-accent">{user.name?.[0]?.toUpperCase()}</span>
            </div>

            <button id="logout-btn" onClick={handleLogout} className="btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
