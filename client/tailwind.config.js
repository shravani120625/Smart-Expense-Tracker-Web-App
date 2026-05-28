/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#e4e8f0',
          500: '#6366f1', // Indigo
          600: '#4f46e5',
          700: '#4338ca',
          dark: '#0f172a', // Slate 900
        }
      }
    },
  },
  plugins: [],
}
