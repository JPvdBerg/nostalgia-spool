/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm earthy base
        'brown-dark': '#A87954', // mid-tone accents, borders
        'brown-med': '#C2956E', // icons, secondary text
        'beige-dark': '#D9B491', // soft interactive surfaces
        cream: '#F6EAD2', // main app background
        sand: '#E8D7B3', // secondary backgrounds
        // Spice + contrast
        espresso: '#34210F', // deep text / headings (strong contrast on cream)
        cocoa: '#5A3C22', // secondary deep text
        clay: '#C2542B', // terracotta accent — CTAs, active states, dots
        'clay-dark': '#A23F1C', // accent hover/pressed
        teal: '#2E7D6F', // cool pop for "now playing" cues
      },
      fontFamily: {
        serif: ['Fraunces', 'Lora', 'Gelasio', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 12px 30px -12px rgba(52, 33, 15, 0.35)',
        'soft-lg': '0 24px 60px -20px rgba(52, 33, 15, 0.45)',
        'inner-warm': 'inset 0 2px 10px rgba(52, 33, 15, 0.2)',
        card: '0 1px 0 rgba(255,255,255,0.5) inset, 0 14px 34px -16px rgba(52,33,15,0.45)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out both',
        shimmer: 'shimmer 1.4s infinite',
        // Compositor-only record spin (3.5s/rev). Uses Tailwind's built-in
        // `spin` keyframe; play/pause is toggled via animation-play-state.
        'spin-slow': 'spin 3.5s linear infinite',
      },
    },
  },
  // Accent tokens used in JS-built class strings — keep them in the build.
  safelist: ['bg-clay', 'bg-clay-dark', 'text-clay', 'bg-espresso', 'text-espresso'],
  plugins: [],
}
