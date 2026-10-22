import test from 'node:test';
import assert from 'node:assert/strict';
import { readLimited, requestGate } from './request-security.js';
test('enforces actual bytes when Content-Length is absent or misleading', async () => {
 for (const headers of [{}, {'Content-Length':'1'}]) {
  const request = new Request('https://example.com/api/enquiry', {method:'POST', headers, body:'x'.repeat(40)});
  await assert.rejects(readLimited(request, 16), error => error instanceof Response && error.status === 413);
 }
});
test('rejects wrong origins before invoking the limiter', async () => {
 let called=false;
 const response=await requestGate(new Request('https://example.com/api/enquiry',{headers:{Origin:'https://attacker.example'}}),{ENQUIRY_RATE_LIMIT:{limit:async()=>{called=true;return {success:true}}}});
 assert.equal(response.status,403); assert.equal(called,false);
});
test('fails closed for missing or failed limiter and returns 429 on exhaustion', async () => {
 const request=new Request('https://example.com/api/enquiry');
 assert.equal((await requestGate(request,{})).status,503);
 assert.equal((await requestGate(request,{ENQUIRY_RATE_LIMIT:{limit:async()=>{throw new Error('offline')}}})).status,503);
 const response=await requestGate(request,{ENQUIRY_RATE_LIMIT:{limit:async()=>({success:false})}});
 assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'60');
});
