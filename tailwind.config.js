/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'virus-pattern': "url('./assets/background.svg')",
      },
      backgroundColor: {
        'virus-base': '#0A1A2F',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      gradients: {
        'cyber': 'linear-gradient(135deg, #0A1A2F 0%, #1A2A3F 100%)',
      },
    },
  },
  plugins: [],
}