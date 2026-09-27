// Only synthetic data on a disposable GitHub-hosted Windows VM. Never print key material.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash, createPrivateKey, createPublicKey, sign, verify} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function assertHostedRunner(env = process.env, platform = process.platform) {
  assert.equal(platform, 'win32', 'Acceptance requires Windows');
  assert.equal(env.GITHUB_ACTIONS, 'true', 'Refusing to run outside GitHub Actions');
  assert.equal(env.RUNNER_ENVIRONMENT, 'github-hosted', 'Self-hosted runners are forbidden');
  assert.equal(env.RUNNER_OS, 'Windows', 'A Windows runner is required');
  assert.equal(env.GITHUB_REPOSITORY, 'Creal212/Dev-Autographs-Installer', 'Wrong repository');
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Explicit workflow dispatch is required');
  assert.match(env.GITHUB_RUN_ID ?? '', /^\d+$/, 'Missing workflow run ID');
  assert.ok(env.RUNNER_TEMP && env.GITHUB_WORKSPACE && env.USERPROFILE, 'Missing runner paths');
}

export function assertInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  assert.ok(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), 'Fixture path escaped its parent');
}

export function targetVersion(value) {
  const version = String(value ?? '').trim();
  assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, 'A plain release version is required');
  const [major, minor, patch] = version.split('.').map(Number);
  assert.ok([major, minor, patch].every(Number.isSafeInteger), 'Invalid version number');
  assert.ok(major > 0 || minor > 2 || (minor === 2 && patch >= 9), 'Target must support Windows DPAPI (0.2.9 or newer)');
  return version;
}

export function nodePreloadOption(file) {
  assert.ok(typeof file === 'string' && file && !/["\r\n\0]/.test(file), 'Invalid preload path');
  // NODE_OPTIONS has its own quote/escape parser: unescaped Windows backslashes disappear.
  return `--require "${file.replaceAll('\\', '/')}"`;
}

export function archiveOwnedProfile(source, root) {
  const destination = path.join(root, 'retained-upgrade-profile');
  assert.equal(path.basename(source), '.dev-autographs', 'Unexpected profile archive source');
  assert.equal(fs.realpathSync(source), path.resolve(source), 'Profile archive source cannot be a link');
  assert.equal(fs.realpathSync(root), path.resolve(root), 'Profile archive root cannot be a link');
  assert.equal(fs.readFileSync(path.join(source, '.acceptance-owner'), 'utf8'), path.resolve(root), 'Profile archive ownership mismatch');
  assertInside(root, destination);
  assert.equal(fs.existsSync(destination), false, 'Archive destination already exists');
  const snapshot = directory => {
    const files = {};
    const walk = current => {
      const stat = fs.lstatSync(current);
      assert.equal(stat.isSymbolicLink(), false, 'Links are forbidden in the owned profile archive');
      if (stat.isDirectory()) for (const name of fs.readdirSync(current).sort()) walk(path.join(current, name));
      else {
        assert.ok(stat.isFile(), 'Only regular fixture files may be archived');
        files[path.relative(directory, current)] = hash(current);
      }
    };
    walk(directory);
    return files;
  };
  const original = snapshot(source);
  // Hosted profiles are on C: while RUNNER_TEMP is on D:. Rename is not portable.
  fs.cpSync(source, destination, {recursive: true, errorOnExist: true, force: false});
  assert.deepEqual(snapshot(destination), original, 'Archived bytes must match before retiring source');
  assert.deepEqual(snapshot(source), original, 'Source changed during archive; preserve it');
  assert.equal(fs.realpathSync(source), path.resolve(source), 'Profile source changed into a link');
  assert.equal(fs.readFileSync(path.join(source, '.acceptance-owner'), 'utf8'), path.resolve(root));
  fs.rmSync(source, {recursive: true});
  return destination;
}

const digest = value => createHash('sha256').update(value).digest('hex');
const hash = file => digest(fs.readFileSync(file));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2), {mode: 0o600});
const home = path.join(os.homedir(), '.dev-autographs');
const identity = path.join(home, 'identity.json');
const names = ['pre-commit', 'post-commit', 'pre-push'];
const checks = [];
const passed = name => checks.push({name, passed: true});

