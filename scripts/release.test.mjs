import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,existsSync,readdirSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Only the scripts are copied out of this checkout. Every source commit, installer,
// staging directory and CLI mirror below is synthetic and remains in an owned temp dir.
const scripts=path.dirname(fileURLToPath(import.meta.url));
const version='0.2.8';
const tag=`v${version}`;
const exe=`Dev-Autographs_${version}_x64-setup.exe`;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const cliBytes=Buffer.from('// synthetic CLI fixture\nmodule.exports = "fixture only";\n');
const shimBytes=Buffer.from('// synthetic compatibility fixture\nrequire("./cli.cjs");\n');
const exeBytes=Buffer.from('MZ\0SYNTHETIC TEST FIXTURE — NOT AN EXECUTABLE\r\n');

function fixture(t) {
  const temporary=mkdtempSync(path.join(os.tmpdir(),'dev-autographs-release-test-'));
  t.after(()=>{
    // Verify this target before recursive cleanup; never clean a product checkout.
    assert.equal(path.dirname(temporary),path.resolve(os.tmpdir()));
    assert.ok(path.basename(temporary).startsWith('dev-autographs-release-test-'));
    rmSync(temporary,{recursive:true,force:true,maxRetries:3});
  });
  const source=path.join(temporary,'source');
  const target=path.join(temporary,'installer');
  const home=path.join(temporary,'git-home');
  const hooks=path.join(temporary,'empty-hooks');
  for(const dir of [source,path.join(target,'scripts'),home,hooks]) mkdirSync(dir,{recursive:true});
  const globalConfig=path.join(home,'isolated.gitconfig');
  writeFileSync(globalConfig,`[user]\n name = Synthetic Release Fixture\n email = release-fixture@example.invalid\n[core]\n hooksPath = "${hooks.replaceAll('\\','/')}"\n autocrlf = false\n[commit]\n gpgSign = false\n[tag]\n gpgSign = false\n`);
  // Git configuration/identity/hooks come only from this fixture. Strip inherited
  // Git worktree/index/config overrides so subprocesses cannot touch another repo.
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^GIT_/i.test(key)));
  Object.assign(env,{HOME:home,USERPROFILE:home,XDG_CONFIG_HOME:home,GIT_CONFIG_GLOBAL:globalConfig,GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0'});
  for(const name of ['prepare-release.mjs','verify-release.mjs']) copyFileSync(path.join(scripts,name),path.join(target,'scripts',name));
  mkdirSync(path.join(source,'apps/desktop/src-tauri'),{recursive:true});
  mkdirSync(path.join(source,'packages/cli/bin'),{recursive:true});
  writeFileSync(path.join(source,'apps/desktop/src-tauri/tauri.conf.json'),JSON.stringify({version})+'\n');
  writeFileSync(path.join(source,'packages/cli/bin/cli.cjs'),cliBytes);
  writeFileSync(path.join(source,'packages/cli/bin/paw-prints.cjs'),shimBytes);
  const installer=path.join(temporary,'synthetic.exe');
  writeFileSync(installer,exeBytes);
  const git=(...args)=>{
    const result=spawnSync('git',args,{cwd:source,env,encoding:'utf8',timeout:15_000,windowsHide:true});
    assert.ifError(result.error);
    assert.equal(result.status,0,`git ${args.join(' ')} failed: ${result.stderr}`);
    return result.stdout.trim();
  };
  git('init','--quiet');
  git('add','.');
  git('commit','--quiet','-m','Synthetic release fixture');
  const commit=git('rev-parse','HEAD');
  assert.equal(git('status','--porcelain'),'');
  const run=(name,args)=>spawnSync(process.execPath,[path.join(target,'scripts',name),...args],{cwd:temporary,env,encoding:'utf8',timeout:15_000,windowsHide:true});
  const prepare=(releaseVersion=version)=>run('prepare-release.mjs',[source,installer,releaseVersion]);
  const verify=(releaseTag=tag)=>run('verify-release.mjs',[releaseTag]);
  const dir=path.join(target,'releases',tag);
  const manifestPath=path.join(dir,'release.json');
  const manifest=()=>JSON.parse(readFileSync(manifestPath,'utf8'));
  const setManifest=value=>writeFileSync(manifestPath,JSON.stringify(value,null,2)+'\n');
  return {temporary,source,target,git,commit,prepare,verify,dir,manifest,manifestPath,setManifest};
}

function succeeds(result) {
  assert.ifError(result.error);
  assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout,/Verified v0\.2\.8: asset sizes\/checksums match the manifest/);
}
function rejects(result,reason) {
  assert.ifError(result.error);
  assert.notEqual(result.status,0,'a rejected release must exit nonzero');
  assert.match(result.stderr,reason);
  assert.doesNotMatch(result.stdout,/Verified v/,'a rejected release must not claim verification');
}
function noStaging(f) {
  assert.equal(existsSync(path.join(f.target,'releases')),false,'failed preparation must not stage a release');
  assert.equal(existsSync(path.join(f.target,'cli')),false,'failed preparation must not replace CLI mirrors');
}

