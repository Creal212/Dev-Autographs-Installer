# Real installer lifecycle tests. This script intentionally refuses local/self-hosted execution.
# Never set fake runner variables to execute it on a developer machine.
param([switch]$CheckOnly, [string]$TargetVersion = $env:ACCEPTANCE_TARGET_VERSION)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Keep this guard before directory creation, registry access, installation or account creation.
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_ENVIRONMENT -ne 'github-hosted' -or $env:RUNNER_OS -ne 'Windows' -or $env:GITHUB_REPOSITORY -ne 'Creal212/Dev-Autographs-Installer' -or $env:GITHUB_EVENT_NAME -ne 'workflow_dispatch') {
  throw 'Refusing installer acceptance outside an explicitly dispatched GitHub-hosted Windows runner.'
}
if (-not $IsWindows -or -not $env:RUNNER_TEMP -or -not $env:GITHUB_WORKSPACE -or $env:GITHUB_RUN_ID -notmatch '^\d+$') { throw 'Invalid Windows runner context.' }
$fixtureHelper = Join-Path $PSScriptRoot 'windows-acceptance-fixture.mjs'
$preflight = & node $fixtureHelper preflight
if ($LASTEXITCODE -ne 0) { throw 'Profile preflight refused to run. No installer or account operation was started.' }
$runnerProfile = $preflight | ConvertFrom-Json
if ($runnerProfile.home -ne [Environment]::GetFolderPath('UserProfile')) { throw 'The runner profile must match the current Windows account.' }
$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'A disposable hosted administrator is required for the second-user test.' }
$uninstallKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Dev Autographs'
$productKey = 'HKCU:\Software\Cyril Foday-Kailie\Dev Autographs'
$desktopLink = Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) 'Dev Autographs.lnk'
$startLink = Join-Path ([Environment]::GetFolderPath('Programs')) 'Dev Autographs\Dev Autographs.lnk'
foreach ($item in @($uninstallKey, $productKey, $desktopLink, $startLink)) {
  if (Test-Path -LiteralPath $item) { throw 'Existing Dev Autographs installation or shortcut found. Nothing was changed.' }
}
if (Get-Process -Name 'dev-autographs-desktop' -ErrorAction SilentlyContinue) { throw 'A real desktop session exists. Nothing was changed.' }
if ($CheckOnly) { Write-Output 'Hosted Windows/profile guards passed; no mutations performed.'; exit 0 }

$repository = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($TargetVersion)) { $TargetVersion = [IO.File]::ReadAllText((Join-Path $repository 'cli\VERSION')).Trim() }
$TargetVersion = & node $fixtureHelper target-version $TargetVersion
if ($LASTEXITCODE -ne 0) { throw 'Invalid target release; nothing was installed.' }
foreach ($tag in @('v0.2.8', "v$TargetVersion")) {
  & node (Join-Path $PSScriptRoot 'verify-release.mjs') $tag
  if ($LASTEXITCODE -ne 0) { throw 'Released bytes failed validation; nothing was installed.' }
}
$root = Join-Path $env:RUNNER_TEMP ('dev-autographs-acceptance-' + $env:GITHUB_RUN_ID + '-' + [Guid]::NewGuid().ToString('N'))
$install = Join-Path $root 'Installed Dev Autographs'
$other = Join-Path $root 'independent-user'
$identityDirectory = Join-Path $runnerProfile.home '.dev-autographs'
$reportDirectory = Join-Path $env:GITHUB_WORKSPACE 'acceptance-results'
$reportFile = Join-Path $reportDirectory ('windows-' + $env:ImageOS + '.json')
$report = [ordered]@{
  schema = 'dev-autographs-windows-acceptance-v1'; passed = $false
  baselineVersion = '0.2.8'; targetVersion = $TargetVersion
  runId = $env:GITHUB_RUN_ID; runAttempt = $env:GITHUB_RUN_ATTEMPT; commit = $env:GITHUB_SHA
  image = $env:ImageOS; imageVersion = $env:ImageVersion; osVersion = [Environment]::OSVersion.VersionString
  startedAt = (Get-Date).ToUniversalTime().ToString('o'); checks = [Collections.Generic.List[object]]::new()
  limitations = @('Silent NSIS lifecycle on GitHub Windows Server images; interactive Windows 10/11 and SmartScreen UI were not exercised.', 'No Authenticode publisher signing; this test does not add a trusted publisher.', 'DPAPI protects at rest across accounts, not against code already running as the owning Windows user.')
  cleanup = [ordered]@{ temporaryAccountRemoved = $null; temporaryUserProfileRemoved = $null; syntheticIdentityRemoved = $false; fixtureDirectoryRemoved = $false; ownedRegistrationRemoved = $false }
}
$createdUser = $null
$childSid = $null
$child = $null
$activeStep = 'initialize isolated fixtures'
$wrapperBefore = $null
$wrapperPath = $null
$success = $false
$originalEnv = @{}
foreach ($name in @('GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM', 'NODE_OPTIONS', 'PAWPRINTS_API', 'DA_ACCEPTANCE_HOOK_LOG')) { $originalEnv[$name] = [Environment]::GetEnvironmentVariable($name) }

