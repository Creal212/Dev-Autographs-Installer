# Released Windows installer acceptance

The **Windows installer acceptance** workflow runs the actual, checksum-verified
v0.2.8 and the chosen target installers on disposable GitHub-hosted Windows Server 2022 and
2025 VMs. It is manual (`workflow_dispatch`), uses a read-only repository token,
and does not require a signing key, OAuth credential, registry token, or real user
identity. The target defaults to committed `cli/VERSION`, or can be a specific
`target_version` such as `0.2.9` or `0.2.10`. It must be 0.2.9 or newer, with a
complete verified release directory in the checked-out revision.

**Verified 2026-09-27:** target v0.2.10 passed on both Windows Server 2022 and 2025
in [run36334025464](https://github.com/Creal212/Dev-Autographs-Installer/actions/runs/36334025464),
commit `a25848973dafc4ace9455483376056517e6d402c`. The target installer SHA-256 is
`bd039e5642a396dec191d11c7992ede3996f1239855b2c40d023809b004cce6e`, from canonical
source `a0e88b0486081b8e515b5aee4f46b6e76fa146ec`. Earlier runs exposed only harness
quoting/cross-volume bugs, now covered by local regressions; those partial runs
are not counted as completed acceptance.

Run the workflow from the reviewed default branch in GitHub Actions. Do not run
`windows-acceptance.ps1` on a developer computer, set fake runner variables to get
past its guards, or change `runs-on` to a self-hosted runner. The script refuses
an existing identity directory, product registration, shortcut, or desktop
process. Git's global configuration points to a fixture file. Node networking
is disabled, so synthetic signing keys cannot be registered with the service.

## Assertions

1. Clean silent v0.2.8 installation creates the native program, bundled CLI,
   Add/Remove Programs entry, and current-user desktop and Start Menu shortcuts
   at a path containing spaces. Installed CLI bytes match the release manifest.
2. The packaged v0.2.8 CLI creates a synthetic plaintext key, custom public style,
   settings, a matching legacy backup, and global/local hook chains that preserve
   existing foreign controls.
3. The real target `/S /UPDATE` installer replaces program files while leaving
   identity, settings, hooks and Git configuration unchanged. First identity
   access migrates the same key to DPAPI and removes the matching plaintext
   backup. Current-user decryption and Ed25519 signing work; source tampering fails
   verification.
4. A newly created, non-administrator Windows account runs its own successful
   DPAPI encrypt/decrypt probe, then fails to decrypt the original account's
   ciphertext. Its packaged CLI can read public profile fields but cannot return
   the protected signing key. A different SID, working independent DPAPI and an
   explicit cryptographic denial are required; ACL/file errors do not count.
5. A real NSIS uninstall confronted with a replaced foreign hook and an existing
   backup leaves both controls, the identity, program files and registration in
   place. The harness restores only its own test modification before retrying.
6. Successful NSIS removal deletes program files, owned shortcuts and the
   uninstall entry, retains the encrypted identity/settings, and restores the
   previous global/local controls and template. Actual Git commits then execute
   those foreign hooks.
7. A separate clean target installation creates no identity automatically. The
   packaged CLI creates a new DPAPI key directly. Repeated empty hook cleanup and
   real uninstall succeed while retaining that encrypted identity.

The `finally` cleanup removes the temporary account/profile and only marked,
owned test files and registry entries. Failure cleanup is never counted as a
successful product uninstall. GitHub then disposes of the VM. Uploaded artifacts
contain only sanitized pass/fail checks, version/hash/source metadata and cleanup
status. No profile directory, private key, raw subprocess output, or account
password is uploaded.

## Local checks and remaining boundaries

`node --test scripts/release.test.mjs scripts/publish-release.test.mjs scripts/windows-acceptance.test.mjs`
runs release-integrity/publication tests and the acceptance harness guard/parser
tests. These local checks intentionally never install the product or create a
Windows account.

Silent Windows Server lifecycle results do not establish interactive Windows
10/11, SmartScreen/UAC behavior, desktop login UI, or a missing-WebView2 bootstrap
scenario. The workflow records the runner image/version. Both published releases
remain unsigned, and hash checks do not supply an independent publisher identity.
DPAPI does not defend against software already executing as the owning Windows
user. The harness does not contact the production registry or exercise live
OAuth/Marketplace provisioning.

GitHub documents that these hosted Windows jobs receive fresh VMs with
[administrator access](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
The installer uses documented NSIS
[`/S`, `/D=` and `_?=` options](https://nsis.sourceforge.io/Docs/Chapter3.html);
the path-bearing options must be last and unquoted even when paths contain spaces.
