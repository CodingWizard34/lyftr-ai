/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: "#0d0f17",
        sidebar: "#121420",
        workspace: "#161926",
        surface: "#1e2235",
        card: "#181b2c",
        purple: "#A855F7",
        accent: "#C084FC",
        "text-primary": "#F8F5FA",
        "text-secondary": "#A7A0AE",
        border: "rgba(255,255,255,0.12)",
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
          "0%, 100%": { boxShadow: "0 0 25px rgba(168, 85, 247, 0.35)" },
          "50%": { boxShadow: "0 0 50px rgba(168, 85, 247, 0.7)" },
        },
        "orb-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
}
