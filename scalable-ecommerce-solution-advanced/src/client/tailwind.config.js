/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
      },
      colors: {
        primary: {
          light: '#6366F1', // Indigo 500
          DEFAULT: '#4F46E5', // Indigo 600
          dark: '#4338CA', // Indigo 700
        },
        secondary: {
          light: '#E5E7EB', // Gray 200
          DEFAULT: '#D1D5DB', // Gray 300
          dark: '#9CA3AF', // Gray 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}