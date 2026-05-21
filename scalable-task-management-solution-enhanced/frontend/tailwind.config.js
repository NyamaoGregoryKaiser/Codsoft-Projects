/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#6366F1', // Indigo 500
          DEFAULT: '#4F46E5', // Indigo 600
          dark: '#4338CA',  // Indigo 700
        },
        secondary: {
          light: '#818CF8', // Indigo 400
          DEFAULT: '#6366F1', // Indigo 500
        },
        accent: {
          DEFAULT: '#FBBF24', // Amber 400
        },
        danger: {
          DEFAULT: '#EF4444', // Red 500
        },
        success: {
          DEFAULT: '#22C55E', // Green 500
        },
        warning: {
          DEFAULT: '#FBBF24', // Amber 400
        },
        info: {
          DEFAULT: '#3B82F6', // Blue 500
        },
      }
    },
  },
  plugins: [],
}