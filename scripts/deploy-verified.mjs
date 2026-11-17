import {appendFileSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import {currentReleaseContext,previewURL} from './release-policy.mjs';
const s=JSON.parse(readFileSync('release-settings.json'));
const release=currentReleaseContext();
if(!process.env.CLOUDFLARE_API_TOKEN)throw Error('Missing site deployment token');
if(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==release.sha)throw Error('Incorrect checkout');
function run(args){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',maxBuffer:20*1024*1024});if(r.stderr)process.stderr.write(r.stderr);if(r.error||r.status!==0){process.stdout.write(r.stdout||'');throw Error('Deployment failed');}return r.stdout;}
let url,version;
if(release.preview){const output=run(['preview','--config','wrangler.preview.json','--ignore-base-config','--name',`pr-${release.number}`,'--message',`GitHub ${release.sha}`,'--json']);const data=JSON.parse(output.slice(output.indexOf('{')));url=previewURL(data.preview?.urls?.[0]);version=data.deployment?.id;}
else{const output=run(['versions','upload','--config','wrangler.release.json','--keep-vars','--tag',release.sha.slice(0,12),'--message',`GitHub ${release.sha}`]);version=output.match(/(?:Worker )?Version ID:\s*([a-f0-9-]{36})/i)?.[1];if(!version)throw Error('Missing uploaded version');run(['versions','deploy',`${version}@100%`,'--yes','--config','wrangler.release.json','--message',`GitHub ${release.sha}`]);url=s.productionURL;}
if(!version)throw Error('Missing deployment ID');
const record={commit:release.sha,worker:s.worker,preview:release.preview,url,version};
writeFileSync('deployment-result.json',JSON.stringify(record,null,2)+'\n');
appendFileSync(process.env.GITHUB_OUTPUT,`url=${url}\nversion=${version}\n`);
appendFileSync(process.env.GITHUB_STEP_SUMMARY,`### ${s.worker} ${release.preview?'preview':'production'}\n\n[Open deployment](${url})\n\nTested commit: ${release.sha}\n\nCloudflare version: ${version}\n`);
console.log(JSON.stringify(record));
