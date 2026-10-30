#!/usr/bin/env node
import {VERSION} from '../src/version.mjs';
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {createMatcher,parseProductName,loadReviewedOverlay,SerpApiSearchProvider,LunaRanker,approvalContract} from '../src/index.mjs';
export async function main(argv=process.argv.slice(2),{write=s=>process.stdout.write(s),matcher:injected}={}){
 const args=[],flags={};for(let i=0;i<argv.length;i++){
  const a=argv[i];if(['--online','--luna','--help'].includes(a))flags[a.slice(2)]=true;
  else if(['--input','--output','--overlay','--kind','--port','--host','--target-component'].includes(a)){if(!argv[i+1]||argv[i+1].startsWith('--'))throw new Error('OPTION_VALUE_REQUIRED');flags[a.slice(2)]=argv[++i];}
  else if(a.startsWith('--'))throw new Error('UNKNOWN_OPTION');else args.push(a);
 }
 if(flags.help||!args.length){write('Coz SW Matcher '+VERSION+'\nparse NAME\nmatch NAME [--input request.json] [--kind driver] [--overlay data/private/reviewed-registry.json] [--online] [--luna] [--output result.json]\nserve [--host 127.0.0.1] [--port 8787] [--online]\nmcp [--online]\napproval-contract\n');return;}
 if(flags.luna&&!flags.online)throw new Error('LUNA_REQUIRES_ONLINE');
 const matcher=injected||createMatcher({overlay:flags.overlay?loadReviewedOverlay(flags.overlay):undefined,search:flags.online&&process.env.SERPAPI_API_KEY?new SerpApiSearchProvider():undefined,ranker:flags.luna?new LunaRanker():undefined,minIntervalMs:flags.online?250:0});
 const emit=value=>{const text=JSON.stringify(value,null,2)+'\n';if(flags.output)fs.writeFileSync(path.resolve(flags.output),text,{flag:'wx'});else write(text);};
 if(args[0]==='approval-contract'){emit(approvalContract);return;}
 if(args[0]==='parse'){emit(parseProductName(args.slice(1).join(' '),{vendors:matcher.registry.vendors}));return;}
 if(args[0]==='match'){
  let input;if(flags.input){if(fs.statSync(flags.input).size>65536)throw new Error('INPUT_TOO_LARGE');input=JSON.parse(fs.readFileSync(flags.input,'utf8'));}else input={product_name:args.slice(1).join(' ')};
  if(flags.kind)input.requested_software_kind=flags.kind;if(flags['target-component']!=null)input.target_component=Number(flags['target-component']);emit(await matcher.match(input,{online:!!flags.online}));return;
 }
 if(args[0]==='mcp'){const {startMatcherMcp}=await import('../src/interfaces/mcp.mjs');return startMatcherMcp(matcher,{allowOnline:!!flags.online});}
 if(args[0]==='serve'){
  const {createMatcherHttpServer}=await import('../src/interfaces/http.mjs');const host=flags.host||'127.0.0.1',port=Number(flags.port||8787),token=process.env.COZ_SW_HTTP_TOKEN;
  if(!['127.0.0.1','localhost','::1'].includes(host)&&!token)throw new Error('HTTP_TOKEN_REQUIRED');if(!Number.isInteger(port)||port<0||port>65535)throw new Error('INVALID_PORT');
  const server=createMatcherHttpServer(matcher,{token,allowOnline:!!flags.online});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});process.stderr.write(`Coz SW Matcher listening on ${host}:${server.address().port}\n`);return server;
 }
 throw new Error('UNKNOWN_COMMAND');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(()=>{process.stderr.write('COZ_SW_COMMAND_FAILED: check input, options and provider configuration.\n');process.exitCode=2;});
