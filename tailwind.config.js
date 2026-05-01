/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        arena: {
          purple: "#8B5CF6",
          blue: "#3B82F6",
          green: "#10B981",
          red: "#EF4444",
          amber: "#F59E0B",
          cyan: "#06B6D4",
          pink: "#EC4899",
          lime: "#84CC16",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        "mic-pulse": "micPulse 1.5s ease-in-out infinite",
        "dot-pulse": "dotPulse 1.2s ease-in-out infinite",
        spin: "spin 0.8s linear infinite",
      },
      keyframes: {
        micPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)" },
        },
        dotPulse: {
          "0%, 80%, 100%": { opacity: 0.3, transform: "scale(0.8)" },
          "40%": { opacity: 1, transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
