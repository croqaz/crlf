/**
 * This is a TwoFold 2✂f module that provides
 * tags for my Cr;Lf; personal blog.
 */

import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";

import { marked } from "marked";
import { minify } from "html-minifier-next";
import markedLinkifyIt from "marked-linkify-it";

// TwoFold dependencies
import Runtime from "./twofold/src/runtime.ts";
import { TemplateEngine } from "./twofold/src/tmpl.ts";
import { DiskCache } from "./twofold/src/cache.ts";

type Params = Record<string, any>;

const diskCache = new DiskCache("cache");
const TTL = 1000 * 60 * 60 * 24; // 1 day
const HOME_DIR = homedir();

marked.use({ breaks: true, gfm: true }, markedLinkifyIt());

function toTitleCase(s: string) {
  return s.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
  );
}

function formatDate(dateObj, fmtText) {
  // Ensure dateObj is a Date object
  if (!(dateObj instanceof Date)) {
    return;
  }

  const utcDate = new Date(dateObj.toUTCString());
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate();
  const weekday = utcDate.getUTCDay();

  const monthsShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper to pad numbers
  const pad = (num, size) => String(num).padStart(size, "0");

  // Format mapping
  const formatMap = {
    yyyy: year,
    yy: String(year).slice(-2),
    LLL: monthsShort[month],
    LL: pad(month + 1, 2),
    L: month + 1,
    dd: pad(day, 2),
    d: day,
    ccc: daysShort[weekday],
  };

  // Replace format tokens
  let result = fmtText;
  for (const [token, value] of Object.entries(formatMap)) {
    result = result.replace(token, value);
  }

  return result;
}

export function markdown(_t: string, args: Params): string {
  /*
   * 2✂︎f tag that renders markdown to HTML.
   */
  let src = args.src || args.file || args.path;
  if (!src) {
    console.warn("No source file provided for the Markdown tag.");
    return "";
  }
  if (src[0] === "~") {
    src = src.replace(/^~(?=$|\/|\\)/, HOME_DIR);
  }
  const text = fs.readFileSync(src, "utf-8");
  return "\n" + marked.parse(text).trim() + "\n";
}

export function partial(_t: string, args: Params, meta: Runtime): string {
  /*
   * 2✂︎f tag that includes another snippet file
   * and renders it with the current context.
   */
  let src = args.src || args.file || args.path;
  if (!src) {
    console.warn("No source file provided for the Partial tag.");
    return "";
  }
  const text = fs.readFileSync(src, "utf-8");
  // Inject page variables
  const shortFn = path.basename(meta.file.fname!).toLowerCase().split(".")[0];
  return (
    "\n" +
    new TemplateEngine()
      .render(text, { ...args, partial: `${shortFn}.html` })
      .trim() +
    "\n"
  );
}

export function title(text: string, _a: Params, meta: Runtime): undefined {
  /*
   * 2✂︎f tag that caches the title of the page.
   */
  if (!text) {
    console.warn("No text provided for the title tag.");
    return;
  }
  if (!meta.file.fname?.endsWith(".md")) {
    // console.warn("Title tag can only be used in MD files.");
    return;
  }

  const shortFn = path.basename(meta.file.fname!).toLowerCase().split(".")[0];
  console.log("Adding title text:", shortFn, "=", text);

  const memInfo: Params = diskCache.getCache("mem_info", shortFn) || {};
  memInfo.title = text;
  diskCache.setCache("mem_info", shortFn, memInfo, TTL);

  meta.globalCtx.title = text;
  // HACK
  // return "";
}

