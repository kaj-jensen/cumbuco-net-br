import {execFileSync} from 'node:child_process';
execFileSync('gh',['workflow','run','browser-checks.yml','--ref',"codex/initial-build",'--repo',"kaj-jensen/cumbuco-net-br"],{stdio:'inherit'});
