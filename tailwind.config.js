/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'virus-pattern': "url('./src/assets/background.svg')",
      },
      backgroundColor: {
        'virus-base': '#E1F5FE',
      }
    },
  },
  plugins: [],
}