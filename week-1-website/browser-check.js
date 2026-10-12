/* Headless Chrome verification for the Week 1 website.
   Renders index.html at 320 / 768 / 1280 px and checks:
   - horizontal overflow
   - computed background / accent colors
   - section rendering (cards, nav, form)
   - contact form validation + demo submit behavior
   No dependencies; uses locally installed Chrome. */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");

const root = __dirname;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (!fs.existsSync(chromePath)) {
  console.error("Chrome not found at " + chromePath);
  process.exit(2);
}

const probe = `
<script>
window.addEventListener("load", function () {
  setTimeout(function () {
    var de = document.documentElement;
    var form = document.getElementById("contact-form");
    var results = {};

    // Layout / overflow
    results.viewport = window.innerWidth;
    results.scrollWidth = de.scrollWidth;
    results.horizontalOverflowPx = de.scrollWidth - de.clientWidth;

    // Computed design tokens
    results.bodyBackground = getComputedStyle(document.body).backgroundColor;
    results.bodyColor = getComputedStyle(document.body).color;
    results.accentVar = getComputedStyle(de).getPropertyValue("--color-accent").trim();

    // Rendered content
    results.projectCards = document.querySelectorAll(".project-card").length;
    results.navLinks = document.querySelectorAll(".site-nav a").length;
    results.labeledControls = document.querySelectorAll("form label").length;
    results.h1 = (document.querySelector("h1") || {}).textContent || null;

    // Form behavior: invalid then valid submission
    var name = document.getElementById("name");
    var email = document.getElementById("email");
    var message = document.getElementById("message");
    name.value = "Test User";
    email.value = "not-an-email";
    message.value = "Hello, this is a test message.";
    results.invalidEmailRejected = !form.checkValidity();

    email.value = "test@example.com";
    results.validFormAccepted = form.checkValidity();
    form.requestSubmit();
    results.statusAfterSubmit = document.getElementById("form-status").textContent;
    results.formClearedAfterDemo = name.value === "";

    // Navigation: click each nav link, verify it scrolls to the correct
    // section and that the sticky header does not cover the heading.
    results.navTests = [];
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a"));

    function finish() {
      var el = document.createElement("div");
      el.id = "browser-check-results";
      el.textContent = "RESULTS|" + JSON.stringify(results);
      document.body.appendChild(el);
    }

    function runNavTest(idx) {
      if (idx >= navLinks.length) {
        finish();
        return;
      }
      var link = navLinks[idx];
      window.scrollTo({ top: 0, behavior: "instant" });
      link.click();
      setTimeout(function () {
        var href = link.getAttribute("href");
        var target = document.querySelector(href);
        var headerH = document.querySelector(".site-header").getBoundingClientRect().height;
        var top = target ? target.getBoundingClientRect().top : NaN;
        results.navTests.push({
          href: href,
          hashOk: location.hash === href,
          targetExists: !!target,
          targetTop: Math.round(top),
          headerHeight: Math.round(headerH),
          headingNotCovered: top >= headerH - 2
        });
        runNavTest(idx + 1);
      }, 900);
    }

    runNavTest(0);
  }, 50);
});
</script>
`;

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const testFile = path.join(root, "_browser_check.html");
fs.writeFileSync(testFile, html.replace("</body>", probe + "</body>"));

const widths = [320, 375, 768, 1280];
let failures = 0;

for (const w of widths) {
  let out = "";
  try {
    out = execFileSync(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--allow-file-access-from-files",
        "--window-size=" + w + ",900",
        "--virtual-time-budget=9000",
        "--dump-dom",
        pathToFileURL(testFile).href,
      ],
      { encoding: "utf8", timeout: 45000, stdio: ["ignore", "pipe", "ignore"] }
    );
  } catch (e) {
    console.log("FAIL  Chrome run at " + w + "px errored: " + (e.message || "").slice(0, 120));
    failures++;
    continue;
  }

  const m = out.match(/RESULTS\|(\{.*?\})<\/div>/);
  if (!m) {
    console.log("FAIL  " + w + "px: no results captured (page/scripts did not run)");
    failures++;
    continue;
  }
  const r = JSON.parse(m[1]);
  const checks = [
    ["no horizontal overflow", r.horizontalOverflowPx <= 0, "overflow=" + r.horizontalOverflowPx + "px (scrollW=" + r.scrollWidth + ")"],
    ["background #1B1B1B", r.bodyBackground === "rgb(27, 27, 27)", r.bodyBackground],
    ["text white", r.bodyColor === "rgb(255, 255, 255)", r.bodyColor],
    ["accent #F8B400", r.accentVar.toLowerCase() === "#f8b400", r.accentVar],
    ["3 project cards", r.projectCards === 3, String(r.projectCards)],
    ["4 nav links", r.navLinks === 4, String(r.navLinks)],
    ["3 form labels", r.labeledControls === 3, String(r.labeledControls)],
    ["h1 renders name", (r.h1 || "").includes("Siddharth Puhan"), String(r.h1)],
    ["invalid email rejected", r.invalidEmailRejected === true, String(r.invalidEmailRejected)],
    ["valid form accepted", r.validFormAccepted === true, String(r.validFormAccepted)],
    ["demo status message shown", /not sent or stored/.test(r.statusAfterSubmit), r.statusAfterSubmit],
    ["form reset after demo submit", r.formClearedAfterDemo === true, String(r.formClearedAfterDemo)],
  ];
  const navTests = r.navTests || [];
  checks.push([
    "4 nav links tested",
    navTests.length === 4,
    "found " + navTests.length,
  ]);
  for (const nt of navTests) {
    checks.push([
      "nav link " + nt.href + " scrolls to correct section, heading not covered",
      nt.hashOk && nt.targetExists && nt.headingNotCovered,
      "hashOk=" + nt.hashOk + " targetTop=" + nt.targetTop + " headerH=" + nt.headerHeight,
    ]);
  }
  for (const [name, ok, detail] of checks) {
    if (ok) console.log("PASS  [" + w + "px] " + name);
    else { console.log("FAIL  [" + w + "px] " + name + " — " + detail); failures++; }
  }
}

fs.unlinkSync(testFile);
console.log("\nBrowser checks: " + (failures === 0 ? "ALL PASSED" : failures + " FAILED"));
process.exit(failures === 0 ? 0 : 1);
