# Changelog

All notable changes to the Dev Autographs desk, CLI, registry and web desk.
Dates are the day the installer was posted (UTC). Format follows Keep a Changelog; versions follow SemVer.

## [0.2.12] - 2026-09-27

Device-key possession, signature ownership isolation and explicit signing behavior. Source `bfc8682a63e256ec131d7c8ee56b3bb967a83f8a`; exact asset hashes are in `releases/v0.2.12/release.json`. The installer remains unsigned.

- Require a signed server-issued device challenge before GitHub approval/account binding and token redemption. Approved proved sessions can resume safely. Older clients must update.
- Reserve new visible basic Latin wording across immutable accounts. Keep all known key ownership history; moving signature wording preserves the account's history and releases only the old wording. Reclaiming that wording grants no old owner's records. Transfer history requires the current owner key; existing public signed copies can retain former wording.
- Preserve first-time drafts and reject stale browser/native account responses, saves and unlink operations.
- Linking installs no hooks; choose local or global signing explicitly. Automatic Repo Ink requires opt-in. Old generated wrappers stop safely until explicitly upgraded.
- Stage only signature metadata at commit, run preserved controls against that index, then reject changed or removed signed evidence. Publish exact outgoing Git versions without changing the checkout.
- Make website embedding explicit, unstaged, ownership-checked and reversible. Never silently overwrite foreign or edited output files. Report attribution uses signer keys and scoped paths, not matching display wording.
- Reject noncanonical key/signature encodings and malformed contribution claims, bound overlay downloads, and ship a standalone bundled verifier.

Exact release assets passed 23 actual installer assertions per Windows Server 2022/2025 VM in run36342507762, including independent-account key decryption denial, preserved controls and safe cleanup. Interactive Windows 10/11, live OAuth and publisher signing remain separate limits. Marketplace remains disabled. This release does not establish universal feature acceptance or freedom from unknown vulnerabilities.

## [0.2.11] - 2026-09-27

Security, availability and provenance correctness. Canonical source `506816cae72ac3a1a04dd993cf6c7520f83ab503` and asset hashes are recorded in `releases/v0.2.11/release.json`. The Windows installer remains unsigned.

- Verify Repo Ink against GitHub's immutable current owner ID and complete repository metadata. Recheck authorization after provider requests, without holding the registry lock during those requests.
- Keep repository histories separate. Matching client-asserted content hashes cannot block another repository owner; related claims are nonexclusive. Preserve superseded history and make transferred repositories revocable by their current owner.
- Bound store queues, database locks, queries and whole operations. Expired work cannot write later or return a late success. Check deferred constraints while rollback remains available; do not automatically retry writes after an uncertain COMMIT acknowledgement.
- Validate signatures before reading source files for CLI/Action attestations; verify current bytes, canonical paths, file types and size bounds. Count path aliases once and label key-only evidence L1.
- Split CLI publication within both record and body limits, retain retry state after partial failure, preserve dotted GitHub repository names, and protect generated outputs from repository-provided links.
- Validate pending browser keys before login, preserve damaged storage and retry keys, and bound registry responses. Recover stalled overlays with visible retry controls and reject stale responses after reopening.
- Pass real silent install, upgrade, foreign-account DPAPI denial, hook refusal/restoration and uninstall checks on Windows Server 2022/2025 using the exact committed installer. Interactive Windows 10/11 and live OAuth remain unverified.

This release keeps Marketplace disabled. The singleton JSON ledger and process-local rate limits remain scaling constraints. Local load measurements are workload evidence, not a production capacity guarantee.

## [0.2.10] - 2026-09-27

Browser session integrity, automatic Marketplace reconciliation and local fonts. Canonical source `a0e88b0486081b8e515b5aee4f46b6e76fa146ec` and exact asset hashes are recorded in `releases/v0.2.10/release.json`. The Windows installer remains unsigned.

- Bind late browser mark/unlink/status/login replies to the identity and attempt that began them; preserve newer accounts, keys and pending connections.
- Preserve malformed or incomplete stored browser identities instead of replacing them during login. Prevent old summaries from undoing a newer saved mark; bind fingerprints and verification results to current input.
- Add automatic Marketplace reconciliation with committed leases, bounded batches, failure backoff, fail-closed freshness and backlog diagnostics. Stale worker/admin/webhook snapshots cannot cancel a newer purchase. Marketplace remains disabled pending live provider and policy acceptance.
- Bundle the desktop's existing font families and serve website fonts locally with original licenses and SHA-256 provenance. Remove Google font/style permissions from their CSPs. Generated overlays in other projects retain their own configuration.
- Backport the exact upstream two-line GLib iterator fix for Linux while retaining the original 0.18.5 version/license. Optimized regressions pass; reverting only the fix reproduces SIGSEGV. This is not full Linux desktop release acceptance or an automatic advisory dismissal.
- Add guarded real NSIS install/update/uninstall and independent-Windows-account DPAPI acceptance on disposable hosted runners. Both Windows Server 2022/2025 jobs passed in run36334025464 against the exact 0.2.10 assets. Interactive Windows 10/11, SmartScreen and live OAuth remain separate gates.

