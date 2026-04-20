export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf8f6',
          100: '#f5f1ed',
          200: '#e8dfd6',
          300: '#dac9bb',
          400: '#c5a87e',
          500: '#8b6f47',
          600: '#6b5436',
          700: '#4a3a28',
          800: '#2d251e',
          900: '#1a1410',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
