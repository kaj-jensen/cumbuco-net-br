import {spawnSync} from 'node:child_process';
const report = JSON.parse(spawnSync('npm',['audit','--json',...process.argv.slice(2)],{encoding:'utf8'}).stdout);
const items = report.vulnerabilities;
if (!items) throw new Error('Audit unavailable');
function check(name) {
  const item = items[name];
  if (!item) return false;
  return item.via.every(x => typeof x === 'string' ? check(x) : x.url === 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf');
}
const blocked = Object.keys(items).filter(n => !check(n));
if (blocked.length) throw new Error('Unapproved advisories: '+blocked.join(',') );
console.log('Audit passed; only approved GHSA-fc5q-39xc-vjpf build-tool exposure may remain.');