export function link(text: string, _a: Params, meta: Runtime): undefined {
  /*
   * 2✂︎f tag that defines links between memos in MEM.
   * The link doesn't return anything, just caches the relationship.
   * This could also show up in regular HTML, so be careful!
   *
   * Example:
   * {link id=whatever} [Whatever](./whatever) {/link}
   */
  const params = meta.node.params || {};
  if (!meta.file.fname?.endsWith(".md")) {
    // console.warn("Link tag can only be used in MD files.");
    return;
  }
  if (!params.id) {
    const m = text.match(/\(\.\/(.+?)\)/);
    if (m && m[1]) {
      params.id = m[1];
    } else {
      // console.warn("No link provided in text or ID! Skipping link.");
      return;
    }
  }

  const id = params.id.toLowerCase();
  // Must be in title case
  if (!params.text) params.text = toTitleCase(id);

  // BROKEN because of lowercase
  const shortFn = path.basename(meta.file.fname!).toLowerCase().split(".")[0];
  console.log("Adding link:", shortFn, "->", id);

  let dirLinks = new Set<string>();
  try {
    dirLinks = new Set<string>(diskCache.getCache("dir_links", shortFn) || []);
  } catch (err: any) {
    console.error("Error reading dir_links cache:", err.message);
  }
  let bckLinks = new Set<string>();
  try {
    bckLinks = new Set<string>(diskCache.getCache("bck_links", id) || []);
  } catch (err: any) {
    console.error("Error reading bck_links cache:", err.message);
  }

  dirLinks.add(id);
  bckLinks.add(shortFn);
  diskCache.setCache("dir_links", shortFn, Array.from(dirLinks), TTL);
  diskCache.setCache("bck_links", id, Array.from(bckLinks), TTL);
}

export function backlinks(_t: string, args: Params, meta: Runtime): string {
  /*
   * 2✂︎f tag that populates back-references between memos.
   * Example:
   * {backlinks}
   *   [Something1](./something1)
   *   [Something2](./something2)
   * {/backlinks}
   */
  let to = args.to;
  if (!to) {
    let fname = meta.file.fname!.toLowerCase();
    fname = fname.split("/").pop() || fname;
    to = fname.split(".")[0]; // Remove extension
    console.warn(
      "No 'to' parameter provided for backlinks, using file name:",
      to,
    );
  }
  const bckLinks = (diskCache.getCache("bck_links", to) || [])
    .sort((a, b) => a.localeCompare(b))
    .map((id: string) => {
      const linkText =
        diskCache.getCache("mem_info", id)?.title || toTitleCase(id);
      return `[${linkText}](./${id})`;
    });
  console.log("Backlinks for:", to, "=>", bckLinks);
  if (bckLinks.length === 0) {
    return "";
  }
  return "Backlinks: " + bckLinks.join(", ") + ".\n";
}

function isArticle(entry: Params): boolean {
  // Helper function for blogs.
  // By convention, first tag is the most important
  // so the first tag=article becomes the category
  return entry.tags.indexOf("article") > -1 || entry.text.length > 10_000;
}

function getReadingTime(text: string): number {
  // Helper function for blogs.
  const wordsPerMinute = 200;
  const numberOfWords = text.split(/\s/g).length;
  return Math.ceil(numberOfWords / wordsPerMinute);
}

export async function blog(
  _t: string,
  _a: Params,
  meta: Runtime,
): Promise<undefined> {
  // The text content is in the children nodes
  const text = meta.node
    .children!.filter((n) => n.rawText && n.rawText.trim() !== "")
    .map((n) => n.rawText)
    .join("")
    .trim();

  // @ts-ignore It's grand!
  let ctx = meta.node.childCtx;
  const key = `${ctx.date.slice(2).replaceAll("-", "")}-${ctx.link || "1"}`;
  const id = path.basename(meta.file.fname!).toLowerCase().split(".")[0];

  const blog: Params = {};
  blog.id = id;
  blog.layout = "post";
  blog.url = `/log/entries/${key}/`;
  blog.date = ctx.date;
  blog.title = ctx.title;
  blog.tags = ctx.tags || [];
  blog.draft = ctx.draft || false;
  blog.topic = isArticle({ ...ctx, text }) ? "articles" : "notes";
  blog.topicTitle = toTitleCase(blog.topic);
  blog.isoDate = new Date(ctx.date)
    .toISOString()
    .replace("T", " ")
    .replace(/\.000Z$/, "");
  blog.readingTime = getReadingTime(text);
  blog.dtListed = formatDate(new Date(blog.date), "yyyy LLL dd");
  blog.dtPublished = formatDate(new Date(blog.date), "yyyy LLL dd, ccc");
  // Cache into BLOGS!
  diskCache.setCache("blogs", key, blog, TTL);

  const engine = await Runtime.fromFile(
    // Blog post layout
    `tmpl/${blog.layout}.html`,
    meta.customTags,
    meta.config,
  );
  engine.memoCache = meta.memoCache;

  ctx = { ...ctx, ...blog };
  const tmpl = await engine.evaluateAll(ctx);
  const content = marked.parse(text);
  let html = new TemplateEngine().render(tmpl, { ...ctx, content });
  // Fix and replace stuff
  html = html.replaceAll(/<partial src=".+?">/g, "");
  html = html.replaceAll(/<\/partial>/g, "");
  // External links should open in a new tab
  html = html.replaceAll(
    /(<a href="https?:.+?")>/g,
    '$1 rel="noopener" target="_blank">',
  );

  const minified = await minify(html, {
    collapseWhitespace: true,
    includeAutoGeneratedTags: false,
    preserveLineBreaks: true,
    removeComments: true,
    keepClosingSlash: false,
    useShortDoctype: true,
    minifyCSS: true,
  });

  fs.mkdirSync(`output/${blog.url}`, { recursive: true });
  console.log("Writing blog:", blog.url, "Title:", blog.title);
  fs.writeFileSync(`output/${blog.url}/index.html`, minified, "utf-8");
}

