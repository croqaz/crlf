const { DateTime } = require('luxon')

const mdIt = require('markdown-it')
const taskList = require('markdown-it-task-lists')
const htmlmin = require('html-minifier')

const pluginRss = require('@11ty/eleventy-plugin-rss')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

function setupMarkdown() {
  const localSrc = /^\/log|\/about|\/author|\/projects/
  const md = mdIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
  }).use(taskList, { label: false })

  md.linkify.add('mailto:', null).set({ fuzzyIP: false, fuzzyLink: false, fuzzyEmail: false })

  const defaultRender =
    md.renderer.rules.link_open ||
    function(tokens, idx, options, _, self) {
      return self.renderToken(tokens, idx, options)
    }

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx]
    const rIndex = token.attrIndex('rel')
    const sIndex = token.attrIndex('href')
    const tIndex = token.attrIndex('target')

    // ignore if the link is local
    if (localSrc.test(token.attrs[sIndex][1])) {
      return defaultRender(tokens, idx, options, env, self)
    }

    if (rIndex < 0) {
      token.attrPush(['rel', 'noopener']) // add new attribute
    } else {
      token.attrs[rIndex][1] += ' noopener' // append value for existing attr
    }
    if (tIndex < 0) {
      token.attrPush(['target', '_blank']) // add new attribute
    } else {
      token.attrs[tIndex][1] += ' _blank' // append value for existing attr
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

function isArticle(entry) {
  // By convention, first tag is the most important
  // so an the first tag=article becomes the category
  return entry.data.tags.indexOf('article') > -1 || entry.template.inputContent.length > 10000
}

module.exports = function(config) {
  config.addPlugin(pluginRss)
  config.addPlugin(syntaxHighlight, {
    templateFormats: ['javascript', 'python', 'ruby', 'go', 'elixir', 'html', 'css', 'json'],
  })
  config.setDataDeepMerge(true)

  // Universal filters
  config.addFilter('rssDate', dateObj => {
    return pluginRss.dateToRfc3339(new Date(dateObj))
  })
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
  const entries = function(collection) {
    return collection
      .getFilteredByGlob('log/entries/*.md')
      .filter(c => !c.data.draft && c.data.tags)
  }
  const noteEntries = function(collection) {
    return entries(collection)
      .filter(c => !isArticle(c))
      .map(c => {
        c.data.topic = 'notes'
        return c
      })
  }
  const longEntries = function(collection) {
    return entries(collection)
      .filter(c => isArticle(c))
      .map(c => {
        c.data.topic = 'articles'
        return c
      })
  }
  const draftEntries = function(collection) {
    return collection
      .getFilteredByGlob('log/entries/*.md')
      .filter(c => c.data.tags && c.data.draft)
  }
  const recentEntries = function(collection, limit = 6) {
    const posts = []
    entries(collection).forEach(c => {
      posts.push(c)
    })
    posts.reverse()
    return posts.slice(0, limit)
  }

  config.addCollection('entries', entries)
  config.addCollection('notes', noteEntries)
  config.addCollection('long', longEntries)
  config.addCollection('recent', recentEntries)
  config.addCollection('drafts', draftEntries)
  config.addCollection('postList', function(collection) {
    const posts = []
    entries(collection).forEach(c => {
      const { title, date, author, topic, tags } = c.data
      posts.push({ title, date, author, topic, tags, url: c.url })
    })
    return posts
  })
  config.addCollection('tagList', function(collection) {
    const tags = {}
    const sorted = {}
    noteEntries(collection).forEach(c => {
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
  config.addPassthroughCopy('icons')
  config.addPassthroughCopy('logo')
  config.addPassthroughCopy('log/img')

  // Don't ignore the same files ignored in the git repo
  config.setUseGitIgnore(false)

  return {
    templateFormats: ['njk', 'md'],
    dir: {
      includes: '_includes',
      layouts: '_layouts',
      output: 'website',
    },
  }
}
