# Code Ink Installer

Windows **NSIS** packaging and GitHub Releases for [Code Ink](https://github.com/Creal212/Code-Ink).

This repo does **not** contain the app source. It holds:

- Release notes / version tags
- Built `.exe` installers (via GitHub Releases — do not commit large binaries to `main` unless needed)
- Optional CI that builds from `Code-Ink` and publishes here

## Build (from Code-Ink monorepo)

```bash
git clone https://github.com/Creal212/Code-Ink.git
cd Code-Ink
npm install && npm run build
npm run tauri:build -w @code-ink/desktop
```

Installer output:

`apps/desktop/src-tauri/target/release/bundle/nsis/*.exe`

Attach that file to a [Release](https://github.com/Creal212/Code-Ink-Installer/releases) on this repo.

## Download

End users should use:

https://github.com/Creal212/Code-Ink-Installer/releases/latest

The marketing / device-login site is [Code-Ink-Website](https://github.com/Creal212/Code-Ink-Website).

## Repos

| Repo | Role |
|---|---|
| [Code-Ink](https://github.com/Creal212/Code-Ink) | Main product (desktop + CLI + ledger) |
| [Code-Ink-Website](https://github.com/Creal212/Code-Ink-Website) | Installer website |
| [Code-Ink-Installer](https://github.com/Creal212/Code-Ink-Installer) | This repo — releases |
