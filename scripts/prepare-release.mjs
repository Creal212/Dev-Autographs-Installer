import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [sourceArg,installerArg,version]=process.argv.slice(2);
if(!sourceArg||!installerArg||! /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version??'')) throw new Error('Usage: prepare-release.mjs <source checkout> <installer.exe> <version>');
const source=path.resolve(sourceArg), installer=path.resolve(installerArg);
const config=JSON.parse(readFileSync(path.join(source,'apps/desktop/src-tauri/tauri.conf.json'),'utf8'));
if(config.version!==version) throw new Error('Built application config version does not match release');
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();
if(execFileSync('git',['status','--porcelain'],{cwd:source,encoding:'utf8'}).trim()) throw new Error('Commit all reviewed source and bundled CLI before staging a release; untracked build inputs are not allowed.');
const dir=path.join(root,'releases',`v${version}`);
if(existsSync(path.join(dir,'release.json'))) throw new Error('Release already staged. Use a new version; do not overwrite a versioned release.');
const exe=`Dev-Autographs_${version}_x64-setup.exe`;
const buffers={
  [exe]:readFileSync(installer),
  'cli.cjs':readFileSync(path.join(source,'packages/cli/bin/cli.cjs')),
  'paw-prints.cjs':readFileSync(path.join(source,'packages/cli/bin/paw-prints.cjs')),
  VERSION:Buffer.from(`${version}\n`),
};
const files=Object.fromEntries(Object.entries(buffers).map(([name,bytes])=>[name,{sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length}]));
mkdirSync(dir,{recursive:true});
for(const [name,bytes] of Object.entries(buffers)) writeFileSync(path.join(dir,name),bytes);
writeFileSync(path.join(dir,`${exe}.sha256`),`${files[exe].sha256}  ${exe}\n`);
writeFileSync(path.join(dir,'release.json'),JSON.stringify({version,sourceCommit,sourceRepository:'https://github.com/Creal212/Dev-Autographs',files},null,2)+'\n');
mkdirSync(path.join(root,'cli'),{recursive:true});
for(const name of ['cli.cjs','paw-prints.cjs','VERSION']) copyFileSync(path.join(dir,name),path.join(root,'cli',name));
execFileSync(process.execPath,[path.join(root,'scripts/verify-release.mjs'),`v${version}`],{stdio:'inherit'});
