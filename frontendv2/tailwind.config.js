/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        found: "#14532d",
        lost: "#7f1d1d",
        reportsStart: "#6d28d9",
        reportsEnd: "#2563eb",
      },
    },
  },
  plugins: [],
};