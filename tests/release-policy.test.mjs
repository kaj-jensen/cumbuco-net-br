import {test} from 'node:test';
import assert from 'node:assert/strict';
import {releaseContext,previewURL} from '../scripts/release-policy.mjs';
const sha='a'.repeat(40);
const env={GITHUB_REPOSITORY:'kaj-jensen/cumbuco-net-br',GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/codex/initial-build',RELEASE_SHA:sha,GITHUB_ACTOR:'kaj-jensen'};
test('production release policy rejects wrong repository, branch and trigger',()=>{
 assert.equal(releaseContext(env,{}).preview,false);
 for(const change of [{GITHUB_REPOSITORY:'other/site'},{GITHUB_REF:'refs/heads/other'},{GITHUB_EVENT_NAME:'pull_request_target'},{RELEASE_SHA:'main'}]) assert.throws(()=>releaseContext({...env,...change},{}));
});
test('preview policy accepts only the exact open same-repository PR commit',()=>{
 const vars={...env,GITHUB_EVENT_NAME:'pull_request',PR_NUMBER:'28'};
 const event={number:28,pull_request:{state:'open',head:{sha,repo:{full_name:env.GITHUB_REPOSITORY}}}};
 assert.equal(releaseContext(vars,event).number,28);
 assert.throws(()=>releaseContext({...vars,GITHUB_ACTOR:'dependabot[bot]'},event));
 for(const change of [{state:'closed'},{head:{sha:'b'.repeat(40),repo:{full_name:env.GITHUB_REPOSITORY}}},{head:{sha,repo:{full_name:'fork/site'}}}]) assert.throws(()=>releaseContext(vars,{...event,pull_request:{...event.pull_request,...change}}));
});
test('preview verification refuses unrelated or credential-bearing URLs',()=>{
 assert.equal(previewURL('https://pr-28-cumbuco-net-br.kaj-jensen-d29.workers.dev'),'https://pr-28-cumbuco-net-br.kaj-jensen-d29.workers.dev');
 for(const url of ['https://evil.example','http://pr-28-cumbuco-net-br.kaj-jensen-d29.workers.dev','https://user@pr-28-cumbuco-net-br.kaj-jensen-d29.workers.dev','https://pr-28-cumbuco-net-br.kaj-jensen-d29.workers.dev/?x=1']) assert.throws(()=>previewURL(url));
});