DPAPI, matching CLI storage and safe hook restoration continue from 0.2.9. After protected identity migration, do not downgrade to 0.2.8. This release does not activate a Marketplace listing or promise zero vulnerabilities.

## [0.2.9] - 2026-09-27

Windows key-storage, Marketplace preparation and recovery hardening. Asset checksums and canonical source commit `cb5dc3e1716fc6d85608182c0f9aabcf85b07cfa` are recorded in `releases/v0.2.9/release.json`. The installer remains unsigned (no Authenticode publisher certificate).

- Encrypt the Windows signing private key at rest with DPAPI scoped to the current Windows user. Desktop and setup import identity JSON through the matching CLI's stdin, without plaintext key arguments or temporary identity files. Non-Windows CLI storage remains mode0600.
- Migrate existing plaintext identities only after verified encryption and atomic persistence; retire matching legacy/backups after success. Preserve chosen marks/style, public key history and immutable-account GitHub renames. Refuse different identities, malformed protected keys, unsafe links and concurrent changes.
- Read public profile metadata without decrypting an already protected key. Propagate protected-key read failures instead of generating a replacement key. Validate the helper's explicit signer/storage success response so an older incompatible CLI cannot falsely report a successful save.
- Save local mark changes only after registry acceptance. Preserve concurrent local edits, retain keys after failed revocation, and coordinate cleanup through the storage lock without modifying hard-link targets.
- Publish releases through a create-only path with verified assets and an existing version tag. Only an explicit HTTP404 permits creation; API/auth/network failures stop publication. Existing or racing releases are never updated, and no asset-overwrite fallback is used.
- Add actual Windows DPAPI and native-to-CLI interoperability tests, stdin import and failed profile-publication regressions, plus isolated release-creation/error/race tests.
- Add disabled-by-default personal-account Marketplace purchase verification, signed lifecycle webhooks, cancellation replay protection, operator reconciliation/maintenance and explicitly confirmed purge. Activation still requires configured plans/secrets and an agreed customer-data policy.
- Fix browser re-login completion and overlapping-tab cleanup; an older login cannot cancel a newer pending attempt. Slow GitHub purchase requests no longer hold the registry store lock.
- Add scoped database CA/name verification and encrypted backup/empty-target restore tooling, with real TLS and PostgreSQL failure tests.

**Upgrade boundary:** after 0.2.9 migrates an identity, do not downgrade to 0.2.8 or run an older desk/CLI concurrently. Install matching 0.2.9-or-newer components. DPAPI protects the key at rest, not against code already running as the same Windows user. Exported setup scripts still contain an encoded private key; delete them after use. File deletion does not guarantee physical erasure from backups or SSDs.

Known acceptance limits: isolated NSIS clean install/update/uninstall and an actual second-Windows-user decryption attempt have not been run during release preparation; no provisioned Sandbox/VM was available. Authenticode signing, live GitHub OAuth acceptance, and Marketplace activation remain separate release/operational checks. Historical unrecorded local Git hooks still require explicit migration/removal. Linux desktop remains uncleared because of the GTK/glib dependency advisory.

## [0.2.8] - 2026-09-27

Security and reliability release. Windows installer remains unsigned (no Authenticode certificate). Asset hashes and source revision are recorded in `releases/v0.2.8/release.json`.

- Bind new seals to repository scope, exact file path and parent hash; retain honest legacy verification. Use immutable GitHub IDs for account ownership and refuse recycled-handle history claims.
- Persist registry changes before success responses; serialize PostgreSQL writers; reject corrupt stores, oversized/slow bodies and replayed approvals. Normalize fingerprint lookups and make ambiguous lineage explicit.
- Preserve foreign Git hooks and stdin, refuse ambiguous upgrades, handle deletion-only/new/multi-branch pushes, and sign index/outgoing Git blobs. Stop auto-staging untracked or partially staged shells. Restore recorded hooks on uninstall.
- Keep keys after failed unlink, remove legacy backups on successful cleanup, and make cleanup retryable. Confirm code/repository mark transfers, freeze confirmed inputs, preserve settings after failed saves, and surface hook-install failures.
- Verify overlay/report evidence, authenticate Action inputs/content/path confinement, label key-only evidence L1, and reject mismatched issuer keys. Fix Vue/Svelte/Next/Astro/Remix/Django integration paths.
- Pin web setup to one release and verify both CLI asset hashes before installation. Remove mutable latest-release asset uploads. Add privacy/support pages and executable security, browser, database, hook and framework regressions.

