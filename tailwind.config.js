/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brown-dark': '#A87954', // primary text, deep accents, active states
        'brown-med': '#C2956E', // borders, icons, secondary text
        'beige-dark': '#D9B491', // interactive elements, hover states, cards
        cream: '#F6EAD2', // main app background
        sand: '#E8D7B3', // secondary backgrounds, tracklist container
      },
      fontFamily: {
        serif: ['Fraunces', 'Lora', 'Gelasio', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 12px 30px -12px rgba(168, 121, 84, 0.45)',
        'soft-lg': '0 24px 60px -20px rgba(168, 121, 84, 0.55)',
        'inner-warm': 'inset 0 2px 10px rgba(168, 121, 84, 0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out both',
      },
    },
  },
  plugins: [],
}