test('prepare clean source records the exact commit, version, bytes, sizes and hashes; copies the matching CLI',t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  const manifest=f.manifest();
  assert.equal(manifest.version,version);
  assert.equal(manifest.sourceCommit,f.commit);
  assert.equal(manifest.sourceRepository,'https://github.com/Creal212/Dev-Autographs');
  const expected={[exe]:exeBytes,'cli.cjs':cliBytes,'paw-prints.cjs':shimBytes,VERSION:Buffer.from(`${version}\n`)};
  assert.deepEqual(Object.keys(manifest.files).sort(),Object.keys(expected).sort());
  assert.deepEqual(readdirSync(f.dir).sort(),[...Object.keys(expected),`${exe}.sha256`,'release.json'].sort());
  for(const [name,bytes] of Object.entries(expected)) {
    assert.deepEqual(readFileSync(path.join(f.dir,name)),bytes);
    assert.deepEqual(manifest.files[name],{sha256:sha256(bytes),size:bytes.length});
    if(name!==exe) assert.deepEqual(readFileSync(path.join(f.target,'cli',name)),bytes);
  }
  assert.equal(readFileSync(path.join(f.dir,`${exe}.sha256`),'utf8'),`${sha256(exeBytes)}  ${exe}\n`);
  assert.equal(f.git('status','--porcelain'),'','prepare does not mutate its source checkout');
  succeeds(f.verify());
});

for(const kind of ['untracked','dirty']) test(`prepare refuses ${kind} source before writing a release or CLI mirror`,t=>{
  const f=fixture(t);
  const file=kind==='untracked'?'unexpected-build-input.js':'packages/cli/bin/cli.cjs';
  writeFileSync(path.join(f.source,file),'unreviewed synthetic bytes\n');
  rejects(f.prepare(),/Commit all reviewed source and bundled CLI/);
  noStaging(f);
});

test('prepare refuses an application/release version mismatch before staging',t=>{
  const f=fixture(t);
  rejects(f.prepare('0.2.9'),/Built application config version does not match release/);
  noStaging(f);
});

test('prepare refuses a duplicate version and leaves every staged byte and CLI mirror unchanged',t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  const snapshot=new Map(readdirSync(f.dir).map(name=>[name,readFileSync(path.join(f.dir,name))]));
  rejects(f.prepare(),/Release already staged/);
  for(const [name,bytes] of snapshot) assert.deepEqual(readFileSync(path.join(f.dir,name)),bytes);
  assert.deepEqual(readFileSync(path.join(f.target,'cli/cli.cjs')),cliBytes);
  assert.deepEqual(readFileSync(path.join(f.target,'cli/paw-prints.cjs')),shimBytes);
  assert.equal(readFileSync(path.join(f.target,'cli/VERSION'),'utf8'),`${version}\n`);
  succeeds(f.verify());
});

test('verify refuses an extra EXE even when all declared assets still match',t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  writeFileSync(path.join(f.dir,'unexpected-setup.exe'),exeBytes);
  rejects(f.verify(),/Unexpected or missing files in the release directory/);
});

for(const name of ['cli.cjs','paw-prints.cjs','VERSION']) test(`verify refuses tampered ${name} bytes`,t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  writeFileSync(path.join(f.dir,name),'tampered synthetic bytes\n');
  rejects(f.verify(),new RegExp(`Asset integrity mismatch: ${name.replaceAll('.','\\.')}`));
});

test('verify refuses a changed manifest CLI hash',t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  const manifest=f.manifest();
  manifest.files['cli.cjs'].sha256='0'.repeat(64);
  f.setManifest(manifest);
  rejects(f.verify(),/Asset integrity mismatch: cli\.cjs/);
});

test('verify refuses a changed declared size',t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  const manifest=f.manifest();
  manifest.files['cli.cjs'].size+=1;
  f.setManifest(manifest);
  rejects(f.verify(),/Asset integrity mismatch: cli\.cjs/);
});

test('verify refuses a changed installer checksum sidecar',t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  writeFileSync(path.join(f.dir,`${exe}.sha256`),`${'0'.repeat(64)}  ${exe}\n`);
  rejects(f.verify(),/Installer checksum file mismatch/);
});

test('verify refuses a mismatched VERSION even when its manifest hash and size were updated',t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  const bytes=Buffer.from('0.2.9\n');
  writeFileSync(path.join(f.dir,'VERSION'),bytes);
  const manifest=f.manifest();
  manifest.files.VERSION={sha256:sha256(bytes),size:bytes.length};
  f.setManifest(manifest);
  rejects(f.verify(),/CLI VERSION mismatch/);
});

test('verify refuses a manifest with a different release version',t=>{
  const f=fixture(t);
  succeeds(f.prepare());
  const manifest=f.manifest();
  manifest.version='0.2.9';
  f.setManifest(manifest);
  rejects(f.verify(),/Release version\/source commit mismatch/);
});