function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, {encoding: 'utf8', windowsHide: true, timeout: 45000, maxBuffer: 1024 * 1024, ...options});
  if (result.error || result.status !== 0) throw new Error(`Fixture command failed: ${path.basename(executable)} ${args[0] ?? ''} (exit ${result.status ?? 'unavailable'})`);
  return result.stdout.trim();
}

function cli(install, args, root) { return command(process.execPath, [path.join(install, 'cli.cjs'), ...args], {cwd: root}); }
function git(args, cwd) { return command('git', args, {cwd}); }
function stateFile(root) { return path.join(root, 'fixture-public-state.json'); }
function filesEqual(snapshot) { for (const [file, expected] of Object.entries(snapshot)) assert.equal(hash(file), expected, `File changed: ${path.basename(file)}`); }
function hooksSnapshot(dirs) { return Object.fromEntries(dirs.flatMap(dir => fs.readdirSync(dir).filter(name => names.some(n => name === n || name === `${n}.da-previous`)).map(name => { const file = path.join(dir, name); return [file, hash(file)]; }))); }
function installedBytes(install, version) {
  const release = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'releases', `v${version}`);
  const manifest = read(path.join(release, 'release.json'));
  for (const name of ['cli.cjs', 'paw-prints.cjs']) assert.equal(hash(path.join(install, name)), manifest.files[name].sha256);
  passed(`Installed ${version} CLI and shim match release manifest`);
}
function assertEnvelope(id, privateHash) {
  assert.equal(Object.hasOwn(id, 'privateKey'), false);
  assert.equal(id.privateKeyProtected?.version, 'dpapi-current-user-v1');
  const bytes = Buffer.from(id.privateKeyProtected.ciphertext, 'base64');
  assert.ok(bytes.length > 64);
  assert.equal(bytes.toString('base64'), id.privateKeyProtected.ciphertext);
  if (privateHash) assert.notEqual(digest(bytes), privateHash);
}
function owner(root) { fs.writeFileSync(path.join(home, '.acceptance-owner'), path.resolve(root)); }

function preflight() {
  assert.equal(path.resolve(os.homedir()), path.resolve(process.env.USERPROFILE));
  for (const folder of ['.dev-autographs', '.codeink', '.pawprints']) assert.equal(fs.existsSync(path.join(os.homedir(), folder)), false, `Existing ${folder} profile must not be changed`);
  return {home: os.homedir(), node: process.execPath};
}

