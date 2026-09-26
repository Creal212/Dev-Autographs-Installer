# Changelog

All notable changes to the Dev Autographs desk, CLI, registry and web desk.
Dates are the day the installer was posted (UTC). Format follows Keep a Changelog; versions follow SemVer.

## [0.2.0] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.0` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.0/Dev-Autographs_0.2.0_x64-setup.exe` (4.8 MB), SHA-256 `391C74E9647959FB5AA673D02F168D6D8A332B6ABCD6AE78DC55E93DDB899EA6`.

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
- Version 0.2.0.

### Installer repo
- `cli/cli.cjs` and `cli/paw-prints.cjs` are published here so the web desk setup script can fetch them.
- Release workflow builds from the matching Dev-Autographs tag, attaches a `.sha256` file and takes release notes from this changelog.

## [0.1.0] - 2026-09-20

- First public Windows installer (NSIS, current-user install, branded wizard).
- Desk: Ink GitHub via device code, autograph studio, Stamp Room, Meet the dev.
- CLI bundled for global git hooks: seal on commit, publish on push, Shift + D overlay.
- Registry with device-bound Ed25519 keys, GitHub OAuth device confirm page, mark uniqueness.
