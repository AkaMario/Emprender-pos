const plugin = require('tailwindcss/plugin');
const palette = require('./constants/color-tokens.json');
const variables = (colors) => Object.fromEntries(Object.entries(colors).flatMap(([name, hex]) => [
  [`--color-${name}`, hex.slice(1).match(/../g).map((part) => parseInt(part, 16)).join(' ')],
  [`--theme-${name}`, hex],
]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(Object.keys(palette.light).map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`])),
    },
  },
  plugins: [plugin(({ addBase }) => addBase({
    ':root': variables(palette.light),
    '@media (prefers-color-scheme: dark)': { ':root': variables(palette.dark) },
  }))],
};
