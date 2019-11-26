const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    './_includes/*.njk',
    './_layouts/*.njk',
    './_pages/*.njk',
    './log/*.md',
    './log/notes/*.md',
    './log/articles/*.md',
    './_data/theme.json',
  ],
  whitelist: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'blockquote', 'pre', 'code', 'img'],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
})

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('postcss-nested'),
    require('autoprefixer'),
    process.env.NODE_ENV === 'production' && purgecss,
    // ...
  ],
}
