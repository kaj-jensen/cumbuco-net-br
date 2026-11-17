import { execFileSync, spawnSync } from "node:child_process";
import { experimental_readRawConfig } from "wrangler";
const repository = "kaj-jensen/cumbuco-net-br";
const branch = "codex/initial-build";
const config = "wrangler.jsonc";
function output(command,args) { return execFileSync(command,args,{encoding:"utf8"}).trim(); }
function verify() {
  const remote=output("git",["remote","get-url","origin"]);
  if(![ `https://github.com/${repository}.git`, `git@github.com:${repository}.git`].includes(remote))throw new Error("Unexpected GitHub source");
  if(output("git",["branch","--show-current"])!==branch || output("git",["status","--porcelain"]))throw new Error("Release requires a clean production branch");
  const sha=output("git",["rev-parse","HEAD"]);
  if(output("git",["ls-remote","origin",`refs/heads/${branch}`]).split(/\s/)[0]!==sha)throw new Error("Production branch differs from GitHub");
  const checks=JSON.parse(output("gh",["api",`repos/${repository}/commits/${sha}/check-runs?per_page=100`]));
  const latest=new Map();
  for(const check of checks.check_runs ?? [])if(!latest.has(check.name))latest.set(check.name,check);
  if(['audit', 'no-vinext', 'scan'].some(name=>!latest.has(name) || latest.get(name).conclusion!=="success") || [...latest.values()].some(check=>check.status!=="completed" || !["success","neutral","skipped"].includes(check.conclusion)))throw new Error("Exact production commit checks must pass before release");
  return sha;
}
const sha=verify();
for(const command of ["npm test", "npm run build"]) {
  const [name,...args]=command.split(" ");
  const result=spawnSync(name,args,{stdio:"inherit"});
  if(result.status!==0)process.exit(result.status ?? 1);
}
const target=experimental_readRawConfig({config}).rawConfig;
if(target.name!=="cumbuco-net-br" || (target.account_id && target.account_id!=="d29f48cc069d51d0787fc306533039e1"))throw new Error("Unexpected Cloudflare target");
if(verify()!==sha)throw new Error("Source changed during validation");
const args=["exec","--","wrangler","deploy","-c",config,"--keep-vars","--tag",sha];
const result=spawnSync("npm",args,{stdio:"inherit",env:{...process.env,CLOUDFLARE_ACCOUNT_ID:"d29f48cc069d51d0787fc306533039e1"}});
process.exit(result.status ?? 1);
