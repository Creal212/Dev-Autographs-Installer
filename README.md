# Dev Autographs Installer

Windows installer releases, the single-file CLI, and the changelog for **Dev Autographs**: a vermilion stamp for every file you ship.

**Latest installer posted: 2026-09-26 (v0.2.1).** See [CHANGELOG.md](CHANGELOG.md) for what changed.

- Download v0.2.1 (5.3 MB): [releases/v0.2.1/](releases/v0.2.1/) in this repo. SHA-256 `F9A92CC517A50C81B3FD95D58B540DB9EF1C63176C52F69F4E2FCD3ECF0257CD`.
- Releases page: https://github.com/Creal212/Dev-Autographs-Installer/releases/latest
- Website and web desk: https://github.com/Creal212/Dev-Autographs-Website (`/desk.html`)
- App, CLI and registry source: https://github.com/Creal212/Dev-Autographs

This repo does not contain the app source. It holds release tags, `.exe` downloads, `cli/` for the web desk setup script, and release notes.

## What Dev Autographs is

Developers sign the code they ship. Once linked to a GitHub account, every commit seals the staged source files with an Ed25519 signature and every push publishes the file fingerprints (hashes, never source) to a shared registry. Sites built from that code carry a small report; anyone presses **Shift + D** and sees who made it, ranked out of 100.

Three pieces:

| Piece | What it does |
|---|---|
| **Desk** (this installer) | Windows desktop app. Ink your GitHub, design and lock your autograph words, watch your ledger, manage the Stamp Room. Bundles the CLI and installs global git hooks. |
| **Web desk** | The same flows in a browser at `/desk.html` on the website. Mints your key with WebCrypto, locks words, shows the ledger, and gives you a one-time setup script so local commits get signed too. |
| **Registry** | Hosted API (Railway). Holds accounts, locked words, seal fingerprints, repo autographs. Device-bound keys: it never sees a private key. |

### The account model

- **One GitHub account, any device. Last Ink wins.** Inking on a new device makes it the signer. The previous device is told the next time it opens or commits ("Someone inked @you on another device...") and stops sealing. If that was not you, secure your GitHub account and Ink again.
- **Ledger follows the account.** Seals made with any key your GitHub ever held still count for you. Nothing is lost when you switch or lose a machine.
- **Autograph words are locked and unique.** Your code mark and repo mark are yours across the whole registry, in either slot. Changing them asks for confirmation. They survive re-ink, unlink, and new devices.
- **Unlink** releases your key on the registry and shreds the local copy. Your history stays.

### What the installer does

- Installs the desk for the current user (no admin prompt), Start Menu folder *Dev Autographs*. Branded NSIS wizard.
- Bundles the CLI (`paw-prints.cjs`) used for global git hooks (`core.hooksPath`), sealing, publishing, and the Shift + D report.
- Connects to the hosted registry on its own. There is no URL to type.

**Requirements:** Windows 10/11 x64, [Node.js 20+](https://nodejs.org) on `PATH`, and `git`.

### Verify a download

Each version ships as `Dev-Autographs_<version>_x64-setup.exe` plus a matching `.sha256`, both under `releases/<tag>/` in this repo and on the Releases page. Compare with:

```powershell
Get-FileHash .\Dev-Autographs_*_x64-setup.exe -Algorithm SHA256
```

## `cli/` folder

`cli/cli.cjs` and `cli/paw-prints.cjs` are the bundled command line, identical to the one inside the installer. The web desk's setup script downloads them from this repo (`main` branch, raw) into `~/.dev-autographs/cli/` and runs `install-hooks --global`. Keep them in step with each release.

## Releasing

1. In **Dev-Autographs**: bump `apps/desktop/package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`; `npm run tauri:build`; commit; `git tag vX.Y.Z`; push branch and tag.
2. In **this repo**: add the `## [X.Y.Z] - YYYY-MM-DD` section to `CHANGELOG.md` (include the date the installer is posted), copy the freshly built `packages/cli/bin/cli.cjs` and `paw-prints.cjs` into `cli/`, copy the built `.exe` to `releases/vX.Y.Z/Dev-Autographs_X.Y.Z_x64-setup.exe` and write its `.sha256` next to it (`Get-FileHash -Algorithm SHA256`), update the download line at the top of this README, commit, `git tag vX.Y.Z`, push branch and tag.
3. The tag push runs **Build and release Windows installer**, job `publish-prebuilt`: it creates the GitHub Release from the committed `.exe` and `.sha256` with the changelog section as the body. No secrets needed.

Building on GitHub instead: **Actions > Build and release Windows installer > Run workflow** with the Dev-Autographs ref and the version. Dev-Autographs is a private repo, so this path needs a repo secret `INSTALLER_RELEASE_TOKEN` (fine-grained PAT, Contents: read on Dev-Autographs, Contents: write here).

### Moving the registry

Edit `registry.json` at the Dev-Autographs root, run `npm run registry:sync`, rebuild. The website has its own copy in `src/registry.js`. Nothing else needs to change; users never see or edit the URL.

## Manual build

```bash
git clone https://github.com/Creal212/Dev-Autographs.git
cd Dev-Autographs
npm install && npm run build
npm run tauri:build
```

The installer lands in `apps/desktop/src-tauri/target/release/bundle/nsis/`.

## Security notes

- Signing keys are device-bound. The desk, CLI or browser mints the Ed25519 pair and sends only the public half. The private key lives in `%USERPROFILE%\.dev-autographs\identity.json` (or the browser's storage for the web desk) and is destroyed on Unlink.
- All signed requests carry a fresh timestamp and are replay-guarded on the registry.
- The desk and the registry's HTML pages ship a strict Content-Security-Policy.
- Per-IP rate limits on every route, with tighter buckets for writes, signature verification and operator routes.

## Repos

| Repo | Role |
|---|---|
| [Dev-Autographs](https://github.com/Creal212/Dev-Autographs) | Desk, CLI, registry, extension (monorepo) |
| [Dev-Autographs-Website](https://github.com/Creal212/Dev-Autographs-Website) | Marketing site, web desk, lookup, verify |
| [Dev-Autographs-Installer](https://github.com/Creal212/Dev-Autographs-Installer) | This repo: releases, CLI bundle, changelog |

Meet the dev: https://www.creal589.dev/
