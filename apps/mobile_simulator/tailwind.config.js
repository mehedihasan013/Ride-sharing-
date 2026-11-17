/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B131E',
        card: '#111C2D',
        cardHover: '#16243A',
        emeraldBd: '#006A4E',
        emeraldVibrant: '#10B981',
        crimsonBd: '#F42A41',
        bkash: '#E2136E',
        bidAmber: '#F59E0B',
      },
      fontFamily: {
        sans: ['"Inter"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        bangla: ['"Hind Siliguri"', '"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
