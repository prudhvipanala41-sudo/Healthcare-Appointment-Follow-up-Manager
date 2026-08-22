import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import api, { errorMessage } from "../api";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  
  // Generic fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Doctor fields
  const [bio, setBio] = useState("");
  const [workingStart, setWorkingStart] = useState("");
  const [workingEnd, setWorkingEnd] = useState("");
  const [slotDuration, setSlotDuration] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (authLoading || !user) return;
    
    const loadProfile = async () => {
      try {
        if (user.role === "doctor") {
          const res = await api.get("/api/doctor/profile");
          setName(res.data.name || "");
          setPhone(user.phone || ""); // Phone comes from user context for now, or we can fetch /api/auth/me
          setBio(res.data.bio || "");
          setWorkingStart(res.data.working_start || "09:00");
          setWorkingEnd(res.data.working_end || "17:00");
          setSlotDuration(res.data.slot_duration_minutes || "20");
        } else {
          const res = await api.get("/api/auth/me");
          setName(res.data.name || "");
          setPhone(res.data.phone || "");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setMessage({ type: "error", text: "Failed to load your profile." });
      } finally {
        setLoading(false);
      }
    };
    
    // For phone number on doctor, we fetch /me first
    if (user.role === "doctor") {
      api.get("/api/auth/me").then(res => setPhone(res.data.phone || "")).catch(() => {});
    }
    
    loadProfile();
  }, [user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      if (user.role === "doctor") {
        await api.put("/api/doctor/profile", {
          name,
          phone,
          bio,
          working_start: workingStart,
          working_end: workingEnd,
          slot_duration_minutes: parseInt(slotDuration, 10) || 20
        });
      } else {
        await api.put("/api/auth/me", { name, phone });
      }
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-body">
        <NavBar />
        <div className="flex-1 grid place-items-center text-slate-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <NavBar />
      
      <main className="flex-1 max-w-3xl w-full mx-auto p-5 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and preferences.</p>
        </div>
        
        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
            {message.type === "success" ? "✅" : "⚠️"} {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input"
                placeholder="+1 234 567 890"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input bg-slate-100 text-slate-500 cursor-not-allowed"
                title="Email cannot be changed"
              />
              <p className="text-xs text-slate-400 mt-1">Contact support if you need to change your email address.</p>
            </div>
          </div>
          
          {user.role === "doctor" && (
            <>
              <div className="border-b border-slate-100 pb-4 mb-4 pt-6">
                <h2 className="text-lg font-bold text-slate-900">Professional Profile</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Biography</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="input min-h-[100px] resize-y"
                    placeholder="Tell patients about your expertise and background..."
                  ></textarea>
                </div>
                
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={workingStart}
                      onChange={e => setWorkingStart(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={workingEnd}
                      onChange={e => setWorkingEnd(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Slot Duration (min)</label>
                    <input
                      type="number"
                      value={slotDuration}
                      onChange={e => setSlotDuration(e.target.value)}
                      className="input"
                      min="10"
                      max="120"
                      step="5"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-8"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
