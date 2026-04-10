/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDF6EC',
        'cream-dark': '#F5EBD8',
        bark: '#2D2016',
        'bark-light': '#8B7355',
        'warm-orange': '#E8A87C',
        'warm-orange-dark': '#D4956A',
        'warm-border': '#E8DFD0',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'img': '12px',
        'btn': '24px',
      },
    },
  },
  plugins: [],
}
