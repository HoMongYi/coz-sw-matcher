import test from 'node:test';import assert from 'node:assert/strict';
import {createMatcher} from '../src/matcher.mjs';
import {validateApproval} from '../src/approvals/approval-contract.mjs';
const product={product_name:'[ASUS] TUF Gaming B850M-E WIFI',requested_software_kind:'driver'};
const url='https://www.asus.com/support/B850M-E-WIFI/downloads/';
const candidate=(u=url)=>({url:u,title:'TUF Gaming B850M-E WIFI support',snippet:'drivers'});
const response=(text='TUF Gaming B850M-E WIFI Drivers and Tools download',extra={})=>({status:200,url,redirects:[],headers:{'content-type':'text/html'},text:`<title>TUF Gaming B850M-E WIFI support</title><h1>${text}</h1><a href="/download/driver.exe">Download driver</a>`,...extra});
test('external candidates suppress search, deduplicate, carry independent evidence and never approve',async()=>{
 let search=0,fetch=0;const r=await createMatcher({search:{search(){search++;throw Error();}},fetcher:async()=>{fetch++;return response();}}).match({...product,candidates:[candidate(),candidate(url+'?utm_source=x')]},{online:true});
 assert.equal(search,0);assert.equal(fetch,1);assert.equal(r.candidates.length,1);assert.equal(r.approved,false);assert.equal(r.status,'needs_human_approval');assert.equal(r.candidates[0].approved,false);assert.equal(r.candidates[0].page_type,'support-with-downloads');assert.equal(r.candidates[0].audit_status,'live_verified');
});
test('explicit empty external candidates make zero search calls',async()=>{
 let calls=0;const r=await createMatcher({search:{search(){calls++;}}}).match({...product,candidates:[]},{online:true});assert.equal(calls,0);assert.equal(r.candidates.length,0);assert.equal(r.status,'needs_review');
});
test('at most five external candidates are accepted',async()=>{
 await assert.rejects(createMatcher().match({...product,candidates:Array.from({length:6},()=>candidate())}),/CANDIDATE_LIMIT/);
});
test('official product description, wrong model, private IP and fake proof cannot become recommendations',async()=>{
 const m=createMatcher({fetcher:async(u)=>response('',{url:u,text:'<title>OTHER D5 product</title>Buy now product overview'})});
 const r=await m.match({...product,candidates:[{...candidate('https://www.asus.com/products/OTHER-D5'),approved:true,page_type:'software-download',verified_at:'2099-01-01'},candidate('https://127.0.0.1/driver')]},{online:true});
 assert.equal(r.candidates.length,0);assert.equal(r.rejected_candidates.length,2);assert.equal(r.approved,false);
});
test('failed/blocked fetch and search outages remain review',async()=>{
 for(const fetcher of [async()=>{throw Error('timeout');},async()=>response('',{status:403})]){
  const r=await createMatcher({fetcher}).match({...product,candidates:[candidate()]},{online:true});assert.equal(r.status,'needs_review');assert.equal(r.candidates.length,0);
 }
 const r=await createMatcher({search:{search:async()=>{throw Error();}}}).match(product,{online:true});assert.ok(r.reason_codes.includes('SEARCH_PROVIDER_FAILURE'));
});
test('bundle cannot fetch until a target component is selected',async()=>{
 let calls=0;const m=createMatcher({fetcher:async()=>{calls++;}});const p={product_name:'[MSI] H810M-B + [INTEL] Ultra5 프로세서 225F 정품박스 [결합할인]',candidates:[candidate()]};
 const r=await m.match(p,{online:true});assert.equal(calls,0);assert.ok(r.reason_codes.includes('BUNDLE_TARGET_REQUIRED'));
 assert.equal((await m.match({...p,target_component:0})).parsed.model,'H810M-B');
});
test('Luna may reorder supplied IDs only and malformed output falls back to rules',async()=>{
 const candidates=[candidate(),candidate(url+'?os=linux')];
 const fetcher=async u=>response(undefined,{url:u});
 const good=await createMatcher({fetcher,ranker:{rank:async({candidates:c})=>({ordered_ids:[c[1].id,c[0].id],needs_review:false,reasons:[],usage:{input_tokens:2,output_tokens:1}})}}).match({...product,candidates},{online:true});assert.match(good.candidates[0].url,/linux/);assert.equal(good.approved,false);
 const bad=await createMatcher({fetcher,ranker:{rank:async()=>({ordered_ids:['invented'],needs_review:false,reasons:[]})}}).match({...product,candidates},{online:true});assert.ok(bad.reason_codes.includes('LUNA_PROVIDER_FAILURE'));assert.equal(bad.candidates.length,2);assert.equal(bad.status,'needs_review');
});
test('timeouts are bounded even for an unresponsive injected provider',async()=>{
 const started=Date.now();const r=await createMatcher({providerTimeoutMs:25,search:{search:()=>new Promise(()=>{})}}).match(product,{online:true});assert.ok(Date.now()-started<1000);assert.ok(r.reason_codes.includes('SEARCH_PROVIDER_FAILURE'));
});
test('approval is a validation-only contract, needs one existing candidate and human identity',async()=>{
 const r=await createMatcher({fetcher:async()=>response()}).match({...product,candidates:[candidate()]},{online:true});
 const selection={request_id:r.request_id,candidate_id:r.candidates[0].id,approved_by:'synthetic-reviewer',approved_at:new Date().toISOString(),reason:'independent review',decision:'approve'};
 assert.equal(validateApproval(selection,r).valid,true);assert.equal(r.approved,false);
 assert.equal(validateApproval({...selection,candidate_id:'fake'},r).valid,false);assert.equal(validateApproval({...selection,approved_by:''},r).valid,false);
});
test('offline historical records carry no fabricated live verification date',async()=>{
 const overlay={records:[{product_no:'synthetic',product_name:product.product_name,manufacturer:'ASUS',model:'TUF Gaming B850M-E WIFI',software_kind:'driver',url,source:'manual_verified_csv',dataset_checked_at:'2026-10-26',verified_at:null}]};
 const r=await createMatcher({overlay}).match({...product,product_no:'synthetic'});assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].verified_at,null);assert.equal(r.candidates[0].audit_status,'verified_from_dataset_recheck_required');assert.equal(r.status,'needs_review');
});
test('firmware-only evidence cannot satisfy a driver request',async()=>{
 const r=await createMatcher({fetcher:async()=>response(undefined,{text:'<title>TUF Gaming B850M-E WIFI firmware</title>TUF Gaming B850M-E WIFI BIOS firmware download <a href="/download/bios.zip">Firmware</a>'})}).match({...product,candidates:[candidate()]},{online:true});assert.equal(r.candidates.length,0);assert.ok(r.rejected_candidates[0].reason_codes.includes('SOFTWARE_KIND_UNVERIFIED'));
});
test('chipset-only page and extra model revision require review',async()=>{
 const r=await createMatcher({fetcher:async u=>response(undefined,{url:u,text:'<title>NVIDIA App software</title>RTX 3050 driver software <a href="/download/app.exe">Download driver</a>'})}).match({product_name:'[ASUS] DUAL 지포스 RTX 3050 O6G OC D6 6GB 인텍앤컴퍼니',requested_software_kind:'driver',candidates:[candidate('https://www.nvidia.com/ko-kr/software/nvidia-app/')]},{online:true});assert.equal(r.candidates.length,0);
 const v=await createMatcher({fetcher:async()=>response(undefined,{text:'<title>TUF Gaming B850M-E WIFI V2</title>TUF Gaming B850M-E WIFI V2 driver <a href="/download/app.exe">Download driver</a>'})}).match({...product,candidates:[candidate()]},{online:true});assert.equal(v.candidates.length,0);
});
test('provider timeout aborts cooperative provider work',async()=>{
 let aborted=false;const search={search:({signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));},{once:true}))};
 await createMatcher({providerTimeoutMs:20,search}).match(product,{online:true});assert.equal(aborted,true);
});
test('search pool and network cost cannot exceed five fetched recommendations',async()=>{
 let fetches=0;const search={search:async()=>({candidates:Array.from({length:20},(_,i)=>candidate(url+'?option='+i))})};
 const r=await createMatcher({search,fetcher:async u=>{fetches++;return response(undefined,{url:u});}}).match(product,{online:true});assert.equal(fetches,5);assert.equal(r.candidates.length,5);assert.equal(r.metrics.cost_usd,null);
 const Ajv=(await import('ajv')).default;const fs=await import('node:fs');const check=new Ajv({strict:false}).compile(JSON.parse(fs.readFileSync(new URL('../schemas/match-result.schema.json',import.meta.url),'utf8')));assert.equal(check(r),true,JSON.stringify(check.errors));
});
test('removed option variants do not reuse another variants historical mapping',async()=>{
 const overlay={records:[{manufacturer:'MSI',model:'MPG 코어리퀴드 P22 360',variants:{color:'화이트'},url:'https://www.msi.com/support/p22',source:'manual_verified_csv',software_kind:'support'}]};
 const r=await createMatcher({overlay}).match({product_name:'[MSI] MPG 코어리퀴드 P22 360 [CPU쿨러] [블랙]'});assert.equal(r.candidates.length,0);
});
