# FormStream UI

An embeddable [Angular custom element](https://angular.io/guide/elements) that renders and
completes Quik! forms inside any host page. The element is published as a single, self-contained
`<script>` bundle and registers a custom element:

```html
<script src="formstream-bundle.js"></script>
<quik-formstream></quik-formstream>
```

The element bundles its own Angular and Zone.js runtime, so it can be embedded into any page —
including non-Angular ones — with a single script tag. It registers `<quik-formstream>` on load;
the browser then upgrades any such tag natively, including tags inserted dynamically.

## Prerequisites

- Node.js 20+
- npm 9+

## Getting started

```bash
npm install
```

## Building

The build compiles the element with the Angular CLI and then concatenates the CLI output into a
single self-contained `formstream-bundle.js` under `dist/formstream/`.

| Command | Purpose |
| --- | --- |
| `npm run build-prod` | Optimized production bundle |
| `npm run build` | Development bundle (unoptimized, source maps) |
| `npm run build-local` | Development bundle against the local environment config |
| `npm run watch` | Rebuild and re-bundle on change (development) |

Every build also writes the third-party license notices of everything bundled to
`dist/formstream/3rdpartylicenses.txt`, which ships next to the bundle.

## Testing

```bash
npm test
```

Runs the unit tests (`*.spec.ts`) with Jest. They cover the logic that does not render — models,
request builders, controllers, and the NgRx reducers and effects — and run on Node, without a browser
or Angular's TestBed. They are not part of the build.

## Configuration

The API endpoints are baked into the build. `src/environments/api-config.ts` holds Quik's production
endpoints — the ones the distributed bundle carries — and the `environment*.ts` files beside it select
them per build configuration. The element therefore performs no runtime configuration fetch and needs
no host wiring: a page that loads the bundle is already pointed at production.

A first-party host embedding the element in a non-production environment overrides the base URLs, and
the OAuth client name, at runtime through the element's `apiConfig` input; any key left unset falls
back to the baked production value. Non-production endpoints are not committed to this repository.

## Project layout

```
src/
  app/            Components, services, and NgRx state for the element
  environments/   Build-time flags and the production API endpoints
  main.ts         Bootstraps the element module
  formstream-element.module.ts   Declares the module and defines the custom element
bundle.js         Concatenates the CLI output into formstream-bundle.js
jest.config.js    Unit test runner configuration (with tsconfig.spec.json)
```

The repository is an Angular workspace. The element ships as an Angular application today; a
companion library project may be added later so the same code can also be consumed directly as an
Angular module by first-party Angular hosts (avoiding a second Angular/Zone runtime on those pages).

## Styling

The element renders inside a shadow root, so its styles and the host page's cannot reach each
other: nothing the element ships is applied to the page around it, and host page rules do not
change how forms render.

Theming is through custom properties, which do cross the boundary. Set any of the `--fs-*`
properties **on the element itself** and it picks them up:

```css
quik-formstream {
  --fs-brand: #0b5fff;
}
```

Setting them on an ancestor does not work. The element declares its own defaults on `:host`, and
an own declaration beats a value inherited from further up, so the default wins. The rule has to
match `<quik-formstream>`.

## Roadmap

- **Dual consumption** — expose an Angular library entry point alongside the standalone element.
- **npm distribution** — publish the package to npm. Distribution over versioned public CDN URLs is
  already in place; see [RELEASING.md](RELEASING.md).
