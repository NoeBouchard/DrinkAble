export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Drinkable palette — HEX values for Tailwind JIT.
        // Components that need exact OKLCH should consume the matching
        // CSS variables in src/index.css (e.g. var(--sage)).
        bg: '#f6f4ef',        // warm off-white
        sage: '#86a192',      // primary accent
        sageDeep: '#4f6b5c',  // hover/pressed
        sageLight: '#d6e0d9', // fills/surfaces
        ink: '#2d3a33',       // primary text
        inkSoft: '#5d6b64',   // secondary text

        // Legacy "coffee" tokens are removed; old class names should be
        // re-mapped to the sage palette during the Session 5 sweep.
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      ringColor: {
        DEFAULT: '#86a192',
      },
    },
  },
  plugins: [],
}
