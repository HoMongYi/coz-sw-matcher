import fs from 'node:fs';import {execFileSync} from 'node:child_process';
// Scan locally, report codes/paths only. Never echo matched values or blob bodies.
const git=args=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:16_777_216});
const objects=git(['rev-list','--objects','--all']).trim().split('\n').map(line=>{const [sha,...name]=line.split(' ');return {sha,path:name.join(' ')};}).filter(o=>o.path);
const findings=[];let scanned=0;
for(const o of objects){
 if(git(['cat-file','-t',o.sha]).trim()!=='blob')continue;scanned++;
 const body=git(['cat-file','blob',o.sha]);
 for(const [code,re] of Object.entries({PRIVATE_KEY:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,TOKEN_LITERAL:/\b(?:sk-[a-zA-Z0-9_-]{20,}|gh[pousr]_[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16})\b/,CREDENTIAL_ASSIGNMENT:/(?:api_key|apikey|password|access_token)\s*[:=]\s*["'][A-Za-z0-9_-]{24,}["']/iu}))if(re.test(body))findings.push({path:o.path,code,blob:o.sha});
 if(/(^|\/)(?:data\/private|exports)\/|(?:^|\/)\.env(?:\.|$)/u.test(o.path)&&!o.path.endsWith('.env.example'))findings.push({path:o.path,code:'PRIVATE_PATH',blob:o.sha});
}
const report={status:findings.length?'Needs verification':'Passed',scope:'all currently reachable local refs, including remote tracking refs and preserved tags',commits:Number(git(['rev-list','--all','--count']).trim()),blobs:scanned,findings,limitation:'Known-pattern scan only; absence of findings does not establish complete data provenance or erase previously published material.'};
fs.mkdirSync('reports/local',{recursive:true});fs.writeFileSync('reports/local/history-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
