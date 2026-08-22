import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 group mb-4">
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
              <span className="font-display font-bold text-xl tracking-tight text-white">Sahayak Health</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              Premium healthcare scheduling and management platform for patients, doctors, and hospitals.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Patients</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/patient/doctors" className="hover:text-blue-400 transition-colors">Find a Doctor</Link></li>
              <li><Link to="/patient/appointments" className="hover:text-blue-400 transition-colors">Book Appointment</Link></li>
              <li><Link to="/patient" className="hover:text-blue-400 transition-colors">Patient Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Providers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/doctor" className="hover:text-blue-400 transition-colors">Doctor Portal</Link></li>
              <li><Link to="/admin" className="hover:text-blue-400 transition-colors">Hospital Admin</Link></li>
              <li><Link to="/register" className="hover:text-blue-400 transition-colors">Join our Network</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Legal & Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Sahayak Health. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
