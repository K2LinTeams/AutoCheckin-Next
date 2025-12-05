/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6750A4', // MD3 Purple
        secondary: '#625B71',
        tertiary: '#7D5260',
        error: '#B3261E',
        background: '#FFFBFE',
        surface: '#FFFBFE',
      },
      fontFamily: {
        sans: ['Comfortaa', 'ZCOOL KuaiLe', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
