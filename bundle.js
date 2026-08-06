const fs = require('fs');
const path = require('path');

// Combine the Angular CLI output for `quik-formstream` into ONE self-contained script,
// so the element can be embedded with a single <script> tag into any host page. The bundled
// code runs on load and registers the custom element via
// customElements.define('quik-formstream', ...); the browser then upgrades the tag
// natively — including tags inserted dynamically — so no manual init or MutationObserver is
// needed. The compiled styles are exposed as lazy inject/remove helpers (not auto-injected),
// so they only touch the page when a <quik-formstream> is actually connected.

// Angular writes the CLI output here (see `outputPath` in angular.json).
const distPath = path.resolve(__dirname, 'dist/formstream');
const outputFile = path.join(distPath, 'formstream-bundle.js');

// Load order is significant: webpack runtime first, then polyfills (Zone.js), then the app.
// `outputHashing` is off for this project (see angular.json), so these names are stable.
const jsFiles = ['runtime.js', 'polyfills.js', 'main.js'];
const cssFile = 'styles.css';

// Strict by default: in a clean build (build-formstream*, build-prod → the Docker image) a
// missing chunk is a real failure and must break the build — never ship no bundle or a stale one.
// The dev watch passes --lenient so it can skip a transient mid-rebuild race (`ng build --watch`
// momentarily removes the chunks) and run again on the next write.
const lenient = process.argv.includes('--lenient');
const required = [...jsFiles, cssFile];
const missing = required.filter(file => !fs.existsSync(path.join(distPath, file)));
if (missing.length) {
  const detail = `[${missing.join(', ')}]`;
  if (lenient) {
    console.warn(`formstream bundle: skipped — build output not ready yet ${detail}.`);
    process.exit(0);
  }
  console.error(`formstream bundle: FAILED — required build output missing ${detail}. Run the element build first.`);
  process.exit(1);
}

// Idempotency guard: a self-contained embeddable bundle must never execute twice. An external
// host could include the <script> more than once (e.g. CDN + npm); re-executing would
// re-bootstrap Angular and redefine the element. The flag makes any extra load a no-op.
let bundleContent =
  'if (!window.__formStreamElementLoaded) {\n' +
  '  window.__formStreamElementLoaded = true;\n';

// 1) Expose the element's compiled styles as lazy, refcounted inject/remove helpers keyed by
//    a marker id — they are NOT auto-injected. The element's component calls them on connect
//    (ngOnInit) and disconnect (ngOnDestroy), so the global CSS only touches a page while a
//    <quik-formstream> is actually present: a host page that never renders the element is
//    not restyled, and leaving the element restores the host. (Full isolation via Shadow DOM
//    is deferred to a future task.)
const css = fs.readFileSync(path.join(distPath, cssFile), 'utf8')
  // The element renders icons via the host's Font Awesome and uses no glyphicons, so the
  // bundled Bootstrap/FA @font-face rules are dead weight here AND harmful: their relative
  // font url()s 404 against the host page (the SPA returns its index.html -> "Failed to
  // decode downloaded font" / OTS "invalid sfntVersion" errors), and they collide with the
  // host's own same-family @font-face. Strip them so host glyphs keep using the host's fonts.
  .replace(/@font-face\s*\{[^}]*?(?:Glyphicons Halflings|FontAwesome)[^}]*?\}/g, '')
  .replace(/\\/g, '\\\\')   // escape backslashes
  .replace(/`/g, '\\`')     // escape backticks
  .replace(/\$/g, '\\$');   // escape template-literal interpolation
bundleContent +=
  '(function () {\n' +
  '  var STYLE_ID = \'formstream-element-styles\';\n' +
  `  var css = \`${css}\`;\n` +
  '  var refCount = 0;\n' +
  '  window.__formStreamInjectStyles = function () {\n' +
  '    refCount++;\n' +
  '    if (document.getElementById(STYLE_ID)) { return; }\n' +
  '    var style = document.createElement(\'style\');\n' +
  '    style.id = STYLE_ID;\n' +
  '    style.textContent = css;\n' +
  '    document.head.appendChild(style);\n' +
  '  };\n' +
  '  window.__formStreamRemoveStyles = function () {\n' +
  '    refCount = Math.max(0, refCount - 1);\n' +
  '    if (refCount > 0) { return; }\n' +
  '    var style = document.getElementById(STYLE_ID);\n' +
  '    if (style) { style.remove(); }\n' +
  '  };\n' +
  '})();\n';

// 2) Concatenate the JS chunks in load order.
jsFiles.forEach(file => {
  bundleContent += fs.readFileSync(path.join(distPath, file), 'utf8') + '\n';
});

// Close the idempotency guard opened above.
bundleContent += '}\n';

fs.writeFileSync(outputFile, bundleContent);
console.log('✅ formstream-bundle.js generated');
