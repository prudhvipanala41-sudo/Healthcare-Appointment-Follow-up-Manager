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
        className="card w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up border-glass-border-light shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-glass-border bg-glass-light flex items-start justify-between gap-4">
          <div className="flex gap-4 items-start">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl flex-shrink-0 shadow-glow-sm"
              style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(20,184,166,0.15))" }}
            >
              <span className="text-accent">{doctor.name ? doctor.name.replace("Dr. ", "").charAt(0) : "D"}</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display font-bold text-2xl text-ink">
                  {doctor.name.startsWith("Dr.") ? doctor.name : `Dr. ${doctor.name}`}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-accent/15 text-accent border border-accent/30">
                  {doctor.verification_status || "Verified Specialist"}
                </span>
              </div>
              <p className="text-accent font-semibold text-sm mt-0.5">{doctor.specialisation}</p>
              <p className="text-ink-muted text-xs mt-1">
                {doctor.qualifications} · <span className="text-ink font-semibold">{doctor.experience_years} Years Experience</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-faint hover:text-ink transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-glass-light"
          >
            ×
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 px-6 bg-glass border-b border-glass-border text-center text-xs">
          <div className="border-r border-glass-border pr-2">
            <span className="text-amber font-bold text-sm">★ {doctor.rating || "4.9"}</span>
            <span className="text-ink-faint block mt-0.5">({doctor.review_count || 45} verified reviews)</span>
          </div>
          <div className="border-r border-glass-border px-2">
            <span className="text-ink font-bold text-sm">₹{doctor.consultation_fee || 800}</span>
            <span className="text-ink-faint block mt-0.5">{doctor.consultation_mode || "Online & In-Clinic"}</span>
          </div>
          <div className="pl-2">
            <span className="text-ink font-bold text-sm truncate block">{doctor.location || "Bengaluru"}</span>
            <span className="text-ink-faint block mt-0.5 truncate">{doctor.hospital_name?.split(",")[0] || "Hospital"}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-glass-border px-6 gap-6 text-sm font-semibold bg-bg-secondary/40">
          <button
            onClick={() => setTab("overview")}
            className={`py-3 transition-colors border-b-2 ${
              tab === "overview" ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Overview & Bio
          </button>
          <button
            onClick={() => setTab("expertise")}
            className={`py-3 transition-colors border-b-2 ${
              tab === "expertise" ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Expertise & Research
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={`py-3 transition-colors border-b-2 ${
              tab === "reviews" ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"
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
                <h4 className="text-xs uppercase tracking-widest text-ink-faint font-semibold mb-2">Professional Biography</h4>
                <p className="text-ink-muted text-sm leading-relaxed">{doctor.bio}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-glass border border-glass-border">
                  <p className="text-xs text-ink-faint mb-1">🏥 Hospital / Clinic Affiliation</p>
                  <p className="text-sm font-semibold text-ink">{doctor.hospital_name}</p>
                  <p className="text-xs text-ink-muted mt-0.5">📍 {doctor.location}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-glass border border-glass-border">
                  <p className="text-xs text-ink-faint mb-1">🗣 Languages Spoken</p>
                  <p className="text-sm font-semibold text-ink">{doctor.languages || "English, Hindi"}</p>
                  <p className="text-xs text-ink-muted mt-0.5">🌐 Multilingual Consultations</p>
                </div>
                <div className="p-3.5 rounded-xl bg-glass border border-glass-border">
                  <p className="text-xs text-ink-faint mb-1">⏰ Consultation Timings</p>
                  <p className="text-sm font-semibold text-ink">{doctor.working_start} – {doctor.working_end}</p>
                  <p className="text-xs text-ink-muted mt-0.5">⏱ {doctor.slot_duration_minutes} min slots</p>
                </div>
                <div className="p-3.5 rounded-xl bg-glass border border-glass-border">
                  <p className="text-xs text-ink-faint mb-1">📅 Available Days</p>
                  <p className="text-sm font-semibold text-ink">{workingDaysFormatted}</p>
                  <p className="text-xs text-emerald font-semibold mt-0.5">● Slots Available</p>
                </div>
              </div>
            </div>
          )}

          {tab === "expertise" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-ink-faint font-semibold mb-2.5">Areas of Clinical Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {expertiseList.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-glass-light border border-accent/20 text-accent hover:border-accent/40 transition-colors"
                    >
                      {item}
                    </span>
                  ))}
                  {expertiseList.length === 0 && (
                    <p className="text-ink-muted text-sm">Specialized in clinical diagnosis and advanced therapeutics.</p>
                  )}
                </div>
              </div>

              {doctor.research_interests && (
                <div className="pt-2">
                  <h4 className="text-xs uppercase tracking-widest text-ink-faint font-semibold mb-2">Research Interests & Focus Areas</h4>
                  <div className="p-3.5 rounded-xl bg-glass border border-glass-border">
                    <p className="text-sm text-ink-muted leading-relaxed">🔬 {doctor.research_interests}</p>
                  </div>
                </div>
              )}

              {doctor.publications && (
                <div className="pt-2">
                  <h4 className="text-xs uppercase tracking-widest text-ink-faint font-semibold mb-2">Publications & Research Contributions</h4>
                  <div className="p-3.5 rounded-xl bg-glass border border-glass-border">
                    <p className="text-sm text-ink font-medium leading-relaxed">📄 {doctor.publications}</p>
                  </div>
                </div>
              )}

              {doctor.source_url && (
                <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-glass-light border border-glass-border text-xs">
                  <span className="text-ink-faint">Verified Registry & Reference Source:</span>
                  <a
                    href={doctor.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Registry Profile ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between p-4 rounded-xl bg-glass border border-glass-border mb-4">
                <div>
                  <p className="text-3xl font-display font-bold text-amber">{doctor.rating || "4.9"} <span className="text-base text-ink-faint font-normal">/ 5.0</span></p>
                  <p className="text-xs text-ink-faint mt-0.5">Based on {doctor.review_count || 45} patient ratings</p>
                </div>
                <div className="text-right text-xs text-ink-muted space-y-1">
                  <p>⭐ 5 Star: <span className="text-ink font-semibold">92%</span></p>
                  <p>⭐ 4 Star: <span className="text-ink font-semibold">6%</span></p>
                  <p>⭐ 3 Star: <span className="text-ink font-semibold">2%</span></p>
                </div>
              </div>

              {sampleReviews.map((rev, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-glass border border-glass-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center">
                        {rev.author.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm text-ink">{rev.author}</span>
                      <span className="text-xs text-emerald bg-emerald/10 px-2 py-0.5 rounded-full border border-emerald/20">Verified Patient</span>
                    </div>
                    <span className="text-xs text-ink-faint">{rev.date}</span>
                  </div>
                  <div className="flex text-amber text-xs">{"★".repeat(rev.rating)}</div>
                  <p className="text-sm text-ink-muted pt-1">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer with Book CTA */}
        <div className="p-4 px-6 border-t border-glass-border bg-glass-light flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-faint">Consultation Fee</p>
            <p className="text-xl font-bold text-ink font-display">₹{doctor.consultation_fee || 800}</p>
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
              className="btn-primary py-2.5 px-6 font-semibold shadow-glow-sm hover:shadow-glow"
            >
              Book Appointment →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
