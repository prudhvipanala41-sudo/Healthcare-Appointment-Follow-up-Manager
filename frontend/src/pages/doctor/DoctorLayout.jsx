import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function DoctorLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/doctor", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Appointments", href: "/doctor/appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "Patients", href: "/doctor/patients", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { name: "Availability", href: "/doctor/availability", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { name: "Profile", href: "/doctor/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 font-body">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  <path d="M12 7h5M12 17H7" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <path d="M19 12H5" />
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900">Sahayak Health</span>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="px-6 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-700 font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">Dr. {user?.name}</p>
                <p className="text-xs text-slate-500 font-medium">Doctor Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/doctor" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                <path d="M12 7h5M12 17H7" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M19 12H5" />
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-slate-900">Sahayak Health</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 text-slate-500 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
