# Dev Autographs Installer

Windows desktop releases and the matching CLI for Dev Autographs.

**Current release: v0.2.9.** [Download and release notes](https://github.com/Creal212/Dev-Autographs-Installer/releases/tag/v0.2.9) · [SHA-256 manifest](releases/v0.2.9/release.json) · [Changelog](CHANGELOG.md)

This Windows release is **unsigned**: it has no Authenticode publisher certificate. SHA-256 checks detect differences from the published manifest; they do not establish an independently verified publisher or reproducible build. Windows may display an unknown-publisher warning.

Requirements: Windows 10/11 x64, [Node.js 20+](https://nodejs.org/) on PATH, and Git. The installer includes the desk, its CLI, and the WebView2 bootstrapper. Hook installation happens when you explicitly link/configure the desk.

## What the product verifies

Dev Autographs signs file content with a device key. Version 2 seals also authenticate the repository scope, exact file path and optional parent hash. The registry associates approved device keys with GitHub's immutable account ID. Reports show valid signed evidence and registry status. They do not prove legal ownership, original authorship, an entire website's source coverage, or that a running page was built from those files.

Private keys are generated on the device; the registry receives the public key. **Version 0.2.9 encrypts the Windows signing key at rest with DPAPI for the current Windows user.** The desktop and setup use the same CLI storage implementation. Existing plaintext identities are migrated only after encryption and decryption verification succeed, using an atomic encrypted replacement. Matching legacy copies are then removed; conflicting identities and concurrent changes cause a visible error. Chosen autograph/style settings are preserved. Non-Windows CLI identities remain mode-0600 files. Version 0.2.8 and earlier store plaintext keys in the user profile.

DPAPI does not stop a process already running as your Windows user from requesting decryption. Protect your Windows account and any exported setup script: the script contains an encoded private key and should be deleted after use. Unlink only removes local key files after confirmed registry revocation; a network failure preserves the retry key. File deletion cannot guarantee physical erasure from SSDs, snapshots, or backups.

**After migration, do not downgrade to 0.2.8 or run an older desk/CLI concurrently.** Install the matching 0.2.9-or-newer desk and CLI together. An older helper is rejected instead of reporting a successful save. A copied encrypted identity is not a supported key transfer to another Windows user/machine; relink using the supported device flow. [Storage format and recovery boundaries](https://github.com/Creal212/Dev-Autographs/blob/main/docs/WINDOWS-KEY-STORAGE.md).

## Install, update and remove

| Operation | Behavior |
|---|---|
| Install | Installs program files for the current Windows user. Linking GitHub creates the local identity and installs hooks with visible error/retry handling. |
| Update | Replaces program files while preserving the identity and settings. On first identity access, 0.2.9 migrates a plaintext signing key to DPAPI storage; public profile fields remain readable. |
| Uninstall | Restores recorded Dev Autographs hooks before deleting program files. Ambiguous hook chains or missing prerequisites stop removal with an error. The profile identity remains; use Unlink first if you want registry revocation. |

Foreign Git hooks are preserved. An ambiguous active hook plus backup is left intact for manual review. Historical local hooks installed by older versions were not inventoried: run `node <path-to-cli.cjs> remove-hooks` inside those repositories before removal. `remove-hooks --global` restores global hooks and local hooks recorded by v0.2.8 and later. Some IDEs can bypass Git hooks; check the ledger instead of assuming every IDE action publishes.

## Verify downloads

Each version directory and GitHub Release includes the installer, its `.sha256`, `cli.cjs`, `paw-prints.cjs`, `VERSION`, and `release.json`. The manifest records asset sizes, SHA-256 values and the source commit.

```powershell
Get-FileHash .\Dev-Autographs_0.2.9_x64-setup.exe -Algorithm SHA256
```

Compare that value with `release.json` and the `.sha256` file. Web desk setup uses the pinned version and checks both CLI hashes before writing files or executing them. There is no raw-main or mutable-latest fallback. Existing different local identities are preserved.

## Release procedure

1. In [Dev-Autographs](https://github.com/Creal212/Dev-Autographs), update desktop versions, run `npm ci`, `npm run build`, `npm test`, `npm run smoke:registry`, browser tests and native tests. Run `npm run tauri:build`. Inspect the installer and confirm its embedded CLI matches the tested bundle.
2. Commit all reviewed source and generated bundles. The source checkout must be clean, including untracked files.
3. In this repository run `node scripts/prepare-release.mjs <source-checkout> <built-installer.exe> 0.2.9` using a new version. This stages matching CLI files and a manifest; it does not independently prove the supplied EXE was built from that source.
4. Update the changelog and README, run `node scripts/verify-release.mjs v0.2.9`, review and commit only release changes, then push main and the new version tag. The tag workflow verifies the exact asset set, requires an explicit GitHub HTTP 404 before creation, and uses create-only publication with no overwrite fallback. A racing or existing release cannot be updated. API errors stop publication; upload failures require inspection before retrying.
5. Check the GitHub Release asset digests and then deploy the website with the same pinned version. A CLI update requires a new release version.

The optional manual GitHub build requires an unused version tag already pushed to this repository and `INSTALLER_RELEASE_TOKEN` with read access to the source repository and write access here. Action revisions are pinned; the workflow builds and tests before packaging. Both publishing paths verify the tag and create a new release with its assets; neither can update an existing release. Run `node --test scripts/release.test.mjs scripts/publish-release.test.mjs` to exercise preparation, integrity, API-error and publication-race failures in isolated fixtures.

## Acceptance limits

Synthetic Windows tests verify real DPAPI encryption/decryption, signing, CLI/native process interoperability, migration, concurrent-write rejection, and preservation after failed revocation. Those checks do not establish a completed interactive installer lifecycle. A clean install, update and uninstall in an isolated Windows Sandbox/VM, and decryption attempted as a second Windows user, have **not been run** for this release preparation. No provisioned Sandbox/VM was available on the build machine. The installer remains unsigned; hash checks and archive inspection do not replace publisher signing or those runtime acceptance checks.

The manual [Windows installer acceptance workflow](.github/workflows/windows-acceptance.yml) tests an upgrade from v0.2.8 to the committed `cli/VERSION` (or an explicit target version), fresh installation, foreign-hook preservation, real uninstall and second-account DPAPI denial on disposable GitHub Windows VMs. A complete passing hosted run is pending. [Test scope, guards and remaining boundaries](docs/WINDOWS-ACCEPTANCE.md) explain the distinction between local harness checks and passing installer runtime evidence.

## Support and source

[Website and web desk](https://www.devautographs.com/) · [Source](https://github.com/Creal212/Dev-Autographs) · [589 ManCave support](https://discord.gg/WZCxhjPwE)

Report security issues privately as described in the source repository's SECURITY.md. GitHub Marketplace activation has separate provisioning, cancellation and data-deletion requirements; publishing this installer does not claim Marketplace approval.
