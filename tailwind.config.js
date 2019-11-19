const { colors } = require('tailwindcss/defaultTheme')

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
        'terra': '#CDB380',
        'acqua': '#036564',
        'acqua-dark': '#033649',
        'abisso': '#031634',
      }
    },
  },
  variants: {},
  corePlugins: {
    cursor: false,
    float: false,
    zIndex: false,
  },
}
