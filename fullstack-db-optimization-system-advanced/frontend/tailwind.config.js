/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Blue-500
        secondary: '#10B981', // Green-500
        accent: '#F59E0B', // Amber-500
        dark: '#1F2937', // Gray-800
        light: '#F3F4F6', // Gray-100
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}