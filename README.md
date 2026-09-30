# Dev Autographs Installer

Windows desktop releases and the matching CLI for Dev Autographs.

**Current release: v0.2.22.** [Download and release notes](https://github.com/Creal212/Dev-Autographs-Installer/releases/tag/v0.2.22) · [SHA-256 manifest](releases/v0.2.22/release.json) · [Changelog](CHANGELOG.md)

This Windows release is **unsigned**: it has no Authenticode publisher certificate. SHA-256 checks detect differences from the published manifest; they do not establish an independently verified publisher or reproducible build. Windows may display an unknown-publisher warning.

Requirements: Windows 10/11 x64, [Node.js 20+](https://nodejs.org/) on PATH, and Git. The installer includes the desk, its CLI, and the WebView2 bootstrapper. The desk turns global hooks on after you link GitHub. The CLI installs hooks only when you pass `--hooks` or `--global`. Automatic Repo Ink is off by default.

**Version 0.2.22** stores the pre-push temporary file in the Windows temp folder as `dev-autographs-pre-push-...`, so Windows Security does not flag a dotted random file inside the hooks folder. The desk rewrites an older generated hook once after you update. One signing key still stays with the GitHub account.

## What the product verifies

Dev Autographs signs file content with a device key. Version 2 seals also authenticate the repository scope, exact file path and optional parent hash. The registry verifies a session-bound key-possession signature before associating an approved device key with GitHub's immutable account ID. Reports show valid signed evidence and registry status. They do not prove legal ownership, original authorship, an entire website's source coverage, or that a running page was built from those files.

The signing key is created on the computer. The registry stores an encrypted copy and does not return it from public pages. **Version 0.2.9 encrypts the Windows signing key at rest with DPAPI for the current Windows user.** The desktop and setup use the same CLI storage implementation. Existing plaintext identities are migrated only after encryption and decryption verification succeed, using an atomic encrypted replacement. Matching legacy copies are then removed; conflicting identities and concurrent changes cause a visible error. Chosen autograph/style settings are preserved. Non-Windows CLI identities remain mode-0600 files. Version 0.2.8 and earlier store plaintext keys in the user profile.

DPAPI does not stop a process already running as your Windows user from requesting decryption. Protect your Windows account and any exported setup script: the script contains an encoded private key and should be deleted after use. Unlink only removes local key files after the registry confirms revocation or acknowledges a signed request for an already inactive key; a network failure preserves the retry key. File deletion cannot guarantee physical erasure from SSDs, snapshots, or backups.

**Version 0.2.13 supports switching the active signing device through GitHub login without unlinking the previous device first.** Each new desktop or CLI login creates a fresh pending key. After GitHub approval, the CLI redeems the device-bound session, validates the account and key, and atomically saves the encrypted replacement. The registered autograph profile and known account key history are restored; existing local application settings are retained. The registry immediately rejects the previous key. An open desk checks every 15 seconds and on focus; an offline desk learns the change when it reconnects. Unknown registry status signs the UI out while preserving a recovery key.

A pending desktop login can retry a transient save failure while the attempt remains in memory. An expired/replaced attempt or app restart can require fresh GitHub login. Arbitrary identity imports still cannot replace a different identity: if an exported web setup encounters that conflict, sign in through the current desktop or CLI. That setup imports the browser's key; it does not create a separate device login. Two copies of the same private key are the same cryptographic signer. Local project paths, theme and other device preferences are not synchronized account data.

**After migration, do not downgrade to 0.2.8 or run an older desk/CLI concurrently.** Install the matching 0.2.9-or-newer desk and CLI together. An older helper is rejected instead of reporting a successful save. A copied encrypted identity is not a supported key transfer to another Windows user/machine; relink using the supported device flow. [Storage format and recovery boundaries](https://github.com/Creal212/Dev-Autographs/blob/main/docs/WINDOWS-KEY-STORAGE.md).

## Install, update and remove

| Operation | Behavior |
|---|---|
| Install | Installs program files for the current Windows user. Linking GitHub creates the local identity. The desk turns global hooks on and can put them back if they are removed. |
| Update | Replaces program files while preserving the identity and settings. On first identity access, 0.2.9 migrates a plaintext signing key to DPAPI storage; public profile fields remain readable. |
| Uninstall | Restores recorded Dev Autographs hooks before deleting program files. Ambiguous hook chains or missing prerequisites stop removal with an error. The profile identity remains; use Unlink first if you want registry revocation. |

The setup file installs the desk and a minified CLI. It does not install the product source tree. Hooks are plain shell scripts that call that local CLI. They do not download code. An unknown-publisher warning on this unsigned installer is the missing Authenticode certificate. Compare the setup hash with `release.json` before running it. The source policy is `docs/distribution-and-hooks.md` in the Dev Autographs source repository.

Commit hooks stage seal metadata before existing controls and verify the final index afterwards. Pushes publish actual outgoing Git objects without rewriting the checkout. Old generated wrappers stop before changes until explicitly upgraded with install-hooks. A hooked commit on a website writes the local Shift+D script into that commit. `sync-overlay` is the explicit refresh: it lists edits and does not stage them. `remove-overlay` restores recorded originals.

Foreign Git hooks are preserved. An ambiguous active hook plus backup is left intact for manual review. Historical local hooks installed by older versions were not inventoried: run `node <path-to-cli.cjs> remove-hooks` inside those repositories before removal. `remove-hooks --global` restores global hooks and local hooks recorded by v0.2.8 and later. Some IDEs can bypass Git hooks; check the ledger instead of assuming every IDE action publishes.

## Verify downloads

Each version directory and GitHub Release includes the installer, its `.sha256`, `cli.cjs`, `paw-prints.cjs`, `VERSION`, and `release.json`. The manifest records asset sizes, SHA-256 values and the source commit.

```powershell
Get-FileHash .\Dev-Autographs_0.2.22_x64-setup.exe -Algorithm SHA256
```

Compare that value with `release.json` and the `.sha256` file. Web desk setup uses the pinned version and checks both CLI hashes before writing files or executing them. There is no raw-main or mutable-latest fallback. Existing different local identities are preserved.

## Release procedure

1. In [Dev-Autographs](https://github.com/Creal212/Dev-Autographs), update desktop versions, run `npm ci`, `npm run build`, `npm test`, `npm run smoke:registry`, browser tests and native tests. Run `npm run tauri:build`. Inspect the installer and confirm its embedded CLI matches the tested bundle.
2. Commit all reviewed source and generated bundles. The source checkout must be clean, including untracked files.
3. In this repository run `node scripts/prepare-release.mjs <source-checkout> <built-installer.exe> 0.2.13` using a new version. This stages matching CLI files and a manifest; it does not independently prove the supplied EXE was built from that source.
4. Run `node scripts/verify-release.mjs v0.2.13`, commit/push the candidate to main without a release tag, and run the Windows installer acceptance workflow with that explicit target version. Verify both reports against the candidate commit, source commit and exact installer hash.
5. After required source checks and both VM jobs pass, update the changelog and README. Confirm the final documentation commit leaves every accepted payload unchanged, then push the new version tag. The tag workflow verifies the exact asset set, requires an explicit GitHub HTTP 404 before creation, and uses create-only publication with no overwrite fallback. A racing or existing release cannot be updated. API errors stop publication; upload failures require inspection before retrying.
6. Check the GitHub Release asset digests and freshly downloaded bytes, then deploy the website with the same pinned version. A CLI update requires a new release version.

The optional manual GitHub build requires an unused version tag already pushed to this repository and `INSTALLER_RELEASE_TOKEN` with read access to the source repository and write access here. Action revisions are pinned; the workflow builds and tests before packaging. Both publishing paths verify the tag and create a new release with its assets; neither can update an existing release. Run `node --test scripts/release.test.mjs scripts/publish-release.test.mjs` to exercise preparation, integrity, API-error and publication-race failures in isolated fixtures.

## Acceptance limits

The v0.2.13 installer passed 23 real silent lifecycle assertions on each of disposable Windows Server 2022 and 2025 VMs: clean install, v0.2.8 upgrade, independent-account DPAPI/CLI denial, ambiguous-hook uninstall refusal, successful uninstall, and cleanup. Identity, settings and foreign controls were preserved. [Verified run 36377599630](https://github.com/Creal212/Dev-Autographs-Installer/actions/runs/36377599630) tested exact committed release assets from 7ccaf191054741f837190193a28cfa40adf0b6d0, built from source e48b4574d23064741b526a8c4e8de9624e79a4d0. The installer SHA-256 is `364b446599a30e7d76236f61413465a1e31dc444f65633a6efbf8692763d757c`. The final release commit changes documentation only.

Device-switching regressions include actual CLI redemption against a local registry with synthetic approvals, native-to-CLI encrypted replacement, failed persistence and concurrent-identity protection. The integrated desktop Chromium suite passed 21 cases. These checks do not establish live GitHub OAuth behavior.

The manual [Windows installer acceptance workflow](.github/workflows/windows-acceptance.yml) defaults to committed `cli/VERSION`, or an explicit target version. [Scope, safety guards and evidence](docs/WINDOWS-ACCEPTANCE.md) describe its assertions. Local release/harness tests pass 38/38.

The installer remains unsigned. Interactive Windows 10/11, SmartScreen/UAC, a missing-WebView2 bootstrap, native login dialogs and live GitHub OAuth remain unverified. Hosted silent lifecycle evidence and hashes do not replace publisher signing or those interactive checks. DPAPI does not protect against code already running as the owning Windows user.

## Support and source

[Website and web desk](https://www.devautographs.com/) · [Source](https://github.com/Creal212/Dev-Autographs) · [589 ManCave support](https://discord.gg/WZCxhjPwE)

Report security issues privately as described in the source repository's SECURITY.md. GitHub Marketplace activation has separate provisioning, cancellation and data-deletion requirements; publishing this installer does not claim Marketplace approval.
