/* Local validation checks for the Week 1 website (no dependencies). */
"use strict";
const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) {
    pass++;
    console.log("PASS  " + name);
  } else {
    fail++;
    console.log("FAIL  " + name + (detail ? " — " + detail : ""));
  }
}

/* --- Document basics --- */
check("HTML5 doctype", /^<!DOCTYPE html>/i.test(html));
check('lang="en"', /<html[^>]*\slang="en"/.test(html));
check("viewport meta", /<meta[^>]+name="viewport"/.test(html));
check("meta description", /<meta[^>]+name="description"/.test(html));
check("descriptive <title>", /<title>[^<]{10,}<\/title>/.test(html));
check("references style.css", /<link[^>]+href="style\.css"/.test(html));
check("references script.js", /<script[^>]+src="script\.js"/.test(html));

/* --- Local assets exist / no external assets --- */
const assetRefs = [...html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)]
  .map((m) => m[1])
  .filter((u) => !/^(https?:|mailto:|#)/.test(u));
const missing = assetRefs.filter((u) => !fs.existsSync(path.join(root, u)));
check("all local assets exist", missing.length === 0, missing.join(", "));
// External *render* dependencies must not exist: scripts, images/media (any
// src) and stylesheets (<link href>). External <a href> navigation links are
// content, not assets, so anchors are deliberately not scanned here.
const externalAssets = [
  ...[...html.matchAll(/\ssrc="(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
  ...[...html.matchAll(/<link[^>]+href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
];
check(
  "no external asset dependencies (scripts/styles/images)",
  externalAssets.length === 0,
  externalAssets.join(", ")
);

/* --- Anchor links resolve to section IDs --- */
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
const brokenAnchors = [...new Set(anchors)].filter((a) => !ids.has(a));
check("all in-page links resolve to IDs (" + new Set(anchors).size + " links)", brokenAnchors.length === 0, brokenAnchors.join(", "));

/* --- Required sections present --- */
["home", "about", "skills", "projects", "contact"].forEach((s) =>
  check('section #' + s + " present", ids.has(s))
);

/* --- Form labels & validation --- */
const controls = [...html.matchAll(/<(input|textarea|select)\b[^>]*\bid="([^"]+)"/g)];
check("form has name/email/message controls", ["name", "email", "message"].every((n) => controls.some((c) => c[2] === n)));
const labelFors = [...html.matchAll(/<label[^>]+for="([^"]+)"/g)].map((m) => m[1]);
const controlIds = new Set(controls.map((c) => c[2]));
const unlabeled = [...controlIds].filter((id) => !labelFors.includes(id));
check("every form control has an associated label", unlabeled.length === 0, unlabeled.join(", "));
check("email input uses type=email", /<input[^>]+type="email"/.test(html));
check("required attributes present", (html.match(/required/g) || []).length >= 3);
check("form note states it is a demonstration", /demo(stration)? form|frontend demonstration/i.test(html));

/* --- Semantic structure & heading hierarchy --- */
["<header", "<nav", "<main", "<footer"].forEach((el) =>
  check("semantic element " + el + ">", html.includes(el))
);
check("section elements", (html.match(/<section\b/g) || []).length >= 5);
check("article elements for projects", (html.match(/<article\b/g) || []).length >= 3);

const headings = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
check("exactly one h1", headings.filter((h) => h === 1).length === 1, "found " + headings.filter((h) => h === 1).length);
let skipped = null;
for (let i = 1; i < headings.length; i++) {
  if (headings[i] - headings[i - 1] > 1) { skipped = `h${headings[i - 1]} -> h${headings[i]}`; break; }
}
check("no skipped heading levels", skipped === null, skipped || "");

/* --- Accessibility extras --- */
check("skip link present", /class="skip-link"[^>]*href="#main"/.test(html));
check("viewport-friendly images have alt (or no images)", [...html.matchAll(/<img\b[^>]*>/g)].every((m) => /\balt=/.test(m[0])));
check("aria-label on nav landmarks", (html.match(/<nav[^>]+aria-label/g) || []).length >= 2);

/* --- CSS concept checks --- */
check("box-sizing: border-box", /box-sizing:\s*border-box/.test(css));
check("CSS custom properties", /--[a-z-]+:\s*/.test(css) && /var\(--/.test(css));
check("display: flex (Flexbox)", /display:\s*flex/.test(css));
check("justify-content", /justify-content:/.test(css));
check("align-items", /align-items:/.test(css));
check("gap property", /(?<!grid-)gap:/.test(css));
check("flexible widths (flex: ...)", /flex:\s*\d/.test(css));
check("max-width", /max-width:/.test(css));
check("media queries", (css.match(/@media/g) || []).length >= 2, "found " + (css.match(/@media/g) || []).length);
check("hover states", /:hover/.test(css));
check("keyboard focus states", /:focus-visible/.test(css));
check("prefers-reduced-motion", /prefers-reduced-motion/.test(css));
check("sticky-header anchor offset (scroll-margin-top)", /scroll-margin-top/.test(css));
check("responsive images rule", /img\s*{[^}]*max-width:\s*100%/.test(css));

/* Selector variety */
check("element selector", /^(body|p|h1|a)\s*[{,]/m.test(css));
check("class selector", /^\.[a-z][\w-]*\s*[{,:.\s]/m.test(css));
check("ID selector", /^#[a-z][\w-]*\s*[{,]/m.test(css));
check("group selector", /^h1,\s*\n?\s*h2,/m.test(css));
check("descendant selector", /\.(site-header|form-field)\s+nav|\.form-field\s+label|site-header nav a/.test(css));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
