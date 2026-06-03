/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        accent: "#a78bfa",
        "accent-bright": "#7c3aed",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px) blur(8px)" },
          "100%": { opacity: "1", transform: "translateY(0) blur(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.32,0.72,0,1) forwards",
        "scale-in": "scale-in 0.5s cubic-bezier(0.32,0.72,0,1) forwards",
      },
    },
  },
  plugins: [],
};
