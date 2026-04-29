/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        found: "#0c331cff",
        lost: "#460f0fff",
        reportsStart: "#6d28d9",
        reportsStartheader: "#3a1575ff",
        reportsEnd: "#2563eb",
        reportsEndheader: "#0d2860ff",
        foundHover: "#0f3c21aa",
        lostHover: "#751a1aaa",
        foundheader: "#03221bff",
        lostheader: "#300a0aff",
      },
      fontFamily: {
        serifCustom: ["Lora", "Iowan Old Style", "Georgia", "serif"],
      },
    },
    keyframes: {
      slideUp: {
        "0%": {
          opacity: "0",
          transform: "translateY(25px)",
        },
        "100%": {
          opacity: "1",
          transform: "translateY(0)",
        },
      },
    },
    animation: {
      slideUp: "slideUp 0.3s ease-out forwards",
    },
  },
  plugins: [],
};