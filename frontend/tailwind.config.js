/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: "#080609",
        sidebar: "#050505",
        workspace: "#120A16",
        surface: "#19131D",
        card: "#100D12",
        purple: "#A855F7",
        accent: "#C084FC",
        "text-primary": "#F8F5FA",
        "text-secondary": "#A7A0AE",
        border: "rgba(255,255,255,0.09)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "orb-float": "orb-float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(168, 85, 247, 0.6)" },
        },
        "orb-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
}
