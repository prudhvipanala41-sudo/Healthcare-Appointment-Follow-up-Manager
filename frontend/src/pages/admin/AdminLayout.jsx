import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users" },
    { name: "Doctors", path: "/admin/verification" },
    { name: "Hospitals", path: "/admin/hospitals" },
    { name: "Appointments", path: "/admin/appointments" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-body text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 font-display font-bold text-white text-xl border-b border-slate-800">
          Admin Portal
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  active 
                    ? "bg-blue-600 text-white font-medium shadow-sm" 
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="block px-4 py-2 text-sm hover:text-white transition-colors mb-2">
            ← Back to Main Site
          </Link>
          <button 
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white h-16 flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
          <div className="font-display font-bold text-lg">Admin Portal</div>
          <button onClick={logout} className="text-sm text-red-400 font-medium">Logout</button>
        </header>
        
        {/* Mobile Nav */}
        <nav className="md:hidden bg-slate-800 overflow-x-auto whitespace-nowrap px-4 py-3 hide-scrollbar flex space-x-2">
           {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`inline-block px-4 py-2 rounded-full text-sm transition-colors ${
                  active 
                    ? "bg-blue-600 text-white font-medium" 
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {children}
      </main>

    </div>
  );
}