export async function memo(
  text: string,
  _a: Params,
  meta: Runtime,
): Promise<undefined> {
  /**
   * 2✂︎f tag used to generate a single MEMO page.
   */
  const id = path.basename(meta.file.fname!).toLowerCase().split(".")[0];

  const engine = await Runtime.fromFile(
    "tmpl/wiki.html",
    meta.customTags,
    meta.config,
  );
  engine.memoCache = meta.memoCache;
  const ctx = meta.node.childCtx;
  ctx.layout = "wiki";
  ctx.id = id;

  const tmpl = await engine.evaluateAll(ctx);
  const content = marked.parse(text);
  let html = new TemplateEngine().render(tmpl, { ...ctx, content });

  // Fix and replace stuff
  html = html.replace(/<p>(.+?)<br>In:/, "In:");
  // Relative links should point to MEM
  html = html.replaceAll(/<a href="\.\/(.+?)">/g, '<a href="/mem/$1">');
  html = html.replaceAll(
    /<img src="\.\/img\/(.+?)"/g,
    '<img src="/mem/img/$1"',
  );
  // External links should open in a new tab
  html = html.replaceAll(
    /(<a href="https?:.+?")>/g,
    '$1 rel="noopener" target="_blank">',
  );

  const minified = await minify(html, {
    collapseWhitespace: true,
    includeAutoGeneratedTags: false,
    preserveLineBreaks: true,
    removeComments: true,
    keepClosingSlash: false,
    useShortDoctype: true,
    minifyCSS: true,
  });

  fs.mkdirSync(`output/mem/${id}`, { recursive: true });
  if (id === "index") {
    console.log("Writing index memo page.");
    fs.writeFileSync(`output/mem/index.html`, minified, "utf-8");
  } else {
    fs.writeFileSync(`output/mem/${id}/index.html`, minified, "utf-8");
  }
}

export async function photo(
  _t: string,
  args: Params,
  meta: Runtime,
): Promise<undefined> {
  /**
   * 2✂︎f tag used to define and generate a photo page.
   */
  if (!args.date || !args.title) {
    console.warn("Photo tag requires date and title! Skipping!");
    return;
  }
  if (!(args.image || args.images)) {
    console.warn("Photo tag requires image or images parameters! Skipping!");
    return;
  }

  const key =
    `${args.date.slice(2).replaceAll("-", "")}-${args.title.replaceAll(
      " ",
      "-",
    )}`.toLowerCase();

  // TODO :: load old values from cache if exists?
  const blog: Params = {};
  blog.id = key;
  blog.layout = "post";
  blog.url = `/log/photos/${key}/`;
  blog.topic = "photos";
  blog.date = args.date;
  blog.title = args.title;
  if (args.text) blog.text = args.text;
  blog.topicTitle = toTitleCase(blog.topic);
  blog.isoDate = new Date(args.date)
    .toISOString()
    .replace("T", " ")
    .replace(/\.000Z$/, "");
  blog.dtListed = formatDate(new Date(blog.date), "yyyy LLL dd");
  blog.dtPublished = formatDate(new Date(blog.date), "yyyy LLL dd, ccc");
  if (args.image) blog.image = args.image;
  if (args.images && Array.isArray(args.images)) blog.images = args.images;
  // Cache into BLOGS!
  diskCache.setCache("blogs", key, blog, TTL);

  const engine = await Runtime.fromFile(
    // Blog post layout
    `tmpl/${blog.layout}.html`,
    meta.customTags,
    meta.config,
    meta.memoCache,
  );

  const content = args.images
    ? args.images
        .map(
          (img: string) =>
            `<p><img src="/log/img/photos/${img}" alt="${args.text}" title="${args.title}"></p>`,
        )
        .join("\n")
    : `<img src="/log/img/photos/${args.image}" alt="${args.text}" title="${args.title}">`;
  const ctx = { ...args, ...blog, content };
  const tmpl = await engine.evaluateAll(ctx);
  let html = new TemplateEngine().render(tmpl, ctx);

  fs.mkdirSync(`output/${blog.url}`, { recursive: true });
  console.log("Writing photo:", blog.url);
  fs.writeFileSync(`output/${blog.url}/index.html`, html, "utf-8");
}

