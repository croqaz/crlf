const { DateTime } = require('luxon')

const mdIt = require('markdown-it')
const taskList = require('markdown-it-task-lists')
const htmlmin = require('html-minifier')

const pluginRss = require('@11ty/eleventy-plugin-rss')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

function setupMarkdown() {
  const localSrc = /^\/log|\/about|\/author/
  const md = mdIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
  }).use(taskList, { label: false })

  md.linkify.add('mailto:', null).set({ fuzzyIP: false, fuzzyLink: false, fuzzyEmail: false })

  const defaultRender =
    md.renderer.rules.link_open ||
    function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx]
    const sIndex = token.attrIndex('href')
    const tIndex = token.attrIndex('target')

    // ignore if the link is local
    if (localSrc.test(token.attrs[sIndex][1])) {
      return defaultRender(tokens, idx, options, env, self)
    }

    if (tIndex < 0) {
      token.attrPush(['target', '_blank']) // add new attribute
    } else {
      token.attrs[tIndex][1] = '_blank' // replace value of existing attr
    }
    // pass token to default renderer
    return defaultRender(tokens, idx, options, env, self)
  }

  return md
}

function htmlMinTransform(value, outputPath) {
  if (outputPath.indexOf('.html') > -1) {
    const minified = htmlmin.minify(value, {
      collapseWhitespace: true,
      includeAutoGeneratedTags: false,
      preserveLineBreaks: true,
      removeComments: true,
      keepClosingSlash: false,
      useShortDoctype: true,
      minifyCSS: true,
    })
    return minified
  }
  return value
}

module.exports = function(config) {
  config.addPlugin(pluginRss)
  config.addPlugin(syntaxHighlight)
  config.setDataDeepMerge(true)

  // Universal filters
  config.addFilter('fmtDate', (dateObj, fmt) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(fmt)
  })
  config.addFilter('getReadingTime', text => {
    const wordsPerMinute = 200
    const numberOfWords = text.split(/\s/g).length
    return Math.ceil(numberOfWords / wordsPerMinute)
  })
  config.addFilter('toJSON', value => {
    return JSON.stringify(value)
  })

  // Collections
  const collectionNotesAndArticles = collection => {
    return collection
      .getFilteredByGlob(['log/notes/*.md', 'log/articles/*.md'])
      .filter(c => !c.data.draft && c.data.tags)
  }
  config.addCollection('posts', collectionNotesAndArticles)
  config.addCollection('recentPosts', function (collection) {
    const posts = []
    collectionNotesAndArticles(collection).forEach(c => {
      posts.push(c)
    })
    posts.reverse()
    return posts.slice(0, 5)
  })
  config.addCollection('postList', function(collection) {
    const posts = []
    collectionNotesAndArticles(collection).forEach(c => {
      const { title, date, author, topic, tags } = c.data
      posts.push({ title, date, author, topic, tags })
    })
    return posts
  })
  config.addCollection('tagList', function(collection) {
    const tags = {}
    const sorted = {}
    collectionNotesAndArticles(collection).forEach(c => {
      for (const t of c.data.tags) {
        if (!tags[t]) {
          tags[t] = 1
        } else {
          tags[t] += 1
        }
      }
    })
    for (const t of Object.keys(tags).sort((a, b) => tags[b] - tags[a])) {
      sorted[t] = tags[t]
    }
    return sorted
  })

  // Setups
  config.setLibrary('md', setupMarkdown())

  // Transforms
  config.addTransform('htmlmin', htmlMinTransform)

  // Manual passthrough copy
  config.addPassthroughCopy('css')
  config.addPassthroughCopy('gpg')
  config.addPassthroughCopy('fonts')
  config.addPassthroughCopy('logo')
  config.addPassthroughCopy('log/img')

  // Don't ignore the same files ignored in the git repo
  config.setUseGitIgnore(false)

  return {
    templateFormats: ['njk', 'html', 'md'],
    dir: {
      includes: '_includes',
      layouts: '_layouts',
      output: 'website',
    },
  }
}
