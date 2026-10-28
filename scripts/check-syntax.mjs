import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]).filter(p=>p.endsWith('.mjs'));}
const checked=['src','bin','scripts','tests','examples','skills'].flatMap(files);let failures=0;
for(const file of checked){const p=spawnSync(process.execPath,['--check',file],{encoding:'utf8',windowsHide:true});if(p.status!==0){console.error(file,p.stderr);failures++;}}
console.log(JSON.stringify({status:failures?'Failed':'Passed',files:checked.length,failures}));if(failures)process.exitCode=1;
