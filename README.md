# Dev Autographs Installer

Windows **NSIS** packaging and GitHub Releases for [Dev Autographs](https://github.com/Creal212/Dev-Autographs).

This repo does **not** contain the app source. It holds release tags and `.exe` downloads.

## Hands-off release (CI)

1. Open **Actions → Build and release Windows installer → Run workflow**
2. Set `code_ink_ref` (e.g. `master`) and `version` (e.g. `v0.1.1`)
3. CI clones Dev-Autographs, builds Tauri NSIS, uploads to this repo’s Releases

Or push a `v*` tag on Dev-Autographs if you mirror that workflow there.

Optional GitHub Actions variable on this repo:

- `DEV_AUTOGRAPHS_REGISTRY_URL` — baked into the desktop build as `VITE_DEV_AUTOGRAPHS_API`

## Manual build

```bash
git clone https://github.com/Creal212/Dev-Autographs.git
cd Dev-Autographs
npm install && npm run build
npm run tauri:build -w @dev-autographs/desktop
```

Upload `apps/desktop/src-tauri/target/release/bundle/nsis/*.exe` to a Release here.

## Download

https://github.com/Creal212/Dev-Autographs-Installer/releases/latest

## Repos

| Repo | Role |
|---|---|
| [Dev-Autographs](https://github.com/Creal212/Dev-Autographs) | App + CLI |
| [Dev-Autographs-Backend-Registry](https://github.com/Creal212/Dev-Autographs-Backend-Registry) | Shared marks / locks |
| [Dev-Autographs-Website](https://github.com/Creal212/Dev-Autographs-Website) | Download + device login link |
| [Dev-Autographs-Installer](https://github.com/Creal212/Dev-Autographs-Installer) | This repo — releases only |
