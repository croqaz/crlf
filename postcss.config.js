const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    './_includes/*.njk',
    './_layouts/*.njk',
    './_pages/*.njk',
    './log/*.md',
    './log/notes/*.md',
    './log/articles/*.md',
  ],
  whitelist: ['hr', 'blockquote', 'pre', 'code'],
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
