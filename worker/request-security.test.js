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

import worker from './index.js';
test('rejects scalar JSON before any email side effects', async()=>{
 const host='www.cumbuco.net.br';
 for(const body of ['null','[]','1']){
  let sent=false;
  const env={ENQUIRY_RATE_LIMIT:{limit:async()=>({success:true})},EMAIL:{send:async()=>{sent=true}},ENQUIRY_TO:'test@example.invalid',TURNSTILE_SECRET_KEY:'test-only'};
  const response=await worker.fetch(new Request('https://'+host+'/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body}),env,{});
  assert.equal(response.status,400);assert.equal(sent,false);
 }
});

test('preview API requests are rejected before touching production bindings',async()=>{
 let touched=false;const binding=new Proxy({}, {get(){touched=true;throw Error('binding accessed');}});
 for(const endpoint of ['/api/enquiry','/api/events','/api/availability']){
  const response=await worker.fetch(new Request('https://preview.example.workers.dev'+endpoint,{method:endpoint==='/api/availability'?'GET':'POST'}),binding,{});
  assert.equal(response.status,403);assert.equal(touched,false);
 }
});

test('asset failures cross the real Worker boundary without leaking exception text',async()=>{
 const original=console.error;const records=[];console.error=value=>records.push(value);
 try {
  const response=await worker.fetch(new Request('https://www.cumbuco.net.br/'),{ASSETS:{fetch:async()=>{throw Error('private-provider-details')}}},{});
  assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/private-provider/);
  assert.ok(response.headers.get('X-Request-ID'));assert.doesNotMatch(records.join(''),/private-provider/);
 } finally {console.error=original;}
});
