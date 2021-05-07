const colors = require('tailwindcss/colors')

module.exports = {
  theme: {
    screens: {
      sm: '640px',
      // => @media (min-width: 640px) { ... }
      md: '768px',
      // => @media (min-width: 768px) { ... }
      lg: '1024px',
      // => @media (min-width: 1024px) { ... }
    },
    colors: {
      // Ignoring yellow, green, teal, pink
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      red: colors.red,
      orange: colors.orange,
      blue: colors.blue,
      indigo: colors.indigo,
      purple: colors.purple,
    },
    extend: {
      colors: {
        'terra-white': '#F7F3ED',
        'terra-light': '#E8DDCB',
        terra: '#CDB380',
        acqua: '#036564',
        'acqua-dark': '#033649',
        abisso: '#031634',
      },
    },
  },
  corePlugins: {
    clear: false,
    cursor: false,
    float: false,
    visibility: false,
    zIndex: false,
  },
  darkMode: false,
  purge: {
    enabled: true,
    content: [
      './_includes/*.njk',
      './_layouts/*.njk',
      './_pages/*.njk',
      './log/*.md',
      './log/entries/*.md',
      './log/photos/*.md',
      './_data/theme.json',
    ],
    options: {
      fontFace: true,
      keyframes: true,
      safelist: ['h[1-5r]', 'blockquote', 'pre', 'code', 'ico-[a-z]'],
    },
    preserveHtmlElements: false,
  },
}
