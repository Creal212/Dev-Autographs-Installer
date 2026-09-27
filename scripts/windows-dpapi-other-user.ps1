# Invoked only by windows-acceptance.ps1 under a temporary account on a hosted VM.
# Input contains public metadata and ciphertext only. No key/credential is written to the report.
param([Parameter(Mandatory = $true)][string]$FixtureDirectory)
$ErrorActionPreference = 'Stop'
$result = [ordered]@{ passed = $false; differentSid = $false; ownDpapiWorks = $false; foreignDpapiDenied = $false; publicIdentityReadable = $false; cliSigningKeyDenied = $false }
function Invoke-PrivateCli([string]$Node, [string]$Cli, [string]$Verb) {
  $info = New-Object Diagnostics.ProcessStartInfo
  $info.FileName = $Node
  $info.Arguments = '"' + $Cli + '" ' + $Verb
  $info.UseShellExecute = $false
  $info.CreateNoWindow = $true
  $info.RedirectStandardOutput = $true
  $info.RedirectStandardError = $true
  $process = [Diagnostics.Process]::Start($info)
  $stdout = $process.StandardOutput.ReadToEndAsync()
  $stderr = $process.StandardError.ReadToEndAsync()
  if (-not $process.WaitForExit(30000)) { $process.Kill(); throw 'Child CLI timed out' }
  $null = $stderr.GetAwaiter().GetResult()
  return @{code = $process.ExitCode; output = $stdout.GetAwaiter().GetResult()}
}
try {
  if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_ENVIRONMENT -ne 'github-hosted' -or $env:RUNNER_OS -ne 'Windows') { throw 'Hosted Windows runner required' }
  $inputData = Get-Content -LiteralPath (Join-Path $FixtureDirectory 'public-input.json') -Raw | ConvertFrom-Json
  $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  if ($sid -eq $inputData.originalSid -or $sid -ne $inputData.expectedSid) { throw 'Incorrect test identity' }
  $result.differentSid = $true
  Add-Type -AssemblyName System.Security
  $entropy = [Text.Encoding]::UTF8.GetBytes('Dev-Autographs.Identity.v1')
  $probe = [Text.Encoding]::UTF8.GetBytes('Non-secret independent account DPAPI health probe')
  $protected = [Security.Cryptography.ProtectedData]::Protect($probe, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  $roundtrip = [Security.Cryptography.ProtectedData]::Unprotect($protected, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  if ([Convert]::ToBase64String($roundtrip) -ne [Convert]::ToBase64String($probe)) { throw 'Independent DPAPI probe failed' }
  $result.ownDpapiWorks = $true
  $foreign = [Convert]::FromBase64String($inputData.ciphertext)
  try {
    $null = [Security.Cryptography.ProtectedData]::Unprotect($foreign, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    throw 'The other Windows user unexpectedly decrypted the runner key'
  } catch [Security.Cryptography.CryptographicException] {
    $result.foreignDpapiDenied = $true
  }
  $env:USERPROFILE = Join-Path $FixtureDirectory 'profile'
  $env:HOME = $env:USERPROFILE
  $env:NODE_OPTIONS = ''
  $env:PAWPRINTS_API = 'http://127.0.0.1:1'
  $node = Join-Path $FixtureDirectory 'node.exe'
  $cli = Join-Path $FixtureDirectory 'cli.cjs'
  $actualHome = & $node -e 'process.stdout.write(require("os").homedir())'
  if ($LASTEXITCODE -ne 0 -or $actualHome -ne $env:USERPROFILE) { throw 'Child profile isolation failed' }
  $public = Invoke-PrivateCli $node $cli 'identity-public'
  if ($public.code -ne 0 -or (($public.output | ConvertFrom-Json).publicKey -ne $inputData.publicKey)) { throw 'Public identity read failed' }
  $result.publicIdentityReadable = $true
  # Capture and discard any unexpected key output; never forward it to logs or the result file.
  $private = Invoke-PrivateCli $node $cli 'identity-keys'
  if ($private.code -eq 0 -or -not [string]::IsNullOrWhiteSpace($private.output)) { throw 'Foreign-user CLI key read did not fail closed' }
  $result.cliSigningKeyDenied = $true
  $result.passed = $true
} catch {
  $result.error = 'Independent Windows user acceptance failed; private command output was suppressed.'
} finally {
  $result | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $FixtureDirectory 'result.json') -Encoding UTF8
}
if (-not $result.passed) { exit 1 }
