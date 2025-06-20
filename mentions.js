//
// Heavily inspired from Max Böck's webmentions.js:
// https://github.com/maxboeck/mxb/blob/master/src/data/webmentions.js
//
const fs = require('fs')
const url = require('url')
const nodeFetch = require('node-fetch')
const unionBy = require('lodash.unionby')

const domains = ['crlf.site', 'crlf.link']

const CACHE_DIR = '_data'
const API = 'https://webmention.io/api'
const TOKEN = process.env.WEBMENTION_IO_TOKEN

async function fetchWebmentions(since, perPage = 2500) {
  if (!domains || !domains.length) {
    // If we dont have a domain name, abort
    console.warn('Cannot fetch webmentions: no domain name specified in site.json')
    return false
  }

  if (!TOKEN) {
    // If we dont have a domain access token, abort
    console.warn('Cannot fetch webmentions: no access token specified in environment.')
    return false
  }

  let feed = {}
  for (let domain of domains) {
    let url = `${API}/mentions.jf2?domain=${domain}&token=${TOKEN}&per-page=${perPage}`
    if (since) url += `&since=${since}`

    const response = await nodeFetch(url)
    if (response.ok) {
      const r = await response.json()
      console.log(`Fetched ${r.children.length} new webmentions from ${API} for domain ${domain}`)
      feed = { ...feed, ...r }
    } else {
      console.error('Cannot fetch webmentions: ', response)
    }
  }
  return feed
}

// Merge fresh webmentions with cached entries, unique per id
function mergeWebmentions(a, b) {
  return unionBy(a.children, b.children, 'wm-id')
}

// get cache contents from cache file
function readFromCache(legacyWebmentions = { children: [] }) {
  const filePath = `${CACHE_DIR}/_webmentions.json`

  if (fs.existsSync(filePath)) {
    const cacheFile = fs.readFileSync(filePath)
    const cachedWebmentions = JSON.parse(cacheFile)

    // merge cache with wms for legacy domain
    return {
      lastFetched: cachedWebmentions.lastFetched,
      children: mergeWebmentions(legacyWebmentions, cachedWebmentions),
    }
  }

  return {
    lastFetched: null,
    children: legacyWebmentions.children,
  }
}

// save updated webmentions to cache file
function writeToCache(data) {
  const filePath = `${CACHE_DIR}/_webmentions.json`
  const fileContent = JSON.stringify(data, null, 2)
  // write data to cache json file
  fs.writeFile(filePath, fileContent, err => {
    if (err) throw err
    console.log(`>>> ${data.children.length} webmentions cached to ${filePath}`)
  })
}

function processWebmentions(data) {
  // url: { like-of: 0, repost-of: 0, in-reply-to: 0, from:[] }
  const mentions = {}
  for (const c of data.children) {
    const type = c['wm-property']
    const link = c['wm-target']

    let ignore = false
    for (let domain of domains) {
      if (c.url.indexOf(domain) > -1) {
        ignore = true
        break
      }
    }
    if (ignore) continue

    const path = url
      .parse(link)
      .path.replace('/notes/', '/entries/')
      .replace('/articles/', '/entries/')
    console.log(type, ':', path, '<-', c.url)
    if (!mentions[path]) {
      mentions[path] = { from: [] }
    }
    if (!mentions[path][type]) {
      mentions[path][type] = 0
    }
    mentions[path][type] += 1
    mentions[path].from.push(c.url)
  }
  return mentions
}

async function main(refresh = true) {
  let cache = readFromCache()

  if (cache.children.length) {
    console.log(`>>> ${cache.children.length} webmentions loaded from cache`)
  }

  // Only fetch new mentions in production
  if (refresh) {
    const feed = await fetchWebmentions(cache.lastFetched)
    if (feed) {
      const webmentions = {
        lastFetched: new Date().toISOString(),
        children: mergeWebmentions(cache, feed),
      }

      writeToCache(webmentions)
      cache = webmentions
    }
  }

  const outPath = `${CACHE_DIR}/mentions.json`
  const mentions = processWebmentions(cache)
  // write data to cache json file
  fs.writeFile(outPath, JSON.stringify(mentions, null, 2), err => {
    if (err) throw err
    console.log(`>>> ${Object.keys(mentions).length} final mentions saved to ${outPath}`)
  })
}

module.exports = {
  fetchWebmentions,
  readFromCache,
  writeToCache,
  processWebmentions,
  main,
}
