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
    function checkStatus() {
      if (user && (user.role === "patient" || user.role === "doctor")) {
        api.get("/api/calendar/status")
          .then(res => setIsCalendarConnected(res.data.connected))
          .catch(() => {});
      }
    }
    checkStatus();

    function handleMessage(e) {
      if (e.data?.type === "CALENDAR_CONNECTED") {
        setIsCalendarConnected(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const home = user?.role === "patient" ? "/patient" : user?.role === "doctor" ? "/doctor" : "/admin";

  const roleColors = {
    patient: "bg-emerald-100 text-emerald-600-700 border-emerald-200",
    doctor:  "bg-blue-100 text-blue-700 border-blue-200",
    admin:   "bg-rose-100 text-rose-600-700 border-rose-200",
  };

  async function connectCalendar() {
    setCalendarBusy(true);
    try {
      const res = await api.get("/api/calendar/connect");
      const popup = window.open(res.data.authorization_url, "_blank", "width=500,height=600");
      const timer = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(timer);
          try {
            const statusRes = await api.get("/api/calendar/status");
            setIsCalendarConnected(statusRes.data.connected);
          } catch {}
        }
      }, 1000);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setCalendarBusy(false);
    }
  }


  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? home : "/login"} className="flex items-center gap-3 group">
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

        {user && (
          <div className="flex items-center gap-4">
            {/* Calendar connect button */}
            {(user.role === "patient" || user.role === "doctor") && !isCalendarConnected && (
              <button
                onClick={connectCalendar}
                disabled={calendarBusy}
                title="Connect Google Calendar"
                className="btn-ghost btn-sm hidden sm:flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Calendar</span>
              </button>
            )}

            {/* User info */}
            <div className="hidden sm:flex flex-col items-end border-r border-slate-200 pr-4 mr-2">
              <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border mt-0.5 ${roleColors[user.role] || "text-slate-500"}`}>
                {user.role}
              </span>
            </div>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 shadow-inner">
                <span className="font-display font-bold text-blue-800 text-sm">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-rose-600-600 transition-colors p-2 rounded-lg hover:bg-rose-50"
                title="Log out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
