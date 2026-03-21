import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: {
          light: '#63B3ED', // Blue-300
          DEFAULT: '#3B82F6', // Blue-500
          dark: '#2563EB', // Blue-700
        },
        secondary: {
          light: '#F6AD55', // Orange-300
          DEFAULT: '#ED8936', // Orange-500
          dark: '#DD6B20', // Orange-700
        },
        danger: {
          DEFAULT: '#EF4444', // Red-500
        },
        success: {
          DEFAULT: '#22C55E', // Green-500
        },
        warning: {
          DEFAULT: '#F59E0B', // Yellow-500
        },
        darkbg: '#1A202C', // Dark background for dashboard
        lightbg: '#F7FAFC', // Light background
        textlight: '#E2E8F0', // Light text on dark bg
        textdark: '#2D3748', // Dark text on light bg
      },
    },
  },
  plugins: [],
};
export default config;