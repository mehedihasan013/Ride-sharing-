/** @type {import('tailwindcss').Config} */
// Colors are CSS variables (RGB channels) defined in src/index.css, so opacity modifiers like bg-brand/10 work.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: v('page'),
        surface: v('surface'),
        raised: v('raised'),
        line: v('line'),
        ink: v('ink'),
        'ink-2': v('ink-2'),
        'ink-3': v('ink-3'),
        brand: v('brand'),
        'on-brand': v('on-brand'),
        'brand-text': v('brand-text'),
        danger: v('danger'),
        warning: v('warning'),
        bkash: v('bkash'),
        easybike: v('easybike'),
        cng: v('cng'),
        bike: v('bike'),
        microbus: v('microbus'),
      },
      fontFamily: {
        sans: ['Geist', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        bangla: ['"Hind Siliguri"', 'Geist', 'sans-serif'],
        // Geist Mono has no Bangla glyphs (৳, ০-৯), so Hind Siliguri catches them.
        mono: ['"Geist Mono"', '"Hind Siliguri"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
