import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repository='Creal212/Dev-Autographs-Installer';
const validTag=tag=>/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag??'');
const gh=args=>spawnSync('gh',args,{encoding:'utf8',windowsHide:true,timeout:120_000,maxBuffer:2*1024*1024});

export function requireUnusedRelease(tag,run=gh) {
  if(!validTag(tag)) throw new Error('A valid version tag is required');
  const result=run(['api',`repos/${repository}/releases/tags/${tag}`,'--include']);
  if(result.error) throw new Error('Could not establish release availability. No publication attempted.');
  const statuses=[...String(result.stdout??'').matchAll(/^HTTP\/\S+\s+(\d{3})(?:\s|$)/gm)];
  const status=Number(statuses.at(-1)?.[1]);
  if(result.status===0&&status===200) throw new Error('Version already published. Use a new version; existing releases are never replaced.');
  if(result.status!==0&&result.status!==null&&status===404) return;
  throw new Error('Could not establish release availability. Only an explicit GitHub HTTP 404 permits creation.');
}

export function publishNewRelease(tag,notes,dir,run=gh) {
  if(!validTag(tag)) throw new Error('A valid version tag is required');
  const version=tag.slice(1);
  const exe=`Dev-Autographs_${version}_x64-setup.exe`;
  const files=[exe,`${exe}.sha256`,'cli.cjs','paw-prints.cjs','VERSION','release.json'].map(name=>path.resolve(dir,name));
  if(!existsSync(notes)||files.some(file=>!existsSync(file))) throw new Error('Release notes and all verified assets are required');
  requireUnusedRelease(tag,run);
  // gh create uploads assets to a newly created release, then publishes it.
  // It never edits the pre-existing release even if one wins the race after GET.
  // No --clobber, edit, or retry fallback can replace published content.
  const result=run(['release','create',tag,...files,'--repo',repository,'--verify-tag','--title',`Dev Autographs ${tag}`,'--notes-file',path.resolve(notes)]);
  if(result.error||result.status!==0) throw new Error('Release creation failed. No overwrite or update fallback was attempted. Inspect any new draft before retrying.');
  return String(result.stdout??'').trim();
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const [mode,tag,notes]=process.argv.slice(2);
    if(mode==='check') requireUnusedRelease(tag);
    else if(mode==='publish'&&notes) {
      const checked=spawnSync(process.execPath,[path.join(root,'scripts/verify-release.mjs'),tag],{encoding:'utf8',windowsHide:true});
      if(checked.error||checked.status!==0) throw new Error('Staged release verification failed; no publication attempted.');
      console.log(publishNewRelease(tag,notes,path.join(root,'releases',tag)));
    } else throw new Error('Usage: publish-release.mjs check <tag> | publish <tag> <notes-file>');
  } catch(error) { console.error(error.message);process.exitCode=1; }
}
