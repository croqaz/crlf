module.exports = {
  plugins: [
    require('tailwindcss'),
    require('postcss-nested'),
    require('autoprefixer'),
    process.env.NODE_ENV === 'production' && purgecss,
    // ...
  ],
}
