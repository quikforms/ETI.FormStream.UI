# Releasing

The compiled bundle `dist/formstream/formstream-bundle.js` is committed to this repository and
distributed over public CDNs straight from the Git tags — no server, no account, no manual upload.

## Cut a release

Releases go through a pull request — direct pushes to the default branch are not allowed. The Git
**tag** is what the CDNs serve, and tags are not covered by branch protection, so it is pushed after
the version-bump PR is merged.

1. Create a release branch and bump the version. `npm version` runs the `version` script first,
   which rebuilds the production bundle (`npm run build-prod`) and stages it, so the release commit
   always contains a fresh `dist/formstream/formstream-bundle.js`; it then bumps `package.json`,
   commits, and creates the `vX.Y.Z` tag locally:

   ```bash
   git checkout -b release/vX.Y.Z
   npm version X.Y.Z -m "chore(release): %s"
   ```

2. Push the branch (not the tag yet), open a PR into the default branch, and get it reviewed and
   merged. Use a merge commit so the tagged commit lands on the default branch:

   ```bash
   git push -u origin release/vX.Y.Z
   # open the PR (release/vX.Y.Z → default branch) and merge it
   ```

3. Once the PR is merged, publish the tag — this is what makes the release live on the CDNs:

   ```bash
   git push origin vX.Y.Z
   ```

Use SemVer: patch for fixes, minor for backward-compatible additions, major for breaking changes.

## How it reaches the CDNs

- **jsDelivr** — automatic. The moment the tag is pushed, the pinned, immutable URL is live:

  ```
  https://cdn.jsdelivr.net/gh/quikforms/ETI.FormStream.UI@vX.Y.Z/dist/formstream/formstream-bundle.js
  ```

  Always pin an exact tag (`@vX.Y.Z`) in production; the `@latest` / `@major` ranges are mutable.

- **cdnjs** — once the library is accepted into the `cdnjs/packages` catalog, its autoupdate robot
  picks up each new tag automatically (~hourly) and serves:

  ```
  https://cdnjs.cloudflare.com/ajax/libs/quik-formstream/X.Y.Z/formstream-bundle.js
  ```
