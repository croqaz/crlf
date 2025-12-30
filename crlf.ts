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

  const shortFn = path.basename(meta.file.fname!).toLowerCase().split(".")[0];
  console.log("Adding title text:", shortFn, "=", text);

  const memInfo: Params = diskCache.getCache("mem_info", shortFn) || {};
  memInfo.title = text;
  diskCache.setCache("mem_info", shortFn, memInfo, TTL);

  meta.globalCtx.title = text;
  // HACK
  // return "";
}

export function link(text: string, args: Params, meta: Runtime): undefined {
  /*
   * 2✂︎f tag that defines links between memos in MEM.
   * The link doesn't return anything, just caches the relationship.
   *
   * Example:
   * {link id=whatever} [Whatever](./whatever) {/link}
   */
  if (!args.id) {
    const m = text.match(/\(\.\/(.+?)\)/);
    if (m && m[1]) {
      args.id = m[1];
    } else {
      console.warn("No link provided in text or ID! Skipping link.");
      return;
    }
  }

  args.id = args.id.toLowerCase();
  // Must be in title case
  if (!args.text) args.text = toTitleCase(args.id);

  // BROKEN because of lowercase
  const shortFn = path.basename(meta.file.fname!).toLowerCase().split(".")[0];
  console.log("Adding link:", shortFn, "->", args.id);

  let dirLinks = new Set<string>();
  try {
    dirLinks = new Set<string>(diskCache.getCache("dir_links", shortFn) || []);
  } catch (err: any) {
    console.error("Error reading dir_links cache:", err.message);
  }
  let bckLinks = new Set<string>();
  try {
    bckLinks = new Set<string>(diskCache.getCache("bck_links", args.id) || []);
  } catch (err: any) {
    console.error("Error reading bck_links cache:", err.message);
  }

  dirLinks.add(args.id);
  bckLinks.add(shortFn);
  diskCache.setCache("dir_links", shortFn, Array.from(dirLinks), TTL);
  diskCache.setCache("bck_links", args.id, Array.from(bckLinks), TTL);
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
): Promise<any> {
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
  blog.tags = ctx.tags || [];
  blog.draft = ctx.draft || false;
  blog.topic = isArticle({ ...ctx, text }) ? "articles" : "notes";
  blog.topicTitle = toTitleCase(blog.topic);
  blog.title = ctx.title || key;
  blog.isoDate = new Date(ctx.date)
    .toISOString()
    .replace("T", " ")
    .replace(/\.000Z$/, "");
  blog.dtListed = formatDate(new Date(ctx.date), "yyyy LLL dd");
  blog.dtPublished = formatDate(new Date(ctx.date), "yyyy LLL dd, ccc");
  blog.readingTime = getReadingTime(text);
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
  fs.writeFileSync(`output/log/entries/${key}/index.html`, minified, "utf-8");
}

export async function memo(
  text: string,
  _a: Params,
  meta: Runtime,
): Promise<any> {
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
): Promise<any> {
  /**
   * 2✂︎f tag used to define and generate a photo page.
   */
  return;
}

export async function postList(
  _t: string,
  args: Params,
  meta: Runtime,
): Promise<any> {
  /**
   * 2✂︎f tag used to generate a listing of blog posts.
   */
  const engine = await Runtime.fromFile(
    args.tmpl ? `tmpl/${args.tmpl}.html` : "tmpl/list.html",
    meta.customTags,
    meta.config,
  );
  engine.memoCache = meta.memoCache;
  const ctx = structuredClone(args);
  ctx.layout = "list";
  ctx.url = ("/" + (args.id === "index" ? "" : args.id) + "/").replaceAll(
    "//",
    "/",
  );
  if (!args.title) {
    ctx.title = toTitleCase(args.id);
  }
  if (args.id === "articles" || args.id === "notes" || args.id === "photos") {
    ctx.ico = args.blog.topics[args.id];
  }

  ctx.posts = Object.values(JSON.parse(fs.readFileSync("blogs.json", "utf8")))
    .map((e: any) => e.value)
    .sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1));

  {
    const unsortedTags: Record<string, number> = {};
    const sorted: Record<string, number> = {};
    ctx.posts.forEach((p: Params) => {
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

  if (args.id === "index") {
    ctx.posts = ctx.posts.slice(0, 6);
  } else if (args.id === "articles") {
    ctx.posts = ctx.posts.filter(
      (p: Params) => !p.draft && p.topic === "articles",
    );
  } else if (args.id === "notes") {
    ctx.posts = ctx.posts.filter(
      (p: Params) => !p.draft && p.topic === "notes",
    );
  }
  // console.log("Generating post list for:", ctx.url, "with", ctx);

  const tmpl = await engine.evaluateAll(ctx);
  let html = new TemplateEngine().render(tmpl, ctx);
  // Fix and replace stuff
  html = html.replaceAll(/<partial src=".+?">/g, "");
  html = html.replaceAll(/<\/partial>/g, "");

  fs.mkdirSync(`output/${ctx.url}/`, { recursive: true });
  fs.writeFileSync(`output/${ctx.url}/index.html`, html, "utf-8");
}