Known boundaries: profile keys are not DPAPI encrypted; historical unrecorded local hooks need explicit migration/removal; real GitHub OAuth and interactive Windows install/update/uninstall still require release-environment acceptance. Linux desktop remains uncleared because of the GTK/glib dependency advisory. Marketplace provisioning/cancellation/deletion policy and production TLS configuration are separate activation gates.

## [0.2.7] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.7` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.7/Dev-Autographs_0.2.7_x64-setup.exe` (5.3 MB), SHA-256 `D918BAC2B55A23D6DEFB6D56079D92BDEA7FE85AF4C0A52796EE9F6B6CA5CB34`.

### Signature transfer UX
- During a transfer confirm, **Save and lock** is disabled (that button is for first-time signatures). Use the highlighted **Yes, transfer and lock**.
- Transfer banner is pulsed/highlighted so it is hard to miss.
- Registry / CLI failures map to plain-language messages. Outdated desk or broken CLI install tells you to update before changing a signature.

## [0.2.6] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.6` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.6/Dev-Autographs_0.2.6_x64-setup.exe` (5.3 MB), SHA-256 `B14DA1930F41918FDEBAD917ECCD27FFAFD1B593821D20D3B3FEA4325135AE9A`.

### Agent 589 · Meet the Dev compliments
- When Agent 589 walks up to (or stands on) the Meet the Dev portrait — on the marketing site and in the desk app — he drops a witty compliment from a shuffled bag so lines do not repeat often.
- Opening the Meet tab in the desk also draws a random compliment.
- Twenty lines in the bag, including "Who is this handsome fella?"

## [0.2.5] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.5` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.5/Dev-Autographs_0.2.5_x64-setup.exe` (5.3 MB), SHA-256 `5D3919005140B4601FB5366AD4AD85B4348EF6A064EB89854DAB2CAB340AF67B`.

### Signature transfer
- Changing a locked code mark **moves all credit** (seals + history under every key on the account) onto the new wording and **frees the old name** so someone else can claim it.
- Desk and web desk confirm before Save; the rename is logged under Signature changes / mark history.
- Honorary overlay groups by the current signature — retired names (e.g. `CR` after `Creal589`) no longer show as a second live person.
- Opening the desk once consolidates leftover credit still sitting on retired wording; seal publish also stamps the locked mark.

### Agent 589 prefs
- Stamp Room: show / mute tips / small size for the pixel guide. Preferences stay on this PC.

### Setup clarity & support
- After install → Ink GitHub → lock signatures, sit back and work as usual — hooks attach your mark on commit and push.
- Bug reports and help: [589 ManCave on Discord](https://discord.gg/WZCxhjPwE).

## [0.2.4] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.4` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.4/Dev-Autographs_0.2.4_x64-setup.exe` (5.3 MB), SHA-256 `E5686D0FAA7AE5AA5D9EC50FD4C843B9BCC46D1C692F68CFF8B2569D4E96E085`.

### Desk runs from any install drive
- CLI spawn resolves absolute `node.exe` + `cli.cjs` next to the desk on any drive (C:, D:, E:, USB, paths with spaces). No more drive-letter `EISDIR` when saving marks.

### Signatures: starter only for new accounts
- Starter initials apply only when the account has **no attached (locked) signature**.
- If a signature is already attached to the account, the desk and web desk show it and do not add, change, or reset it to defaults.
## [0.2.3] - 2026-09-26

Installer posted: **2026-09-26**. Tag `v0.2.3` on Dev-Autographs and Dev-Autographs-Installer.
File: `releases/v0.2.3/Dev-Autographs_0.2.3_x64-setup.exe` (5.3 MB), SHA-256 `E08F8B82FDC2175B41588B85D9F2C42DD564C29CDE11A33EDEF6D7E9F9B159CE`.

### Desk: save autographs on non-C: installs
- Fixed `EISDIR: illegal operation on a directory, lstat 'E:'` when saving signatures with the desk installed under a path like `E:\Dev Autographs`.
- CLI spawn now uses absolute `node.exe` + `cli.cjs`, pins cwd to the install folder, and no longer passes font stacks on the Windows command line (identity file is the source of truth for `mark-style`).

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
