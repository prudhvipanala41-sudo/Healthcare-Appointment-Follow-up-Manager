import { useState, useEffect } from "react";
import api, { errorMessage } from "../../api";
import DoctorLayout from "./DoctorLayout";

export default function DoctorAvailability() {
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [profRes, leavesRes] = await Promise.all([
        api.get("/api/doctor/profile"),
        api.get("/api/doctor/leaves")
      ]);
      setProfile(profRes.data);
      setLeaves(leavesRes.data);
    } catch (err) {
      console.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveAvailability(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put("/api/doctor/profile", {
        working_start: profile.working_start,
        working_end: profile.working_end,
        working_days: profile.working_days,
        slot_duration_minutes: parseInt(profile.slot_duration_minutes)
      });
      alert("Availability updated successfully.");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function addLeave(e) {
    e.preventDefault();
    if (!leaveDate) return;
    try {
      const res = await api.post("/api/doctor/leaves", { date: leaveDate, reason: leaveReason });
      alert(res.data.message);
      setLeaveDate("");
      setLeaveReason("");
      fetchData(); // Refresh leaves
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  async function removeLeave(id) {
    if (!window.confirm("Are you sure you want to remove this leave?")) return;
    try {
      await api.delete(`/api/doctor/leaves/${id}`);
      setLeaves(leaves.filter(l => l.id !== id));
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  function toggleDay(dayStr) {
    let days = profile.working_days ? profile.working_days.split(",") : [];
    if (days.includes(dayStr)) {
      days = days.filter(d => d !== dayStr);
    } else {
      days.push(dayStr);
    }
    setProfile({ ...profile, working_days: days.sort().join(",") });
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

  const daysOfWeek = [
    { num: "0", label: "Monday" },
    { num: "1", label: "Tuesday" },
    { num: "2", label: "Wednesday" },
    { num: "3", label: "Thursday" },
    { num: "4", label: "Friday" },
    { num: "5", label: "Saturday" },
    { num: "6", label: "Sunday" },
  ];
  const activeDays = profile?.working_days ? profile.working_days.split(",") : [];

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Availability Setup</h1>
          <p className="mt-1 text-sm text-slate-500">Configure your regular working hours and manage ad-hoc leaves.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Regular Schedule */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-display font-bold text-lg text-slate-900">Regular Schedule</h2>
            </div>
            <div className="p-6">
              <form onSubmit={saveAvailability} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day.num}
                        type="button"
                        onClick={() => toggleDay(day.num)}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold border transition-colors ${
                          activeDays.includes(day.num) 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
                    <input 
                      type="time" 
                      required
                      value={profile.working_start}
                      onChange={e => setProfile({...profile, working_start: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
                    <input 
                      type="time" 
                      required
                      value={profile.working_end}
                      onChange={e => setProfile({...profile, working_end: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Slot Duration (minutes)</label>
                  <select 
                    value={profile.slot_duration_minutes}
                    onChange={e => setProfile({...profile, slot_duration_minutes: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="15">15 mins</option>
                    <option value="20">20 mins</option>
                    <option value="30">30 mins</option>
                    <option value="45">45 mins</option>
                    <option value="60">60 mins</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary w-full justify-center"
                >
                  {saving ? "Saving..." : "Save Schedule"}
                </button>
              </form>
            </div>
          </div>

          {/* Ad-Hoc Leaves */}
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-display font-bold text-lg text-slate-900">Mark Leave / Holiday</h2>
                <p className="text-xs text-slate-500 mt-1">This will automatically cancel any existing appointments on that date.</p>
              </div>
              <div className="p-6">
                <form onSubmit={addLeave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      required
                      value={leaveDate}
                      onChange={e => setLeaveDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Reason (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Attending medical conference"
                      value={leaveReason}
                      onChange={e => setLeaveReason(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button type="submit" className="btn-secondary w-full justify-center text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300">
                    Add Leave Date
                  </button>
                </form>
              </div>
            </div>

            {/* Upcoming Leaves */}
            {leaves.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-700 text-sm">Upcoming Leaves</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                  {leaves.map(l => (
                    <li key={l.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{l.leave_date}</p>
                        {l.reason && <p className="text-xs text-slate-500 mt-0.5">{l.reason}</p>}
                      </div>
                      <button 
                        onClick={() => removeLeave(l.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove leave"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </DoctorLayout>
  );
}