function seed(root, install) {
  installedBytes(install, '0.2.8');
  assert.equal(fs.existsSync(home), false, 'A clean install must not create an identity');
  cli(install, ['keygen', '--mark', 'Synthetic acceptance only'], root);
  const id = read(identity);
  assert.ok(id.privateKey && !id.privateKeyProtected, 'The released 0.2.8 identity must exercise plaintext migration');
  Object.assign(id, {accountId: 'acceptance-synthetic-account', githubLogin: 'acceptance-synthetic-user', markFont: 'serif', markIcon: 'star', repoDisplayMark: 'Fixture repo mark', marksLocked: true});
  write(identity, id);
  fs.copyFileSync(identity, `${identity}.bak-acceptance`);
  owner(root);
  const settings = path.join(home, 'settings.json');
  write(settings, {acceptanceFixture: true, autoSeal: false, nested: {preserve: 'unchanged'}});
  const repo = path.join(root, 'fixture-repository');
  const foreign = path.join(root, 'foreign global hooks');
  const local = path.join(root, 'foreign local hooks');
  const template = path.join(root, 'foreign template');
  for (const dir of [repo, foreign, local, template]) fs.mkdirSync(dir, {recursive: true});
  for (const [kind, dir] of [['global', foreign], ['local', local]]) for (const name of names) {
    fs.writeFileSync(path.join(dir, name), `#!/bin/sh\nprintf '%s\\n' '${kind}-${name}' >> "$DA_ACCEPTANCE_HOOK_LOG"\nexit 0\n`, {mode: 0o755});
  }
  git(['init', repo], root);
  git(['config', 'user.name', 'Synthetic acceptance'], repo);
  git(['config', 'user.email', 'acceptance@example.invalid'], repo);
  git(['config', '--local', 'core.hooksPath', local.replaceAll('\\', '/')], repo);
  const originalHooks = hooksSnapshot([foreign, local]);
  cli(install, ['install-hooks'], repo);
  git(['config', '--global', 'core.hooksPath', foreign.replaceAll('\\', '/')], root);
  git(['config', '--global', 'init.templateDir', template.replaceAll('\\', '/')], root);
  cli(install, ['install-hooks', '--global'], root);
  const managedDirs = [path.join(home, 'hooks'), path.join(home, 'git-template', 'hooks'), local];
  const {privateKey, ...publicIdentity} = id;
  write(stateFile(root), {repo, foreign, local, template, originalHooks, publicIdentity, privateHash: digest(privateKey), identityHash: hash(identity), settingsHash: hash(settings), installedHooks: hooksSnapshot(managedDirs), gitConfigHash: hash(process.env.GIT_CONFIG_GLOBAL)});
  passed('0.2.8 created a synthetic plaintext identity and preserved style/settings');
  passed('0.2.8 installed global and inventoried local hooks over foreign controls');
}

function upgraded(root, install, version) {
  const state = read(stateFile(root));
  installedBytes(install, version);
  assert.equal(hash(identity), state.identityHash);
  assert.equal(hash(path.join(home, 'settings.json')), state.settingsHash);
  filesEqual(state.installedHooks);
  assert.equal(hash(process.env.GIT_CONFIG_GLOBAL), state.gitConfigHash);
  passed('NSIS /UPDATE preserved identity, settings, hook chains and Git configuration byte for byte');
  cli(install, ['whoami'], root);
  const stored = read(identity);
  assertEnvelope(stored, state.privateHash);
  const {privateKeyProtected, ...publicIdentity} = stored;
  assert.deepEqual(publicIdentity, state.publicIdentity);
  assert.equal(fs.existsSync(`${identity}.bak-acceptance`), false);
  for (const name of fs.readdirSync(home)) assert.equal(name.startsWith('identity.') && name !== 'identity.json', false, 'No plaintext backup, temporary key, or stale lock may remain');
  const keys = JSON.parse(cli(install, ['identity-keys'], root));
  assert.equal(digest(keys.privateKey), state.privateHash);
  assert.equal(keys.publicKey, state.publicIdentity.publicKey);
  const key = createPrivateKey({key: Buffer.from(keys.privateKey, 'base64url'), type: 'pkcs8', format: 'der'});
  const pub = createPublicKey({key: Buffer.from(keys.publicKey, 'base64url'), type: 'spki', format: 'der'});
  const message = Buffer.from('Synthetic installed CLI DPAPI acceptance');
  assert.ok(verify(null, message, pub, sign(null, message, key)));
  passed(`Installed ${version} migrated the same key to DPAPI, retired plaintext backup, and preserved public fields`);
  passed('Current Windows user decrypted the migrated key and produced a valid Ed25519 signature');
  const sample = path.join(state.repo, 'synthetic-source.txt');
  fs.writeFileSync(sample, 'Synthetic source, no production project.\n');
  cli(install, ['seal', sample], state.repo);
  cli(install, ['verify', sample], state.repo);
  fs.appendFileSync(sample, 'tamper\n');
  const bad = spawnSync(process.execPath, [path.join(install, 'cli.cjs'), 'verify', sample], {cwd: state.repo, encoding: 'utf8', windowsHide: true, timeout: 30000});
  assert.ok(!bad.error && bad.status !== 0);
  passed('Installed CLI seals and verifies source and rejects changed content');
  state.encryptedIdentityHash = hash(identity);
  write(stateFile(root), state);
}

