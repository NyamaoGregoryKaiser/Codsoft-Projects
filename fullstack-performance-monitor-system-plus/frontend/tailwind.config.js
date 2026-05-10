/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // Blue-500
        secondary: '#60a5fa', // Blue-400
        accent: '#f97316', // Orange-500
        danger: '#ef4444', // Red-500
        success: '#22c55e', // Green-500
        background: '#f8fafc', // Slate-50
        text: '#1e293b', // Slate-800
        'dark-background': '#0f172a', // Slate-900
        'dark-text': '#f8fafc', // Slate-50
        'card-bg': '#ffffff', // White
        'dark-card-bg': '#1e293b', // Slate-800
      }
    },
  },
  plugins: [],
}