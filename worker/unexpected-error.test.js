import test from 'node:test';
import assert from 'node:assert/strict';
import { handleUnexpected } from './unexpected-error.js';
test('unexpected errors are correlated without leaking provider or request data', async () => {
 const records=[];const original=console.error;console.error=value=>records.push(value);
 try {
  const response=await handleUnexpected(async()=>{throw new Error('secret=value customer@example.invalid');},'Please retry.');
  assert.equal(response.status,500);assert.equal(await response.text(),'Please retry.');
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  const record=JSON.parse(records[0]);assert.deepEqual(Object.keys(record).sort(),['event','requestId']);
  assert.equal(record.event,'unexpected_error');assert.equal(record.requestId,response.headers.get('X-Request-ID'));
  assert.doesNotMatch(records.join(''),/secret|customer/);
 } finally { console.error=original; }
});
test('successful response is preserved',async()=>{
 const expected=new Response('ok',{status:201,headers:{'X-Test':'kept'}});
 assert.equal(await handleUnexpected(async()=>expected,'retry'),expected);
});

test('a failed logger cannot replace the controlled error response',async()=>{
 const original=console.error;console.error=()=>{throw Error('logger failed');};
 try {
  const response=await handleUnexpected(async()=>{throw Error('provider failed');},'Please retry.');
  assert.equal(response.status,500);assert.equal(await response.text(),'Please retry.');
  assert.ok(response.headers.get('X-Request-ID'));
 } finally {console.error=original;}
});

test('production version preview URLs are disabled without changing workers.dev',async()=>{
 const {readFile}=await import('node:fs/promises');
 const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
 assert.equal(config.preview_urls,false);
 assert.equal(config.workers_dev,true);
 const prepare=await readFile(new URL('../scripts/prepare-release.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(prepare,/for\(const key of \[[^\n]+preview_urls/);
 });