function Add-Passed([string]$Name) {
  $report.checks.Add([ordered]@{name = $Name; passed = $true})
  Write-Host "PASS: $Name"
}
function Assert-True([bool]$Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
function Assert-OwnedPath([string]$Target) {
  $parent = [IO.Path]::GetFullPath($env:RUNNER_TEMP).TrimEnd('\') + '\'
  $full = [IO.Path]::GetFullPath($Target)
  $owned = [IO.Path]::GetFullPath($root).TrimEnd('\')
  if (-not $full.StartsWith($parent, [StringComparison]::OrdinalIgnoreCase) -or ($full -ne $owned -and -not $full.StartsWith($owned + '\', [StringComparison]::OrdinalIgnoreCase))) { throw 'Refusing a path outside the owned runner fixture.' }
  if ((Get-Item -LiteralPath $root).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Fixture root became a link.' }
}
function Invoke-Installer([string]$Executable, [string]$Arguments, [bool]$RequireSuccess = $true) {
  Assert-OwnedPath $install
  $process = Start-Process -FilePath $Executable -ArgumentList $Arguments -WorkingDirectory $root -WindowStyle Hidden -PassThru
  $null = $process.Handle
  if (-not $process.WaitForExit(240000)) {
    # Terminate only this timed-out fixture process and its children, never a name/global process list.
    & taskkill.exe /PID $process.Id /T /F | Out-Null
    throw 'Installer operation exceeded four minutes.'
  }
  $process.Refresh()
  $code = $process.ExitCode
  $process.Dispose()
  if ($RequireSuccess -and $code -ne 0) { throw "Installer exited with code $code." }
  return $code
}
function Invoke-Fixture([string]$Operation) {
  $output = & node $fixtureHelper $Operation $root $install $TargetVersion
  if ($LASTEXITCODE -ne 0) { throw "Synthetic fixture step failed: $Operation (private output suppressed)." }
  $result = $output | ConvertFrom-Json
  foreach ($check in $result.checks) { Assert-True $check.passed $check.name; Add-Passed $check.name }
}
function Assert-Installed([string]$Version) {
  foreach ($name in @('dev-autographs-desktop.exe', 'cli.cjs', 'paw-prints.cjs', 'uninstall.exe')) { Assert-True (Test-Path -LiteralPath (Join-Path $install $name)) "Missing installed file: $name" }
  $registration = Get-ItemProperty -LiteralPath $uninstallKey
  Assert-True ($registration.DisplayVersion -eq $Version) 'Wrong Add/Remove Programs version.'
  Assert-True ($registration.InstallLocation.Trim('"') -eq $install) 'Unexpected installation directory.'
  $binaryVersion = (Get-Item -LiteralPath (Join-Path $install 'dev-autographs-desktop.exe')).VersionInfo.ProductVersion
  Assert-True ($binaryVersion -match ('^' + [regex]::Escape($Version) + '(\.|$)')) 'Native executable version mismatch.'
  $shell = New-Object -ComObject WScript.Shell
  foreach ($link in @($desktopLink, $startLink)) {
    Assert-True (Test-Path -LiteralPath $link) 'Expected current-user shortcut was not created.'
    Assert-True ($shell.CreateShortcut($link).TargetPath -eq (Join-Path $install 'dev-autographs-desktop.exe')) 'Shortcut targets the wrong executable.'
  }
  Add-Passed "NSIS $Version installed native binary, registration and both current-user shortcuts"
}
function Invoke-Uninstall([bool]$RequireSuccess = $true) {
  # Running a byte-identical copy outside INSTDIR lets NSIS remove its original uninstaller.
  # _?= must be last and unquoted, including paths containing spaces (NSIS documented syntax).
  $copy = Join-Path $root 'acceptance-uninstaller.exe'
  Copy-Item -LiteralPath (Join-Path $install 'uninstall.exe') -Destination $copy -Force
  return Invoke-Installer $copy "/S _?=$install" $RequireSuccess
}
function Assert-Uninstalled {
  Assert-True (-not (Test-Path -LiteralPath $install)) 'Program directory remains after uninstall.'
  Assert-True (-not (Test-Path -LiteralPath $uninstallKey)) 'Add/Remove Programs entry remains.'
  foreach ($link in @($desktopLink, $startLink)) { Assert-True (-not (Test-Path -LiteralPath $link)) 'Owned shortcut remains.' }
  Add-Passed 'Real NSIS uninstall removed program files, registration and owned shortcuts'
}

try {
  New-Item -ItemType Directory -Path $root, $reportDirectory -Force | Out-Null
  Assert-OwnedPath $install
  $env:GIT_CONFIG_GLOBAL = Join-Path $root 'global.gitconfig'
  $env:GIT_CONFIG_NOSYSTEM = '1'
  $env:DA_ACCEPTANCE_HOOK_LOG = Join-Path $root 'foreign-hook-execution.log'
  $env:PAWPRINTS_API = 'http://127.0.0.1:1'
  # Refuse all Node networking; synthetic keys must never register/publish to a real service.
  $denyNetwork = Join-Path $root 'deny-network.cjs'
  @'
const fail = () => { throw new Error('Network is disabled in installer acceptance'); };
globalThis.fetch = fail;
for (const name of ['http', 'https']) { const api = require(name); api.request = fail; api.get = fail; }
const net = require('net'); net.connect = fail; net.createConnection = fail;
'@ | Set-Content -LiteralPath $denyNetwork -Encoding utf8NoBOM
  $preloadOption = & node $fixtureHelper node-options $denyNetwork
  if ($LASTEXITCODE -ne 0) { throw 'Could not configure isolated Node network guard.' }
  $env:NODE_OPTIONS = $preloadOption
  $oldInstaller = Join-Path $repository 'releases\v0.2.8\Dev-Autographs_0.2.8_x64-setup.exe'
  $newInstaller = Join-Path $repository "releases\v$TargetVersion\Dev-Autographs_${TargetVersion}_x64-setup.exe"
  $report.releaseInputs = @('v0.2.8', "v$TargetVersion") | ForEach-Object {
    $manifest = Get-Content -LiteralPath (Join-Path $repository "releases\$_\release.json") -Raw | ConvertFrom-Json
    $exe = Join-Path $repository "releases\$_\Dev-Autographs_$($manifest.version)_x64-setup.exe"
    [ordered]@{version = $manifest.version; sourceCommit = $manifest.sourceCommit; installerSha256 = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant(); authenticode = (Get-AuthenticodeSignature -LiteralPath $exe).Status.ToString()}
  }
  $activeStep = 'clean install 0.2.8'
  $null = Invoke-Installer $oldInstaller "/S /D=$install"
  Assert-Installed '0.2.8'
  Invoke-Fixture seed
  $activeStep = "real 0.2.8 to $TargetVersion update"
  $null = Invoke-Installer $newInstaller "/S /UPDATE /D=$install"
  Assert-Installed $TargetVersion
  Invoke-Fixture upgraded

  $activeStep = 'cross-user DPAPI denial'
  New-Item -ItemType Directory -Path $other -Force | Out-Null
  $name = 'da' + [Guid]::NewGuid().ToString('N').Substring(0, 14)
  $password = ConvertTo-SecureString ([Guid]::NewGuid().ToString('N') + 'aA9!') -AsPlainText -Force
  $createdUser = New-LocalUser -Name $name -Password $password -AccountNeverExpires -Description 'Temporary Dev Autographs acceptance fixture'
  $childSid = $createdUser.SID.Value
  Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $createdUser
  $credential = [Management.Automation.PSCredential]::new("$env:COMPUTERNAME\$name", $password)
  # This directory contains only test programs, public metadata and DPAPI ciphertext.
  & icacls.exe $other /grant "*${childSid}:(OI)(CI)M" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Could not grant the temporary test account its fixture directory.' }
  Copy-Item -LiteralPath $runnerProfile.node -Destination (Join-Path $other 'node.exe')
  Copy-Item -LiteralPath (Join-Path $install 'cli.cjs') -Destination (Join-Path $other 'cli.cjs')
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'windows-acceptance-home.cjs') -Destination (Join-Path $other 'home.cjs')
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'windows-dpapi-other-user.ps1') -Destination (Join-Path $other 'probe.ps1')
  $childIdentityDir = Join-Path $other 'profile\.dev-autographs'
  New-Item -ItemType Directory -Path $childIdentityDir -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $identityDirectory 'identity.json') -Destination (Join-Path $childIdentityDir 'identity.json')
  $encrypted = Get-Content -LiteralPath (Join-Path $identityDirectory 'identity.json') -Raw | ConvertFrom-Json
  [ordered]@{originalSid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value; expectedSid = $childSid; ciphertext = $encrypted.privateKeyProtected.ciphertext; publicKey = $encrypted.publicKey} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $other 'public-input.json') -Encoding utf8NoBOM
  Start-Service -Name seclogon
  $powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
  $arguments = '-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + (Join-Path $other 'probe.ps1') + '" -FixtureDirectory "' + $other + '"'
  $child = Start-Process -FilePath $powershell -Credential $credential -LoadUserProfile -WindowStyle Hidden -ArgumentList $arguments -WorkingDirectory $other -PassThru
  $null = $child.Handle
  if (-not $child.WaitForExit(90000)) { & taskkill.exe /PID $child.Id /T /F | Out-Null; throw 'Other-account probe timed out.' }
  $child.Refresh()
  $crossUser = Get-Content -LiteralPath (Join-Path $other 'result.json') -Raw | ConvertFrom-Json
  $report.crossUser = $crossUser
  Assert-True ($child.ExitCode -eq 0 -and $crossUser.passed -and $crossUser.differentSid -and $crossUser.ownDpapiWorks -and $crossUser.foreignDpapiDenied -and $crossUser.publicIdentityReadable -and $crossUser.cliSigningKeyDenied) 'Real cross-user DPAPI/CLI denial did not pass.'
  $child.Dispose()
  $child = $null
  Add-Passed 'A second real Windows account can use its own DPAPI but cannot decrypt or read the migrated signing key'
  Add-Passed 'Public identity remains readable by the second account without decrypting the key'

  $activeStep = 'fail-closed uninstall with an ambiguous foreign hook'
  $wrapperPath = Join-Path $identityDirectory 'hooks\pre-commit'
  $wrapperBefore = [IO.File]::ReadAllBytes($wrapperPath)
  $foreignReplacement = "#!/bin/sh`n# Synthetic foreign security control`nexit 1`n"
  [IO.File]::WriteAllText($wrapperPath, $foreignReplacement)
  $backupHash = (Get-FileHash -LiteralPath "$wrapperPath.da-previous" -Algorithm SHA256).Hash
  $identityHash = (Get-FileHash -LiteralPath (Join-Path $identityDirectory 'identity.json') -Algorithm SHA256).Hash
  $abortCode = Invoke-Uninstall $false
  $report.refusedUninstallExitCode = $abortCode
  Assert-True (Test-Path -LiteralPath (Join-Path $install 'dev-autographs-desktop.exe')) 'Ambiguous hooks did not preserve program files.'
  Assert-True (Test-Path -LiteralPath $uninstallKey) 'Aborted uninstall removed its registration.'
  Assert-True ([IO.File]::ReadAllText($wrapperPath) -eq $foreignReplacement) 'Aborted uninstall changed the new foreign control.'
  Assert-True ((Get-FileHash -LiteralPath "$wrapperPath.da-previous" -Algorithm SHA256).Hash -eq $backupHash) 'Aborted uninstall changed the previous control.'
  Assert-True ((Get-FileHash -LiteralPath (Join-Path $identityDirectory 'identity.json') -Algorithm SHA256).Hash -eq $identityHash) 'Aborted uninstall changed the identity.'
  Add-Passed 'Real NSIS uninstall refuses ambiguous hook chains and preserves both controls, identity and program files'
  [IO.File]::WriteAllBytes($wrapperPath, $wrapperBefore)
  $wrapperBefore = $null

  $activeStep = 'successful upgraded uninstall'
  $null = Invoke-Uninstall
  Assert-Uninstalled
  Invoke-Fixture uninstalled
  $activeStep = "clean install and uninstall $TargetVersion without previous identity/hooks"
  $null = Invoke-Installer $newInstaller "/S /D=$install"
  Assert-Installed $TargetVersion
  Invoke-Fixture fresh
  $null = Invoke-Uninstall
  Assert-Uninstalled
  Invoke-Fixture fresh-removed
  $success = $true
} catch {
  # Do not serialize exceptions or child output: they may contain a test private key.
  $report.failedStep = $activeStep
  $report.error = 'Acceptance failed. Raw command/key output was intentionally suppressed.'
  Write-Host "FAIL: $activeStep"
} finally {
  if ($wrapperBefore -and $wrapperPath -and (Test-Path -LiteralPath $wrapperPath)) { [IO.File]::WriteAllBytes($wrapperPath, $wrapperBefore) }
  if ($child) {
    if (-not $child.HasExited) { & taskkill.exe /PID $child.Id /T /F | Out-Null }
    $child.Dispose()
  }
  if ($createdUser) {
    try {
      Remove-LocalUser -SID $createdUser.SID
      $report.cleanup.temporaryAccountRemoved = -not [bool](Get-LocalUser -SID $createdUser.SID -ErrorAction SilentlyContinue)
      $userProfile = Get-CimInstance Win32_UserProfile | Where-Object SID -eq $childSid
      for ($attempt = 0; $userProfile -and $userProfile.Loaded -and $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        $userProfile = Get-CimInstance Win32_UserProfile | Where-Object SID -eq $childSid
      }
      if ($userProfile) {
        $expected = Join-Path (Split-Path -Parent $runnerProfile.home) $createdUser.Name
        Assert-True ($userProfile.LocalPath -eq $expected -and -not $userProfile.Loaded) 'Unexpected or still-loaded temporary user profile; leave it to VM disposal.'
        $userProfile | Remove-CimInstance
      }
      $report.cleanup.temporaryUserProfileRemoved = -not [bool](Get-CimInstance Win32_UserProfile | Where-Object SID -eq $childSid)
    } catch { $success = $false; $report.cleanup.temporaryUserProfileRemoved = $false }
  }
  # Delete only our marked synthetic identity, never an unrecognized profile.
  try {
    # Remove leftover fixture registration only after verifying its exact owned install target.
    # This cleanup is not counted as a successful product uninstall.
    if (Test-Path -LiteralPath $uninstallKey) {
      Assert-True ((Get-ItemProperty -LiteralPath $uninstallKey).InstallLocation.Trim('"') -eq $install) 'Unexpected uninstall registration cleanup target.'
      Remove-Item -LiteralPath $uninstallKey -Recurse -Force
    }
    if (Test-Path -LiteralPath $productKey) {
      Assert-True ((Get-Item -LiteralPath $productKey).GetValue('') -eq $install) 'Unexpected product registration cleanup target.'
      Remove-Item -LiteralPath $productKey -Recurse -Force
    }
    $shell = New-Object -ComObject WScript.Shell
    foreach ($link in @($desktopLink, $startLink)) {
      if (Test-Path -LiteralPath $link) {
        Assert-True ($shell.CreateShortcut($link).TargetPath -eq (Join-Path $install 'dev-autographs-desktop.exe')) 'Unexpected shortcut cleanup target.'
        Remove-Item -LiteralPath $link -Force
      }
    }
    $report.cleanup.ownedRegistrationRemoved = -not (Test-Path -LiteralPath $uninstallKey) -and -not (Test-Path -LiteralPath $productKey)
    if (Test-Path -LiteralPath $identityDirectory) {
      Assert-True ([IO.Path]::GetFullPath($identityDirectory) -eq (Join-Path $runnerProfile.home '.dev-autographs')) 'Unexpected cleanup target.'
      Assert-True (-not ((Get-Item -LiteralPath $identityDirectory).Attributes -band [IO.FileAttributes]::ReparsePoint)) 'Identity cleanup target became a link.'
      Assert-True ([IO.File]::ReadAllText((Join-Path $identityDirectory '.acceptance-owner')) -eq $root) 'Identity cleanup ownership marker mismatch.'
      Remove-Item -LiteralPath $identityDirectory -Recurse -Force
    }
    $report.cleanup.syntheticIdentityRemoved = -not (Test-Path -LiteralPath $identityDirectory)
    if (Test-Path -LiteralPath $root) { Assert-OwnedPath $root; Remove-Item -LiteralPath $root -Recurse -Force }
    $report.cleanup.fixtureDirectoryRemoved = -not (Test-Path -LiteralPath $root)
  } catch { $success = $false }
  foreach ($name in $originalEnv.Keys) { [Environment]::SetEnvironmentVariable($name, $originalEnv[$name]) }
  $report.passed = $success
  $report.finishedAt = (Get-Date).ToUniversalTime().ToString('o')
  $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportFile -Encoding utf8NoBOM
}
if (-not $success) { throw "Windows acceptance failed at '$activeStep'; see the sanitized result artifact." }
Write-Host "PASS: $($report.checks.Count) lifecycle/security checks; synthetic fixtures and temporary account cleaned."
