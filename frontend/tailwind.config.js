/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        'primary-light': '#eff6ff',
        dark: '#0f172a',
        card: '#1e293b',
      },
    },
  },
  plugins: [],
}
