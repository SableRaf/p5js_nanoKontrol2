# Release Process

## Prerequisites

- Push access to the repo
- npm Trusted Publisher configured for this repo + workflow (`release-workflow.yml`)

## Steps

1. **Run `npm version`** — updates `package.json`, `package-lock.json`, commits, and creates the tag:
   ```sh
   npm version 1.2.3          # stable
   npm version 1.2.3-rc.0     # prerelease
   ```

2. **Push the commit and tag:**
   ```sh
   git push origin main --follow-tags
   ```

3. **CI takes over** — the `release-workflow.yml` workflow runs automatically:
   - Typechecks and builds the library
   - Publishes to npm (stable → `latest` tag, prerelease → `beta` tag) via OIDC (no token needed)
   - Creates a **draft** GitHub release with the built `dist/` files attached and auto-generated notes

5. **Publish the GitHub release** — review the draft at _Releases_, edit the notes if needed, then publish.
