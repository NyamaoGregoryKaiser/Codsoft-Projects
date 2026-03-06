/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5', // Indigo-600
        'primary-dark': '#4338CA', // Indigo-700
        secondary: '#10B981', // Emerald-500
        'secondary-dark': '#047857', // Emerald-700
        danger: '#EF4444', // Red-500
        'danger-dark': '#DC2626', // Red-600
        warning: '#FBBF24', // Amber-400
        info: '#3B82F6', // Blue-500
        'gray-light': '#F3F4F6', // Gray-100
        'gray-medium': '#6B7280', // Gray-500
        'gray-dark': '#1F2937', // Gray-800
      },
    },
  },
  plugins: [],
}