export async function img(
  _t: string,
  args: Params,
  _m: Runtime,
): Promise<undefined> {
  /**
   * 2✂︎f tag used to enable img-DB generated image tags.
   */
  if (
    !args["data-pth"] ||
    !args["data-format"] ||
    !args["data-mode"] ||
    !args.src
  ) {
    return;
  }

  const pth = args["data-pth"].split("/").at(-1);
  const info = Object.values(
    JSON.parse(fs.readFileSync("cache/blogs.json", "utf8")),
  )
    .map((e: any) => e.value)
    .filter(
      (e: Params) =>
        e.topic === "photos" &&
        (e.image === pth || (e.images && e.images.includes(pth))),
    )
    .at(0);
  for (const k of Object.keys(args)) {
    if (k.startsWith("data-") && k.endsWith("hash")) info[k] = args[k];
  }
  if (args["data-top-colors"]) {
    info["data-top-colors"] = args["data-top-colors"];
  }
  console.log("Caching img-DB:", info);
  info.src = args.src;
  // Cache into BLOGS!
  diskCache.setCache("blogs", info.id, info, TTL);

  console.log("Cached img-DB info for:", pth);
}

export function tags(_t: string, _a: Params, _m: Runtime): string {
  /**
   * 2✂︎f tag used to generate the full list of tags.
   */
  const blogs = Object.values(
    JSON.parse(fs.readFileSync("cache/blogs.json", "utf8")),
  )
    .map((e: any) => e.value)
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  console.log(`Loaded all blogs:`, blogs.length);

  const unsortedTags: Record<string, number> = {};
  let tags = "";
  blogs.forEach((p: Params) => {
    if (!p.tags) return;
    for (const t of p.tags) {
      if (
        !t ||
        t === "article" ||
        t === "articles" ||
        t === "entries" ||
        t === "entry" ||
        t === "note" ||
        t === "notes"
      ) {
        continue;
      }
      if (!unsortedTags[t]) {
        unsortedTags[t] = 1;
      } else {
        unsortedTags[t] += 1;
      }
    }
  });
  for (const t of Object.keys(unsortedTags).sort(
    (a, b) => unsortedTags[b] - unsortedTags[a],
  )) {
    tags += `  <postList id=tag tag="${t}" count=${unsortedTags[t]}/>\n`;
  }
  console.log("Generated tags list:", tags);
  return "\n  " + tags.trim() + "\n";
}

