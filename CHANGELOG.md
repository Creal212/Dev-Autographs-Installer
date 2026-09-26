# Changelog

All notable changes to the Dev Autographs desk, CLI, registry and web desk.
Dates are the day the installer was posted (UTC). Format follows Keep a Changelog; versions follow SemVer.

## [0.2.2] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.2` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.2/Dev-Autographs_0.2.2_x64-setup.exe` (5.3 MB), SHA-256 `D3C18D60834B081C3778A3C480ACC440F87B3D75C4A9206F6B1C5E9075528016`.

### Installer: update vs fresh vs uninstall
- **Update** (app already present): wizard copy and a pre-install note make clear only program files are replaced. `%USERPROFILE%\.dev-autographs` (identity, locked marks, ledger cache, settings) is never overwritten.
- **Fresh install**: explains where identity will live after Ink; later updates still leave that folder alone.
- **Uninstall**: prompts to close the desk and any background sessions (`paw-prints agent` / Node) before continuing; then Tauri’s running-app check can close the main exe. Uninstall does not delete the identity folder. The optional “delete app data” checkbox is labeled as **WebView cache only**.

### Installer look
- Wizard header and welcome sidebar redrawn in the Exercise Book palette (cream ruled page, vermilion margin, stamp icon) to match the desk app.

### Registry: durable store and sync
- Production registry requires `DATABASE_URL` (Postgres). Without it, boot fails closed so marks and ledger cannot wipe on redeploy. `/v1/public-config` reports `"durableStore": true` when healthy.
- Marks and account summary sync across devices after Ink (`/v1/accounts/summary` + device token). Same locked words and ledger on app and web desk.
- Per-user rate limits (generous) sit on top of per-IP buckets so one busy account does not starve others.

### Web desk
- Early “go to desk” no longer races the Ink return: pending link is kept in localStorage, the opener is focused, and resume polling keeps the session linked if you leave before the token lands.
- Paper stock follows time of day when theme is **auto** (light 6am–6pm local, kraft at night) — same behavior as the desktop desk.

## [0.2.1] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.1` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.1/Dev-Autographs_0.2.1_x64-setup.exe` (5.3 MB), SHA-256 `F9A92CC517A50C81B3FD95D58B540DB9EF1C63176C52F69F4E2FCD3ECF0257CD`.

### Desk stability
- No more Windows console flashes: Node/git child processes use `CREATE_NO_WINDOW`. Ledger refresh uses in-process HTTPS instead of spawning `curl.exe`.
- Stopped re-running install-hooks on every settings/focus tick (that was the freeze + terminal pop-up loop).
- Ledger numbers come from the registry when reachable. A wiped registry no longer leaves the desk showing stale local seals as if they were live.
- After Ink, locked autograph words already on this PC are pushed back to the registry so they do not fall back to defaults.
- CLI inside the installer is minified (no source maps / comments).

### Required ops note
The hosted registry must have `DATABASE_URL` (Railway Postgres) or every redeploy resets accounts, marks and seals. Confirm `/v1/public-config` shows `"durableStore": true`.

## [0.2.0] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.0` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.0/Dev-Autographs_0.2.0_x64-setup.exe` (4.8 MB), SHA-256 `E9C725EB9AF22D0649F4316B112C03DB24D5486D90894BA618A4C99115409175`.

### Accounts: last Ink wins
- One GitHub account, any device. Inking on a new device takes the signer seat; the registry records the old key under `keyHistory` on the account.
- New endpoint `GET /v1/auth/device/status?public_key=` answers `active`, `replaced`, `disabled` or `unknown`. The desk, the web desk and the git hooks poll it.
- A replaced desk unlinks itself and shows a red notice: "Someone inked @you on another device... If that was not you, change your GitHub password and turn on 2FA, then Ink again here." The CLI prints the same on commit and push.
- `/v1/seals` and `/v1/ledger/publish` now answer `403 signer_replaced` with the replacement time instead of a generic `unknown_signer`.
- Ledger credit follows the account: `/v1/accounts/summary` counts seals made with any key the GitHub login ever held and lists `pastFingerprints`. The local per-repo tally (`~/.dev-autographs/repos.json`) also counts earlier device keys and the locked autograph word, so "sealed files" no longer drops after a re-ink.
- Unlink disables the registry key first, then shreds the local identity, so a fresh Ink is always possible.

