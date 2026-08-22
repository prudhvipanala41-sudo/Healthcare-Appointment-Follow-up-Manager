/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      colors: {
        // Clinical light theme tokens
        bg: {
          DEFAULT: "#f8fafc",     // slate-50 (app background)
          secondary: "#ffffff",   // white (cards, panels)
          tertiary: "#f1f5f9",    // slate-100 (subtle sections)
        },
        accent: {
          DEFAULT: "#2563eb",     // blue-600 (primary buttons, links)
          dark:    "#1d4ed8",     // blue-700 (hover states)
          light:   "#eff6ff",     // blue-50 (soft backgrounds)
          teal:    "#0d9488",     // teal-600 (secondary actions)
          green:   "#059669",     // emerald-600 (success states)
        },
        ink: {
          DEFAULT: "#0f172a",     // slate-900 (primary text)
          muted:   "#475569",     // slate-600 (secondary text)
          faint:   "#94a3b8",     // slate-400 (placeholders, borders)
        },
        // Legacy tokens (if needed by some un-updated components)
        paper:   "#ffffff",
        panel:   "#ffffff",
        line:    "#e2e8f0",       // slate-200
      },
      boxShadow: {
        card:   "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "glow-sm": "0 2px 4px rgba(37, 99, 235, 0.15)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

