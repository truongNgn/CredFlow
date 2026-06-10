/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#122019",
        cream: "#f5f1e8",
        lime: "#c9f45b",
        forest: "#173f2a"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(18, 32, 25, 0.10)"
      }
    },
  },
  plugins: [],
}