### Autograph words
- Words lock after the first save. Changing them asks for confirmation ("Yes, unlock").
- Code mark and repo mark are unique across all accounts and both slots. A word taken by anyone, in either slot, is refused with `409 mark_taken`.
- The same account cannot use one word for both slots (`400 mark_collision`).
- Locked words survive re-ink, unlink, and new devices. The registry is the source of truth; desk and CLI mirror it.

### Web desk (new)
- `/desk.html` on the website is a browser clone of the app: Ink GitHub (Ed25519 key minted with WebCrypto, registry sees the public half only), lock autograph words, read the ledger, unlink.
- One-time setup downloads for Windows (`.ps1`) and macOS/Linux (`.sh`) that write `~/.dev-autographs/identity.json`, fetch the single-file CLI from this repo (`cli/`), and install the global git hooks. After that, commits are sealed and pushes publish exactly like the app.
- Same "signed in elsewhere" notice as the desk.

### Registry hardening
- Themed notice pages (OAuth failed, expired link, expired device code, old client, start from the app) in the Exercise Book style with a nonce CSP. No more bare HTML.
- Rate limits by route class on top of the global per-IP bucket: `write` (seals, publish, repo ink, mark profile, attestations, appearances) 30/min, `verify` (verify, hash, bulk lookup) 30/min, `admin` (dumps, Slack) 10/min, `auth` 20/min. All tunable with `RATE_LIMIT_*_PER_MIN`.
- Public CORS for read-only `GET /v1/accounts`, `/v1/track`, `/v1/verify` so the website lookup pages work from any origin.

### Registry URL is no longer user-editable
- The hosted registry lives in one file: `registry.json` at the Dev-Autographs repo root. `npm run registry:sync` (part of `npm run build`) writes the generated copies for the desk, CLI and browser extension; the Tauri shell reads it at compile time.
- The Stamp Room no longer shows a URL or an Advanced override. The extension popup no longer has a Registry URL field. The website ignores `?registry=` unless it runs on localhost.
- Removed `.env.production` and the `VITE_DEV_AUTOGRAPHS_API` CI variable; the release workflow needs no registry configuration.

### Desk
- UI refreshes after Ink, Save and lock, and on window focus. No manual refresh needed.
- The installer now ships the CLI (`cli.cjs`, `paw-prints.cjs`) next to the exe. 0.1.0 installs could not install hooks because the desk looked for a CLI that was never packaged.
- Version 0.2.0.

### CLI and hooks
- Node is started with `NODE_USE_SYSTEM_CA=1` (hooks, desk, and a self re-exec when run by hand) so it trusts the Windows/macOS certificate store. Antivirus HTTPS scanners such as Norton re-sign TLS with a local root; before this every registry call failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` and pushes sealed but never published.
- `~/.dev-autographs/settings.json` `apiBase` is ignored. The registry comes from `registry.json` only; maintainers use `DEV_AUTOGRAPHS_REGISTRY=` in the shell for local testing.
- `doctor` prints registry reachability and whether this device still holds the signer seat.
- `PAWPRINTS_ALLOW_OFFLINE_PUSH=1` now also lets a push through when the registry rejects the publish (`unknown_signer`, `signer_replaced`), as the hook message already claimed.

### Installer repo
- `cli/cli.cjs` and `cli/paw-prints.cjs` are published here so the web desk setup script can fetch them.
- Release workflow builds from the matching Dev-Autographs tag, attaches a `.sha256` file and takes release notes from this changelog.

## [0.1.0] - 2026-09-20

- First public Windows installer (NSIS, current-user install, branded wizard).
- Desk: Ink GitHub via device code, autograph studio, Stamp Room, Meet the dev.
- CLI bundled for global git hooks: seal on commit, publish on push, Shift + D overlay.
- Registry with device-bound Ed25519 keys, GitHub OAuth device confirm page, mark uniqueness.
