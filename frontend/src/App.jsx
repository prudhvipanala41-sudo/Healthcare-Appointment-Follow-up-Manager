import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorList from "./pages/patient/DoctorList";
import PatientAppointments from "./pages/patient/PatientAppointments";
import HospitalList from "./pages/patient/HospitalList";
import HospitalDetail from "./pages/patient/HospitalDetail";
import HealthRecords from "./pages/patient/HealthRecords";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorAvailability from "./pages/doctor/DoctorAvailability";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminHospitals from "./pages/admin/AdminHospitals";
import AdminVerification from "./pages/admin/AdminVerification";
import Footer from "./components/Footer";

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-900/40 font-body">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-900/40 font-body">Loading…</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/hospitals" element={<HospitalList />} />
          <Route path="/hospitals/:id" element={<HospitalDetail />} />
          
          <Route
            path="/settings"
            element={
              <Protected>
                <Settings />
              </Protected>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <Protected role="patient">
                <PatientDashboard />
              </Protected>
            }
          />
          <Route
            path="/patient/doctors"
            element={
              <Protected role="patient">
                <DoctorList />
              </Protected>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <Protected role="patient">
                <PatientAppointments />
              </Protected>
            }
          />

          <Route
            path="/patient/records"
            element={
              <Protected role="patient">
                <HealthRecords />
              </Protected>
            }
          />
          <Route
            path="/doctor"
            element={
              <Protected role="doctor">
                <DoctorDashboard />
              </Protected>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <Protected role="doctor">
                <DoctorAppointments />
              </Protected>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <Protected role="doctor">
                <DoctorPatients />
              </Protected>
            }
          />
          <Route
            path="/doctor/availability"
            element={
              <Protected role="doctor">
                <DoctorAvailability />
              </Protected>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <Protected role="doctor">
                <DoctorProfile />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected role="admin">
                <AdminDashboard />
              </Protected>
            }
          />
          <Route
            path="/admin/users"
            element={
              <Protected role="admin">
                <AdminUsers />
              </Protected>
            }
          />
          <Route
            path="/admin/hospitals"
            element={
              <Protected role="admin">
                <AdminHospitals />
              </Protected>
            }
          />
          <Route
            path="/admin/verification"
            element={
              <Protected role="admin">
                <AdminVerification />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
