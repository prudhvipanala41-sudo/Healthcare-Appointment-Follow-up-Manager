import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import DoctorLayout from "./DoctorLayout";

export default function DoctorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await api.get("/api/doctor/profile");
      setProfile(res.data);
    } catch (err) {
      console.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put("/api/doctor/profile", profile);
      alert("Profile updated successfully.");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 mb-12">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Doctor Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Update your public profile, qualifications, and consultation details.</p>
        </div>

        <form onSubmit={saveProfile} className="space-y-8">
          
          {/* Personal Info */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-display font-bold text-lg text-slate-900">Personal Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={profile.phone || ""}
                  onChange={e => setProfile({...profile, phone: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Professional Bio</label>
                <textarea 
                  rows="4"
                  value={profile.bio || ""}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  placeholder="A short biography for your public profile..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-display font-bold text-lg text-slate-900">Professional Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Specialisation</label>
                <input 
                  type="text" 
                  value={profile.specialisation || ""}
                  onChange={e => setProfile({...profile, specialisation: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Qualifications</label>
                <input 
                  type="text" 
                  value={profile.qualifications || ""}
                  onChange={e => setProfile({...profile, qualifications: e.target.value})}
                  placeholder="e.g. MBBS, MD"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Years of Experience</label>
                <input 
                  type="number" 
                  value={profile.experience_years || 0}
                  onChange={e => setProfile({...profile, experience_years: parseInt(e.target.value)})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Languages Spoken</label>
                <input 
                  type="text" 
                  value={profile.languages || ""}
                  onChange={e => setProfile({...profile, languages: e.target.value})}
                  placeholder="e.g. English, Hindi, Kannada"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Expertise / Services (Comma separated)</label>
                <input 
                  type="text" 
                  value={profile.expertise || ""}
                  onChange={e => setProfile({...profile, expertise: e.target.value})}
                  placeholder="e.g. Root Canal, Dental Implants"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Consultation Info */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-display font-bold text-lg text-slate-900">Consultation Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Hospital / Clinic Name</label>
                <input 
                  type="text" 
                  value={profile.hospital_name || ""}
                  onChange={e => setProfile({...profile, hospital_name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Location / City</label>
                <input 
                  type="text" 
                  value={profile.location || ""}
                  onChange={e => setProfile({...profile, location: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                <input 
                  type="number" 
                  value={profile.consultation_fee || 0}
                  onChange={e => setProfile({...profile, consultation_fee: parseInt(e.target.value)})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Consultation Modes</label>
                <select
                  value={profile.consultation_mode || "Online & In-Clinic"}
                  onChange={e => setProfile({...profile, consultation_mode: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Online & In-Clinic">Online & In-Clinic</option>
                  <option value="In-Clinic Only">In-Clinic Only</option>
                  <option value="Online Only">Online Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary px-8"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

      </div>
    </DoctorLayout>
  );
}
