import test from 'node:test';import assert from 'node:assert/strict';
import {createMatcher} from '../src/index.mjs';
import {createMatcherHttpServer} from '../src/interfaces/http.mjs';
import {createMatcherMcpServer} from '../src/interfaces/mcp.mjs';
import {main} from '../bin/coz-sw-matcher.mjs';
import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const input={product_name:'[GIGABYTE] H610M K D4 제이씨현 벌크'};
test('CLI parse and match expose Compuzone contract with no automatic approval',async()=>{
 let text='';await main(['parse',input.product_name],{write:s=>text+=s});assert.equal(JSON.parse(text).model,'H610M K D4');
 text='';await main(['match',input.product_name],{write:s=>text+=s});const r=JSON.parse(text);assert.equal(r.approved,false);assert.ok(r.candidates.length<=5);
});
test('HTTP returns matcher contract, enforces host/origin/auth/limits and has no approval mutation',async()=>{
 const s=createMatcherHttpServer(createMatcher(),{token:'synthetic-token',maxBytes:2000});await new Promise(r=>s.listen(0,'127.0.0.1',r));
 try{const base=`http://127.0.0.1:${s.address().port}`;const post=(p,b,auth=true)=>fetch(base+p,{method:'POST',headers:{'content-type':'application/json',...(auth?{authorization:'Bearer synthetic-token'}:{})},body:JSON.stringify(b)});
  assert.equal((await fetch(base+'/health')).status,401);assert.equal((await post('/v1/match',input,false)).status,401);
  const r=await(await post('/v1/match',input)).json();assert.equal(r.approved,false);assert.equal(r.parsed.model,'H610M K D4');
  assert.equal((await post('/v1/approvals',{})).status,404);assert.equal((await post('/v1/match',{product_name:'x'.repeat(2500)})).status,413);
  assert.equal((await fetch(base+'/health',{headers:{origin:'https://example.com',authorization:'Bearer synthetic-token'}})).status,403);
 }finally{await new Promise(r=>s.close(r));}
});
test('MCP official SDK lists read-only matcher tools and returns the same contract',async()=>{
 const {Client,InMemoryTransport}=await import('@modelcontextprotocol/client');const server=createMatcherMcpServer(createMatcher());const client=new Client({name:'synthetic',version:'1'});const[a,b]=InMemoryTransport.createLinkedPair();await Promise.all([server.connect(b),client.connect(a)]);
 try{const list=await client.listTools();assert.equal(list.tools.length,3);assert.ok(list.tools.every(t=>t.annotations.readOnlyHint));const r=await client.callTool({name:'match_official_software_candidates',arguments:input});assert.equal(r.structuredContent.approved,false);assert.equal(r.structuredContent.parsed.model,'H610M K D4');}finally{await client.close();await server.close();}
});
test('new MCP CLI interoperates over actual stdio and the Skill wrapper reaches the same CLI',async()=>{
 const {Client}=await import('@modelcontextprotocol/client');const {StdioClientTransport}=await import('@modelcontextprotocol/client/stdio');const root=fileURLToPath(new URL('../',import.meta.url));
 const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'bin/coz-sw-matcher.mjs'),'mcp'],stderr:'pipe'});const client=new Client({name:'synthetic-coz-stdio',version:'1'});
 await client.connect(transport);try{const r=await client.callTool({name:'match_official_software_candidates',arguments:input});assert.equal(r.structuredContent.approved,false);assert.equal(r.structuredContent.parsed.model,'H610M K D4');}finally{await client.close();}
 const parsed=JSON.parse(execFileSync(process.execPath,[path.join(root,'skills/coz-sw-matcher/scripts/coz-sw-matcher.mjs'),'parse',input.product_name],{encoding:'utf8',windowsHide:true}));assert.equal(parsed.model,'H610M K D4');
});
