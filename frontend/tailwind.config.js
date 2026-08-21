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
        // Dark theme tokens
        bg: {
          DEFAULT: "#0a0f1e",
          secondary: "#0e1628",
          tertiary: "#141d35",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.05)",
          light: "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.10)",
          "border-light": "rgba(255,255,255,0.18)",
        },
        accent: {
          DEFAULT: "#22d3ee",     // cyan-400
          dark:    "#06b6d4",     // cyan-500
          glow:    "#67e8f9",     // cyan-300
          teal:    "#14b8a6",     // teal-500
          green:   "#10b981",     // emerald-500
        },
        ink: {
          DEFAULT: "#f0f6ff",
          muted:   "#94a3b8",
          faint:   "#475569",
        },
        rose:    "#f43f5e",
        amber:   "#f59e0b",
        emerald: "#10b981",
        // Legacy tokens for backward compat
        paper:   "#0a0f1e",
        panel:   "rgba(14,22,40,0.8)",
        line:    "rgba(255,255,255,0.10)",
      },
      boxShadow: {
        card:   "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow:   "0 0 24px rgba(34,211,238,0.25)",
        "glow-sm": "0 0 12px rgba(34,211,238,0.15)",
        glass:  "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-angular": "conic-gradient(var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, #0a0f1e 0%, #0e1a3a 50%, #0a1628 100%)",
        "accent-gradient": "linear-gradient(135deg, #22d3ee, #14b8a6)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "float":      "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        float:     { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 16px rgba(34,211,238,0.2)" }, "50%": { boxShadow: "0 0 32px rgba(34,211,238,0.5)" } },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
