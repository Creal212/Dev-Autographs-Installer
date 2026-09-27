import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertHostedRunner, assertInside, nodePreloadOption, targetVersion} from './windows-acceptance-fixture.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const valid = {GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted', RUNNER_OS: 'Windows', GITHUB_REPOSITORY: 'Creal212/Dev-Autographs-Installer', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_RUN_ID: '123', RUNNER_TEMP: '/runner/temp', GITHUB_WORKSPACE: '/runner/workspace', USERPROFILE: '/runner/home'};

test('acceptance guard rejects a developer machine before any mutation', () => {
  assert.throws(() => assertHostedRunner({}, 'win32'), /outside GitHub Actions/);
});
test('acceptance guard rejects self-hosted runners', () => {
  assert.throws(() => assertHostedRunner({...valid, RUNNER_ENVIRONMENT: 'self-hosted'}, 'win32'), /Self-hosted/);
});
test('acceptance guard rejects non-Windows runners and unsolicited events', () => {
  assert.throws(() => assertHostedRunner(valid, 'linux'), /Windows/);
  assert.throws(() => assertHostedRunner({...valid, GITHUB_EVENT_NAME: 'pull_request'}, 'win32'), /Explicit workflow/);
  assert.throws(() => assertHostedRunner({...valid, GITHUB_REPOSITORY: 'untrusted/fork'}, 'win32'), /Wrong repository/);
});
test('acceptance guard requires complete hosted-run identifiers and paths', () => {
  assert.throws(() => assertHostedRunner({...valid, GITHUB_RUN_ID: 'not-a-run'}, 'win32'), /workflow run ID/);
  assert.throws(() => assertHostedRunner({...valid, RUNNER_TEMP: ''}, 'win32'), /runner paths/);
  assert.doesNotThrow(() => assertHostedRunner(valid, 'win32'));
});
test('fixture cleanup scope rejects parent, sibling-prefix and traversal targets', () => {
  const parent = path.join(os.tmpdir(), 'acceptance-parent');
  assert.throws(() => assertInside(parent, parent));
  assert.throws(() => assertInside(parent, `${parent}-other`));
  assert.throws(() => assertInside(parent, path.join(parent, '..', 'elsewhere')));
  assert.doesNotThrow(() => assertInside(parent, path.join(parent, 'owned fixture')));
});
test('target version accepts DPAPI releases and refuses unsupported or injected paths', () => {
  for (const value of ['0.2.9', '0.2.10', '1.0.0']) assert.equal(targetVersion(value), value);
  for (const value of ['', '0.2.8', '0.1.90', '../0.2.9', '0.2.9; exit 0', 'v0.2.9', '0.2.9\n--flag']) assert.throws(() => targetVersion(value));
});
test('network guard preload survives actual Node option parsing with spaces and Windows separators', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'da preload path '));
  try {
    const preload = path.join(root, 'deny-network.cjs');
    fs.writeFileSync(preload, 'globalThis.fetch = () => { throw new Error("fixture-network-denied"); };');
    const result = spawnSync(process.execPath, ['-e', 'try { fetch("https://example.invalid"); process.exit(2); } catch(e) { process.stdout.write(e.message); }'], {encoding: 'utf8', windowsHide: true, env: {...process.env, NODE_OPTIONS: nodePreloadOption(preload)}});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'fixture-network-denied');
    assert.equal(nodePreloadOption('C:\\Windows path\\guard.cjs'), '--require "C:/Windows path/guard.cjs"');
    assert.throws(() => nodePreloadOption('bad" --eval evil'));
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
test('fixture executable refuses an unguarded process without creating a profile', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'da-acceptance-refusal-'));
  try {
    const profile = path.join(root, 'profile-must-not-exist');
    const env = {...process.env, HOME: profile, USERPROFILE: profile, GITHUB_ACTIONS: 'false', RUNNER_ENVIRONMENT: '', NODE_OPTIONS: ''};
    const result = spawnSync(process.execPath, [path.join(directory, 'windows-acceptance-fixture.mjs'), 'seed', root, root], {env, encoding: 'utf8', windowsHide: true});
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Windows acceptance fixture failed/);
    assert.equal(fs.existsSync(profile), false);
    assert.deepEqual(fs.readdirSync(root), []);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
test('both PowerShell programs parse without executing them', {skip: process.platform !== 'win32'}, () => {
  for (const name of ['windows-acceptance.ps1', 'windows-dpapi-other-user.ps1']) {
    const file = path.join(directory, name).replaceAll("'", "''");
    const script = `$tokens=$null;$errors=$null;[System.Management.Automation.Language.Parser]::ParseFile('${file}',[ref]$tokens,[ref]$errors)|Out-Null;if($errors.Count){$errors|ForEach-Object{$_.Message};exit 1}`;
    const result = spawnSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script], {encoding: 'utf8', windowsHide: true});
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});
test('PowerShell entry point refuses local execution before touching supplied paths', {skip: process.platform !== 'win32'}, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'da-acceptance-ps-refusal-'));
  try {
    const untouched = path.join(root, 'must-not-exist');
    const result = spawnSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', path.join(directory, 'windows-acceptance.ps1')], {encoding: 'utf8', windowsHide: true, env: {...process.env, GITHUB_ACTIONS: 'false', RUNNER_ENVIRONMENT: '', RUNNER_TEMP: untouched, GITHUB_WORKSPACE: untouched}});
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Refusing installer acceptance outside/);
    assert.equal(fs.existsSync(untouched), false);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
