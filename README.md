# Dev Autographs Installer

Windows desktop releases and the matching CLI for Dev Autographs.

**Current release: v0.2.8.** [Download and release notes](https://github.com/Creal212/Dev-Autographs-Installer/releases/tag/v0.2.8) · [SHA-256 manifest](releases/v0.2.8/release.json) · [Changelog](CHANGELOG.md)

This Windows release is **unsigned**: it has no Authenticode publisher certificate. SHA-256 checks detect differences from the published manifest; they do not establish an independently verified publisher or reproducible build. Windows may display an unknown-publisher warning.

Requirements: Windows 10/11 x64, [Node.js 20+](https://nodejs.org/) on PATH, and Git. The installer includes the desk, its CLI, and the WebView2 bootstrapper. Hook installation happens when you explicitly link/configure the desk.

## What the product verifies

Dev Autographs signs file content with a device key. Version 2 seals also authenticate the repository scope, exact file path and optional parent hash. The registry associates approved device keys with GitHub's immutable account ID. Reports show valid signed evidence and registry status. They do not prove legal ownership, original authorship, an entire website's source coverage, or that a running page was built from those files.

Private keys are generated on the device. The registry receives the public key. Windows keys are stored in the user's profile and are **not DPAPI encrypted**. Protect your Windows account and any exported setup script. A setup script contains an encoded private key; delete it after use. Unlink only removes local key files after confirmed registry revocation; a network failure preserves the key for retry. Overwriting a file cannot guarantee physical erasure from SSDs or backups.

## Install, update and remove

| Operation | Behavior |
|---|---|
| Install | Installs program files for the current Windows user. Linking GitHub creates the local identity and installs hooks with visible error/retry handling. |
| Update | Replaces program files while preserving the profile identity and settings. |
| Uninstall | Restores recorded Dev Autographs hooks before deleting program files. Ambiguous hook chains or missing prerequisites stop removal with an error. The profile identity remains; use Unlink first if you want registry revocation. |

Foreign Git hooks are preserved. An ambiguous active hook plus backup is left intact for manual review. Historical local hooks installed by older versions were not inventoried: run `node <path-to-cli.cjs> remove-hooks` inside those repositories before removal. `remove-hooks --global` restores global hooks and local hooks recorded by v0.2.8. Some IDEs can bypass Git hooks; check the ledger instead of assuming every IDE action publishes.

## Verify downloads

Each version directory and GitHub Release includes the installer, its `.sha256`, `cli.cjs`, `paw-prints.cjs`, `VERSION`, and `release.json`. The manifest records asset sizes, SHA-256 values and the source commit.

```powershell
Get-FileHash .\Dev-Autographs_0.2.8_x64-setup.exe -Algorithm SHA256
```

Compare that value with `release.json` and the `.sha256` file. Web desk setup uses the pinned version and checks both CLI hashes before writing files or executing them. There is no raw-main or mutable-latest fallback. Existing different local identities are preserved.

## Release procedure

1. In [Dev-Autographs](https://github.com/Creal212/Dev-Autographs), update desktop versions, run `npm ci`, `npm run build`, `npm test`, `npm run smoke:registry`, browser tests and native tests. Run `npm run tauri:build`. Inspect the installer and confirm its embedded CLI matches the tested bundle.
2. Commit all reviewed source and generated bundles. The source checkout must be clean, including untracked files.
3. In this repository run `node scripts/prepare-release.mjs <source-checkout> <built-installer.exe> 0.2.8` using a new version. This stages matching CLI files and a manifest; it does not independently prove the supplied EXE was built from that source.
4. Update the changelog and README, run `node scripts/verify-release.mjs v0.2.8`, review and commit only release changes, then push main and the new version tag. The tag workflow verifies the exact asset set and publishes it once. Existing published releases are never replaced by the workflow.
5. Check the GitHub Release asset digests and then deploy the website with the same pinned version. A CLI update requires a new release version.

The optional manual GitHub build requires `INSTALLER_RELEASE_TOKEN` with read access to the source repository and write access here. Action revisions are pinned; the workflow builds and tests before packaging.

## Support and source

[Website and web desk](https://www.devautographs.com/) · [Source](https://github.com/Creal212/Dev-Autographs) · [589 ManCave support](https://discord.gg/WZCxhjPwE)

Report security issues privately as described in the source repository's SECURITY.md. GitHub Marketplace activation has separate provisioning, cancellation and data-deletion requirements; publishing this installer does not claim Marketplace approval.