function uninstalled(root) {
  const state = read(stateFile(root));
  assert.equal(hash(identity), state.encryptedIdentityHash);
  assert.equal(hash(path.join(home, 'settings.json')), state.settingsHash);
  filesEqual(state.originalHooks);
  assert.equal(git(['config', '--global', '--get', 'core.hooksPath'], root), state.foreign.replaceAll('\\', '/'));
  assert.equal(git(['config', '--global', '--get', 'init.templateDir'], root), state.template.replaceAll('\\', '/'));
  for (const name of ['git-config-backup.json', 'installed-local-hooks.json']) assert.equal(fs.existsSync(path.join(home, name)), false);
  for (const name of names) assert.equal(fs.existsSync(path.join(state.local, `${name}.da-previous`)), false);
  passed('Uninstall retained encrypted identity/settings and restored foreign global/local hooks and template');
  git(['commit', '--allow-empty', '-m', 'Synthetic local hook acceptance'], state.repo);
  git(['-c', `core.hooksPath=${state.foreign.replaceAll('\\', '/')}`, 'commit', '--allow-empty', '-m', 'Synthetic global hook acceptance'], state.repo);
  const log = fs.readFileSync(process.env.DA_ACCEPTANCE_HOOK_LOG, 'utf8');
  for (const marker of ['local-pre-commit', 'local-post-commit', 'global-pre-commit', 'global-post-commit']) assert.ok(log.includes(marker));
  passed('Normal Git commits execute restored foreign controls after uninstall');
  archiveOwnedProfile(home, root);
  passed('Verified an exact copy of the owned encrypted profile before preparing the separate fresh-install fixture');
}

function fresh(root, install, version) {
  installedBytes(install, version);
  assert.equal(fs.existsSync(home), false, 'Fresh installation must not create an identity');
  cli(install, ['keygen', '--mark', 'Synthetic fresh install'], root);
  owner(root);
  assertEnvelope(read(identity));
  write(path.join(root, 'fresh-public-state.json'), {identityHash: hash(identity)});
  passed(`Fresh ${version} installs without an identity, then creates DPAPI storage directly`);
  cli(install, ['remove-hooks', '--global'], root);
  cli(install, ['remove-hooks', '--global'], root);
  passed('Hook cleanup succeeds repeatedly with no owned hooks');
}

function freshRemoved(root) {
  assert.equal(hash(identity), read(path.join(root, 'fresh-public-state.json')).identityHash);
  assertEnvelope(read(identity));
  passed('Fresh-install uninstall retains the new encrypted identity');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertHostedRunner();
    const [operation, root, install, version] = process.argv.slice(2);
    if (operation === 'preflight') console.log(JSON.stringify(preflight()));
    else if (operation === 'target-version') console.log(targetVersion(root));
    else if (operation === 'node-options') console.log(nodePreloadOption(root));
    else {
      assertInside(process.env.RUNNER_TEMP, root);
      assert.match(path.basename(root), /^dev-autographs-acceptance-/);
      assert.equal(fs.realpathSync(root), path.resolve(root), 'Fixture root cannot be a link');
      assert.equal(path.resolve(process.env.GIT_CONFIG_GLOBAL), path.join(root, 'global.gitconfig'));
      const operations = {seed, upgraded, uninstalled, fresh, 'fresh-removed': freshRemoved};
      assert.ok(Object.hasOwn(operations, operation), 'Unknown acceptance operation');
      operations[operation](root, install, targetVersion(version));
      console.log(JSON.stringify({checks}));
    }
  } catch (error) {
    // Assertion values and command output can contain a private key. Never print them.
    console.error(`Windows acceptance fixture failed (${error?.code ?? error?.name ?? 'error'}). Operation: ${process.argv[2] ?? 'unknown'}.`);
    process.exitCode = 1;
  }
}
