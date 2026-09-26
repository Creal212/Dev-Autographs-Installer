# Code Ink Installer

Windows **NSIS** packaging and GitHub Releases for [Code Ink](https://github.com/Creal212/Code-Ink).

This repo does **not** contain the app source. It holds release tags and `.exe` downloads.

## Hands-off release (CI)

1. Open **Actions → Build and release Windows installer → Run workflow**
2. Set `code_ink_ref` (e.g. `master`) and `version` (e.g. `v0.1.1`)
3. CI clones Code-Ink, builds Tauri NSIS, uploads to this repo’s Releases

Or push a `v*` tag on Code-Ink if you mirror that workflow there.

Optional GitHub Actions variable on this repo:

- `CODEINK_REGISTRY_URL` — baked into the desktop build as `VITE_CODEINK_API`

## Manual build

```bash
git clone https://github.com/Creal212/Code-Ink.git
cd Code-Ink
npm install && npm run build
npm run tauri:build -w @code-ink/desktop
```

Upload `apps/desktop/src-tauri/target/release/bundle/nsis/*.exe` to a Release here.

## Download

https://github.com/Creal212/Code-Ink-Installer/releases/latest

## Repos

| Repo | Role |
|---|---|
| [Code-Ink](https://github.com/Creal212/Code-Ink) | App + CLI |
| [Code-Ink-Backend-Registry](https://github.com/Creal212/Code-Ink-Backend-Registry) | Shared marks / locks |
| [Code-Ink-Website](https://github.com/Creal212/Code-Ink-Website) | Download + device login link |
| [Code-Ink-Installer](https://github.com/Creal212/Code-Ink-Installer) | This repo — releases only |
