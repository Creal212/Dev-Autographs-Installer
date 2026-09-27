import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tag=process.argv[2];
if(!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag??'')) throw new Error('A version tag such as v0.2.8 is required');
const dir=path.join(root,'releases',tag);
const manifest=JSON.parse(readFileSync(path.join(dir,'release.json'),'utf8'));
if(manifest.version!==tag.slice(1)||! /^[a-f0-9]{40}$/i.test(manifest.sourceCommit??'')) throw new Error('Release version/source commit mismatch');
const expected=[`Dev-Autographs_${manifest.version}_x64-setup.exe`,'cli.cjs','paw-prints.cjs','VERSION'];
const expectedDirectory=[...expected,`${expected[0]}.sha256`,'release.json'].sort();
if(JSON.stringify(readdirSync(dir).sort())!==JSON.stringify(expectedDirectory)) throw new Error('Unexpected or missing files in the release directory');
if(JSON.stringify(Object.keys(manifest.files).sort())!==JSON.stringify([...expected].sort())) throw new Error('Unexpected or missing release assets');
for(const name of expected) {
  const file=path.join(dir,name), entry=manifest.files[name];
  if(!existsSync(file)||! /^[a-f0-9]{64}$/i.test(entry.sha256??'')) throw new Error(`Missing file/hash: ${name}`);
  const bytes=readFileSync(file);
  if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256.toLowerCase()||bytes.length!==entry.size) throw new Error(`Asset integrity mismatch: ${name}`);
}
if(readFileSync(path.join(dir,'VERSION'),'utf8').trim()!==manifest.version) throw new Error('CLI VERSION mismatch');
const exe=expected[0];
const sum=readFileSync(path.join(dir,`${exe}.sha256`),'utf8').trim();
if(sum!==`${manifest.files[exe].sha256}  ${exe}`) throw new Error('Installer checksum file mismatch');
console.log(`Verified ${tag}: asset sizes/checksums match the manifest, which records source ${manifest.sourceCommit}`);