export async function postList(
  _t: string,
  args: Params,
  meta: Runtime,
): Promise<undefined> {
  /**
   * 2✂︎f tag used to generate a listing of blog posts.
   */
  const engine = await Runtime.fromFile(
    args.tmpl ? `tmpl/${args.tmpl}.html` : "tmpl/list.html",
    meta.customTags,
    meta.config,
    meta.memoCache,
  );

  const ctx = structuredClone(args);
  ctx.layout = args.tmpl ? args.tmpl : "list";
  ctx.url = ("/" + (args.id === "index" ? "" : args.id) + "/").replaceAll(
    "//",
    "/",
  );
  if (!args.title) {
    ctx.title = toTitleCase(args.id);
  }
  if (args.id === "articles" || args.id === "notes" || args.id === "photos") {
    ctx.ico = args.blog.topics[args.id];
  } else if (args.id === "tag") {
    ctx.title = `Tagged "${args.tag}"`;
    ctx.url = `/tags/${args.tag}/`;
  }

  ctx.posts = Object.values(
    JSON.parse(fs.readFileSync("cache/blogs.json", "utf8")),
  )
    .map((e: any) => e.value)
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  console.log(`Total ${args.id} found:`, ctx.posts.length);

  if (args.id === "index") {
    ctx.posts = ctx.posts.slice(0, 6);
  } else if (
    args.id === "articles" ||
    args.id === "notes" ||
    args.id === "photos"
  ) {
    ctx.posts = ctx.posts.filter(
      (p: Params) => !p.draft && p.topic === args.id,
    );
  } else if (args.id === "tag") {
    ctx.posts = ctx.posts.filter(
      (p: Params) => !p.draft && p.tags && p.tags.includes(args.tag),
    );
  }

  if (args.tmpl === "topic") {
    const unsortedTags: Record<string, number> = {};
    const sorted: Record<string, number> = {};
    ctx.posts.forEach((p: Params) => {
      if (!p.tags) return;
      for (const t of p.tags) {
        if (
          t === "entries" ||
          t === "article" ||
          t === "articles" ||
          t === "note" ||
          t === "notes"
        ) {
          continue;
        }
        if (!unsortedTags[t]) {
          unsortedTags[t] = 1;
        } else {
          unsortedTags[t] += 1;
        }
      }
    });
    for (const t of Object.keys(unsortedTags).sort(
      (a, b) => unsortedTags[b] - unsortedTags[a],
    )) {
      sorted[t] = unsortedTags[t];
    }
    ctx.tags = sorted;
  }

  const tmpl = await engine.evaluateAll(ctx);
  let html = new TemplateEngine().render(tmpl, ctx);
  // Fix and replace stuff
  html = html.replaceAll(/<partial src=".+?">/g, "");
  html = html.replaceAll(/<\/partial>/g, "");

  fs.mkdirSync(`output/${ctx.url}/`, { recursive: true });
  fs.writeFileSync(`output/${ctx.url}/index.html`, html, "utf-8");
}

export async function feedXml(
  _t: string,
  _a: Params,
  meta: Runtime,
): Promise<undefined> {
  /**
   * 2✂︎f tag used to generate an Atom feed XML.
   */
  const engine = await Runtime.fromFile(
    "tmpl/feed.xml",
    meta.customTags,
    meta.config,
    meta.memoCache,
  );

  const blog: Record<string, any> = Bun.TOML.parse(
    fs.readFileSync("data/blog.toml", "utf-8"),
  );
  const recent = Object.values(
    JSON.parse(fs.readFileSync("cache/blogs.json", "utf8")),
  )
    .map((e: any) => {
      e.value.absoluteUrl = `${blog.url}${e.value.url}`;
      return e.value;
    })
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  const ctx = { blog, recent: recent.slice(0, 8) };

  const tmpl = await engine.evaluateAll(ctx);
  const xml = new TemplateEngine().render(tmpl, ctx);
  fs.writeFileSync("output/feed.xml", xml, "utf-8");
}

export async function siteXml(
  _t: string,
  _a: Params,
  meta: Runtime,
): Promise<undefined> {
  /**
   * 2✂︎f tag used to generate an Atom feed XML.
   */
  const engine = await Runtime.fromFile(
    "tmpl/sitemap.xml",
    meta.customTags,
    meta.config,
    meta.memoCache,
  );

  const blog: Record<string, any> = Bun.TOML.parse(
    fs.readFileSync("data/blog.toml", "utf-8"),
  );
  const pages = Object.values(
    JSON.parse(fs.readFileSync("cache/blogs.json", "utf8")),
  )
    .map((e: any) => {
      e.value.absoluteUrl = `${blog.url}${e.value.url}`;
      return e.value;
    })
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  const date = new Date().toISOString().split("T")[0];
  pages.push({ date, absoluteUrl: `${blog.url}/articles/` });
  pages.push({ date, absoluteUrl: `${blog.url}/notes/` });
  pages.push({ date, absoluteUrl: `${blog.url}/photos/` });
  pages.push({ date, absoluteUrl: `${blog.url}/topics/` });
  pages.push({ date, absoluteUrl: `${blog.url}/about/` });
  pages.push({ date, absoluteUrl: `${blog.url}/author/` });
  pages.push({ date, absoluteUrl: `${blog.url}/projects/` });
  const ctx = { blog, pages };

  const tmpl = await engine.evaluateAll(ctx);
  const xml = new TemplateEngine().render(tmpl, ctx);
  fs.writeFileSync("output/sitemap.xml", xml, "utf-8");
}
