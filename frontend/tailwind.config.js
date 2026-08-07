/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: '#F7F5F2',
        ink: '#1C1B19',
        muted: '#6B665F',
        plum: {
          DEFAULT: '#6E2A3A',
          hover: '#59212E',
          light: '#F5EBEF',
        },
        gold: {
          DEFAULT: '#B08A2E',
          light: '#F8F4EA',
        },
        success: '#2F6E4F',
        error: '#A6402A',
        subtle: '#E7E2DB',
      }
    },
  },
  plugins: [],
}
