# Dev Autographs Installer

Windows **NSIS** packaging and GitHub Releases for [Dev Autographs](https://github.com/Creal212/Dev-Autographs) — *sign the code you ship, forever.*

This repo does **not** contain the app source. It holds release tags and `.exe` downloads.

## What the installer does

- Installs the **Dev Autographs desk** (Tauri 2 desktop app) for the current user — no admin prompt, Start Menu folder *Dev Autographs*.
- Branded NSIS wizard (night palette, wax seal) built from `apps/desktop/src-tauri/installer/*.bmp` and `tauri.conf.json → bundle.windows.nsis`.
- Bundles the CLI (`paw-prints.cjs`) that the desk uses for global git hooks, sealing and the `Shift + D` honorary-report overlay.

**Requirements:** Windows 10/11 (x64), [Node.js 18+](https://nodejs.org) on `PATH` (the bundled CLI and git hooks run on Node), and `git`.

## Hands-off release (CI)

1. Open **Actions → Build and release Windows installer → Run workflow**
2. Set `code_ink_ref` (e.g. `master`) and `version` (e.g. `v0.1.1`)
3. CI clones Dev-Autographs, builds Tauri NSIS, uploads to this repo's Releases

Or push a `v*` tag on Dev-Autographs if you mirror that workflow there.

Optional GitHub Actions variable on this repo:

- `DEV_AUTOGRAPHS_REGISTRY_URL` — baked into the desktop build as `VITE_DEV_AUTOGRAPHS_API` (must be `https://`; the desk refuses plain-http remote registries).

## Manual build

```bash
git clone https://github.com/Creal212/Dev-Autographs.git
cd Dev-Autographs
npm install && npm run build
npm run tauri:build -w @dev-autographs/desktop
```

Upload `apps/desktop/src-tauri/target/release/bundle/nsis/*.exe` to a Release here.

## Security notes

- Signing keys are **device-bound**: the desk (or CLI) mints the Ed25519 pair locally and only the public half is sent to the registry. The private key lives in `%USERPROFILE%\.dev-autographs\identity.json` and is destroyed on *Unlink*.
- The desk ships with a strict Content-Security-Policy and only opens allow-listed external links.
- Verify a download: compare the SHA-256 shown on the Release page with `Get-FileHash .\Dev-Autographs_*.exe`.

## Download

https://github.com/Creal212/Dev-Autographs-Installer/releases/latest

Website source: https://github.com/Creal212/Dev-Autographs-Website · Meet the dev: https://www.creal589.dev/

## Repos

| Repo | Role |
|---|---|
| [Dev-Autographs](https://github.com/Creal212/Dev-Autographs) | App + CLI |
| [Dev-Autographs-Backend-Registry](https://github.com/Creal212/Dev-Autographs-Backend-Registry) | Shared marks / locks |
| [Dev-Autographs-Website](https://github.com/Creal212/Dev-Autographs-Website) | Download + device login link |
| [Dev-Autographs-Installer](https://github.com/Creal212/Dev-Autographs-Installer) | This repo — releases only |
