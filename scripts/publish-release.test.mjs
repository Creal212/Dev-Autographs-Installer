import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {requireUnusedRelease,publishNewRelease} from './publish-release.mjs';

const missing={status:1,stdout:'HTTP/2.0 404 Not Found\r\n\r\n{"message":"Not Found"}',stderr:'gh: Not Found (HTTP 404)'};
const present={status:0,stdout:'HTTP/2.0 200 OK\r\n\r\n{"tag_name":"v0.2.9"}'};
function fixture(t) {
  const dir=mkdtempSync(path.join(os.tmpdir(),'da-release-publication-test-'));
  t.after(()=>{assert.equal(path.dirname(dir),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('da-release-publication-test-'));rmSync(dir,{recursive:true});});
  for(const name of ['notes.md','Dev-Autographs_0.2.9_x64-setup.exe','Dev-Autographs_0.2.9_x64-setup.exe.sha256','cli.cjs','paw-prints.cjs','VERSION','release.json']) writeFileSync(path.join(dir,name),'synthetic');
  return {dir,notes:path.join(dir,'notes.md')};
}
test('explicit API404 is the only unused-release response',()=>{
  const calls=[];requireUnusedRelease('v0.2.9',args=>{calls.push(args);return missing;});
  assert.deepEqual(calls,[['api','repos/Creal212/Dev-Autographs-Installer/releases/tags/v0.2.9','--include']]);
});
for(const [name,result] of [
  ['existing release',present],['API403',{status:1,stdout:'HTTP/2.0 403 Forbidden'}],
  ['API500',{status:1,stdout:'HTTP/2.0 500 Server Error'}],['transport failure',{status:1,stdout:'',stderr:'network unavailable'}],
  ['missing executable',{status:null,error:new Error('ENOENT')}],['untrusted stderr404',{status:1,stdout:'',stderr:'HTTP 404'}],
  ['malformed success',{status:0,stdout:'{}'}],
]) test(`${name} stops before any release mutation`,t=>{
  const f=fixture(t);const calls=[];
  assert.throws(()=>publishNewRelease('v0.2.9',f.notes,f.dir,args=>{calls.push(args);return result;}));
  assert.equal(calls.length,1);assert.equal(calls[0][0],'api');
});
test('new publication uses create with exact assets and no overwrite/update path',t=>{
  const f=fixture(t);const calls=[];
  const url=publishNewRelease('v0.2.9',f.notes,f.dir,args=>{calls.push(args);return calls.length===1?missing:{status:0,stdout:'https://fixture.invalid/release/v0.2.9\n'};});
  assert.equal(url,'https://fixture.invalid/release/v0.2.9');assert.equal(calls.length,2);
  assert.deepEqual(calls[1].slice(0,3),['release','create','v0.2.9']);
  assert.equal(calls[1].slice(3,9).length,6);assert.ok(calls[1].includes('--verify-tag'));
  assert.ok(!calls.flat().includes('--clobber'));assert.ok(!calls.flat().includes('edit'));assert.ok(!calls.flat().includes('delete'));
});
test('a competing release after404 cannot trigger overwrite or retry mutation',t=>{
  const f=fixture(t);const calls=[];
  assert.throws(()=>publishNewRelease('v0.2.9',f.notes,f.dir,args=>{calls.push(args);return calls.length===1?missing:{status:1,stderr:'already_exists HTTP422'};}),/No overwrite or update fallback/);
  assert.equal(calls.length,2);assert.equal(calls[1][1],'create');
});
test('creation/upload failure does not update or clobber an existing release',t=>{
  const f=fixture(t);const calls=[];
  assert.throws(()=>publishNewRelease('v0.2.9',f.notes,f.dir,args=>{calls.push(args);return calls.length===1?missing:{status:1,stderr:'upload interrupted'};}),/No overwrite/);
  assert.equal(calls.length,2);
});
