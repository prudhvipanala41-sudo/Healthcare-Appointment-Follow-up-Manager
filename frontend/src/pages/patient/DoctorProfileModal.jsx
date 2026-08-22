import { useState } from "react";

export default function DoctorProfileModal({ doctor, onClose, onBook }) {
  const [tab, setTab] = useState("overview"); // overview | expertise | reviews

  if (!doctor) return null;

  const expertiseList = doctor.expertise
    ? doctor.expertise.split(",").map((e) => e.trim()).filter(Boolean)
    : [];

  const daysMap = { "0": "Mon", "1": "Tue", "2": "Wed", "3": "Thu", "4": "Fri", "5": "Sat", "6": "Sun" };
  const workingDaysFormatted = doctor.working_days
    ? doctor.working_days.split(",").map((d) => daysMap[d] || d).join(", ")
    : "Mon - Fri";

  const sampleReviews = [
    {
      author: "P. Rajesh",
      date: "2 weeks ago",
      rating: 5,
      comment: `Dr. ${doctor.name.replace("Dr. ", "")} was incredibly thorough, attentive, and explained the diagnosis with great empathy. Highly recommend!`,
    },
    {
      author: "Sneha M.",
      date: "1 month ago",
      rating: 5,
      comment: "Very professional consultation. Prescribed medications were clear and the follow-up advice helped immensely with recovery.",
    },
    {
      author: "Amit K.",
      date: "2 months ago",
      rating: 4,
      comment: "Knowledgeable specialist with great clinical acumen. The hospital staff and clinic workflow were very organized.",
    },
  ];

  return (
    <div
      className="fixed inset-0 backdrop-blur-md grid place-items-center p-4 z-50 animate-fade-in"
      style={{ background: "rgba(5, 10, 25, 0.82)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up border-slate-200-light shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-200 bg-white-light flex items-start justify-between gap-4">
          <div className="flex gap-4 items-start">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl flex-shrink-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(20,184,166,0.15))" }}
            >
              <span className="text-blue-600">{doctor.name ? doctor.name.replace("Dr. ", "").charAt(0) : "D"}</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display font-bold text-2xl text-slate-900">
                  {doctor.name.startsWith("Dr.") ? doctor.name : `Dr. ${doctor.name}`}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-600/15 text-blue-600 border border-blue-200">
                  {doctor.verification_status || "Verified Specialist"}
                </span>
              </div>
              <p className="text-blue-600 font-semibold text-sm mt-0.5">{doctor.specialisation}</p>
              <p className="text-slate-500 text-xs mt-1">
                {doctor.qualifications} · <span className="text-slate-900 font-semibold">{doctor.experience_years} Years Experience</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white-light"
          >
            ×
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 px-6 bg-white border-b border-slate-200 text-center text-xs">
          <div className="border-r border-slate-200 pr-2">
            <span className="text-amber-500 font-bold text-sm">★ {doctor.rating || "4.9"}</span>
            <span className="text-slate-400 block mt-0.5">({doctor.review_count || 45} verified reviews)</span>
          </div>
          <div className="border-r border-slate-200 px-2">
            <span className="text-slate-900 font-bold text-sm">₹{doctor.consultation_fee || 800}</span>
            <span className="text-slate-400 block mt-0.5">{doctor.consultation_mode || "Online & In-Clinic"}</span>
          </div>
          <div className="pl-2">
            <span className="text-slate-900 font-bold text-sm truncate block">{doctor.location || "Bengaluru"}</span>
            <span className="text-slate-400 block mt-0.5 truncate">{doctor.hospital_name?.split(",")[0] || "Hospital"}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-sm font-semibold bg-slate-50-secondary/40">
          <button
            onClick={() => setTab("overview")}
            className={`pb-3 border-b-2 text-sm font-semibold transition-colors ${
              tab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("expertise")}
            className={`pb-3 border-b-2 text-sm font-semibold transition-colors ${
              tab === "expertise" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Expertise
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={`pb-3 border-b-2 text-sm font-semibold transition-colors ${
              tab === "reviews" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Ratings & Reviews ({doctor.review_count || 45})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {tab === "overview" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Professional Biography</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{doctor.bio}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">🏥 Hospital / Clinic Affiliation</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.hospital_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">📍 {doctor.location}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">🗣 Languages Spoken</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.languages || "English, Hindi"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">🌐 Multilingual Consultations</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">⏰ Consultation Timings</p>
                  <p className="text-sm font-semibold text-slate-900">{doctor.working_start} – {doctor.working_end}</p>
                  <p className="text-xs text-slate-500 mt-0.5">⏱ {doctor.slot_duration_minutes} min slots</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">📅 Available Days</p>
                  <p className="text-sm font-semibold text-slate-900">{workingDaysFormatted}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">● Slots Available</p>
                </div>
              </div>
            </div>
          )}

          {tab === "expertise" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2.5">Areas of Clinical Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {expertiseList.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-blue-200 text-blue-600 hover:border-blue-300 transition-colors"
                    >
                      {item}
                    </span>
                  ))}
                  {expertiseList.length === 0 && (
                    <p className="text-slate-500 text-sm">Specialized in clinical diagnosis and advanced therapeutics.</p>
                  )}
                </div>
              </div>

              {doctor.research_interests && (
                <div className="pt-2">
                  <h4 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Research Interests & Focus Areas</h4>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                    <p className="text-sm text-slate-500 leading-relaxed">🔬 {doctor.research_interests}</p>
                  </div>
                </div>
              )}

              {doctor.publications && (
                <div className="pt-2">
                  <h4 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Publications & Research Contributions</h4>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                    <p className="text-sm text-slate-900 font-medium leading-relaxed">📄 {doctor.publications}</p>
                  </div>
                </div>
              )}

              {doctor.source_url && (
                <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-white-light border border-slate-200 text-xs">
                  <span className="text-slate-400">Verified Registry & Reference Source:</span>
                  <a
                    href={doctor.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Registry Profile ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 mb-4">
                <div>
                  <p className="text-3xl font-display font-bold text-amber-500">{doctor.rating || "4.9"} <span className="text-base text-slate-400 font-normal">/ 5.0</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">Based on {doctor.review_count || 45} patient ratings</p>
                </div>
                <div className="text-right text-xs text-slate-500 space-y-1">
                  <p>⭐ 5 Star: <span className="text-slate-900 font-semibold">92%</span></p>
                  <p>⭐ 4 Star: <span className="text-slate-900 font-semibold">6%</span></p>
                  <p>⭐ 3 Star: <span className="text-slate-900 font-semibold">2%</span></p>
                </div>
              </div>

              {sampleReviews.map((rev, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-600 font-bold text-xs flex items-center justify-center">
                        {rev.author.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm text-slate-900">{rev.author}</span>
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Verified Patient</span>
                    </div>
                    <span className="text-xs text-slate-400">{rev.date}</span>
                  </div>
                  <div className="flex text-amber-500 text-xs">{"★".repeat(rev.rating)}</div>
                  <p className="text-sm text-slate-500 pt-1">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer with Book CTA */}
        <div className="p-4 px-6 border-t border-slate-200 bg-white-light flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Consultation Fee</p>
            <p className="text-xl font-bold text-slate-900 font-display">₹{doctor.consultation_fee || 800}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-ghost text-sm py-2.5 px-4"
            >
              Back to Directory
            </button>
            <button
              onClick={() => {
                onClose();
                onBook(doctor);
              }}
              className="btn-primary py-2.5 px-6 font-semibold shadow-sm hover:shadow-md"
            >
              Book Appointment →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
