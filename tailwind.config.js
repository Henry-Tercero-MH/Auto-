/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#1F2A56', // azul oscuro marca
        accent:     '#E10600', // rojo acento CTA
        highlight:  '#F57C00', // naranja hover/highlight
        background: '#F4F6F8', // gris claro fondo
        'text-main': '#2B2B2B', // texto principal
      },
    },
  },
  plugins: [],
};
