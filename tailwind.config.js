/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E40AF",
        "primary-dark": "#1E3A8A",
        accent: "#F97316",
        "accent-dark": "#EA580C",
      },
    },
  },
  plugins: [],
};