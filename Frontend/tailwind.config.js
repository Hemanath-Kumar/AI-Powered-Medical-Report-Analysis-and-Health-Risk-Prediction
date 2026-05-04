/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981', // Vibrant Green
          dark: '#059669',
          light: '#34D399',
        },
        secondary: {
          DEFAULT: '#009374', // Deep Green
          dark: '#065F46',
          light: '#059669',
        },
        accent: {
          DEFAULT: '#14B8A6', // Bright Teal
          dark: '#0D9488',
          light: '#2DD4BF',
        },
        'healthify-orange': '#FF5A5F',
      },
    },
  },
  plugins: [],
}
