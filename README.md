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

## Configuration

Runtime configuration (API endpoints) is loaded at startup from `config/config.json`. Per-environment
variants live under `src/config/<env>/config.json` and are selected at deploy time.

## Project layout

```
src/
  app/            Components, services, and NgRx state for the element
  assets/         Images bundled with the element
  config/         Runtime configuration (per environment)
  environments/   Build-time environment flags
  main.ts         Bootstraps the element module
  formstream-element.module.ts   Declares the module and defines the custom element
bundle.js         Concatenates the CLI output into formstream-bundle.js
```

The repository is an Angular workspace. The element ships as an Angular application today; a
companion library project may be added later so the same code can also be consumed directly as an
Angular module by first-party Angular hosts (avoiding a second Angular/Zone runtime on those pages).

## Roadmap

- **Style isolation via Shadow DOM** — fully encapsulate the element's styles so it never touches
  the host page's CSS.
- **Dual consumption** — expose an Angular library entry point alongside the standalone element.
- **Distribution** — publish the bundle to a versioned public URL and to npm.
