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
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to={user ? home : "/login"} className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              <path d="M12 7h5M12 17H7" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M19 12H5" />
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900 hidden sm:block">Sahayak Health</span>
        </Link>

        {/* Navigation Links for Patients */}
        {user?.role === "patient" && (
          <nav className="hidden md:flex items-center gap-1 mx-4">
            <Link to="/patient" className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">Dashboard</Link>
            <Link to="/patient/doctors" className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">Find a Doctor</Link>
            <Link to="/hospitals" className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">Hospitals</Link>
            <Link to="/patient/appointments" className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">Appointments</Link>
          </nav>
        )}
        
        {/* Fill empty space for other roles or mobile */}
        {user?.role !== "patient" && <div className="flex-1"></div>}

        {user ? (
          <div className="flex items-center gap-4 shrink-0">
            {/* Calendar connect button */}
            {(user.role === "patient" || user.role === "doctor") && !isCalendarConnected && (
              <button
                onClick={connectCalendar}
                disabled={calendarBusy}
                title="Connect Google Calendar"
                className="btn-secondary btn-sm hidden lg:flex items-center gap-2 px-3 py-1.5 font-bold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Connect Calendar</span>
              </button>
            )}

            {/* User info */}
            <div className="hidden sm:flex flex-col items-end border-r border-slate-200 pr-4 mr-1">
              <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md mt-0.5 ${roleColors[user.role] || "text-slate-500"}`}>
                {user.role}
              </span>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm mr-1">
                <span className="font-display font-bold text-blue-700 text-sm">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              
              <Link
                to="/settings"
                className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
                title="Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </Link>

              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-rose-50"
                title="Log out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/login" className="btn-secondary px-5">Log In</Link>
            <Link to="/register" className="btn-primary px-5">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
