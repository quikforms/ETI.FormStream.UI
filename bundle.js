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

// 1) Expose the element's compiled global stylesheet as text. Nothing here injects it: the element
//    renders inside a shadow root and puts these styles in that root itself (see
//    FormStreamComponent.adoptGlobalStyles). That is what keeps the two directions apart — the
//    rules cannot reach the host page, and the host's own CSS cannot reach the template.
//    The old refcounted document.head injector is gone with the boundary; a shadow root is
//    destroyed with its element, so there is nothing left to count.
const compiledCss = fs.readFileSync(path.join(distPath, cssFile), 'utf8')
  // The element ships its icons as inline SVG (src/app/components/icon), so the bundled
  // Bootstrap/FA @font-face rules are dead weight here AND harmful: their relative font url()s
  // 404 against the host page (the SPA returns its index.html -> "Failed to decode downloaded
  // font" / OTS "invalid sfntVersion" errors), and they collide with a host's own same-family
  // @font-face. Strip them.
  .replace(/@font-face\s*\{[^}]*?(?:Glyphicons Halflings|FontAwesome)[^}]*?\}/g, '');

// The @font-face rules are the one part of the stylesheet that cannot travel into the shadow root:
// a font face declared inside one is not registered by the browser, whatever form its src takes, so
// every rule asking for the family silently falls back. Measured rather than assumed — with all
// three inside the root, 48px of "Source Sans Pro" rendered at exactly the width of a family that
// does not exist. They are handed over separately and the element puts them in document.head.
const FONT_FACE_RULE = /@font-face\s*\{[^}]*\}/g;
const fontFaceCss = (compiledCss.match(FONT_FACE_RULE) || []).join('\n');

// Inside a shadow root the element's own tag name matches nothing: a host is not a descendant of
// its own shadow tree, so `quik-formstream ul` has no ancestor to hang off and `quik-formstream {}`
// never reaches the host. These selectors were written to scope the global styles to the element
// back when they lived in the document; `:host` is what does that job here. Both shapes translate
// by the same substitution — `quik-formstream {}` becomes `:host {}`, and `quik-formstream ul`
// becomes `:host ul`, which does reach into the tree.
//
// Not cosmetic: the rule on the element itself carries display:block, the background and the base
// font-family, so without this the element lays out as an inline box in the host's default font.
// `:root` has the same problem and one more trap. The element's 66 --fs-* custom properties are
// declared on it, and 88 declarations read them, so leaving it dead is most of what "the styles are
// broken" looks like. It is matched only where it stands as a whole selector — preceded by nothing,
// a comma or a closing brace — because the sheet also carries `svg:not(:root)` from the CSS reset,
// and rewriting that one would change what it selects rather than fix it.
//
// Moving the defaults onto :host keeps host theming working: a rule in the outer page that sets
// --fs-* on the element or an ancestor still wins, because outer rules beat :host rules and custom
// properties inherit across the boundary.
const shadowCss = compiledCss
  .replace(FONT_FACE_RULE, '')
  .replace(/quik-formstream/g, ':host')
  .replace(/(^|[,}]):root\s*\{/g, '$1:host{');

// Escaped for the template literal each one is embedded in below.
const forTemplateLiteral = (text) => text
  .replace(/\\/g, '\\\\')   // escape backslashes
  .replace(/`/g, '\\`')     // escape backticks
  .replace(/\$/g, '\\$');   // escape template-literal interpolation

bundleContent +=
  '(function () {\n' +
  `  window.__formStreamStyles = \`${forTemplateLiteral(shadowCss)}\`;\n` +
  `  window.__formStreamFontFaces = \`${forTemplateLiteral(fontFaceCss)}\`;\n` +
  '})();\n';

// 2) Concatenate the JS chunks in load order.
jsFiles.forEach(file => {
  bundleContent += fs.readFileSync(path.join(distPath, file), 'utf8') + '\n';
});

// Close the idempotency guard opened above.
bundleContent += '}\n';

fs.writeFileSync(outputFile, bundleContent);
console.log('✅ formstream-bundle.js generated');
