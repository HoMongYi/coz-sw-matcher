// SYNTHETIC counterexamples; public product names/URLs are independently labelled below.
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProductName,createMatcher} from '../src/index.mjs';
import {pageEvidence} from '../src/network.mjs';
import {rankCandidates,applyLunaRanking} from '../src/ranking/candidate-ranker.mjs';
import {resolveSoftwareTarget} from '../src/matching/software-target-resolver.mjs';
import {loadRegistry} from '../src/registry.mjs';
import {fixtureRegistry,fixtureVendor} from './fixtures.mjs';
import {validateRegistry} from '../src/registry.mjs';
import {inspectReviewedCsv} from '../src/local-data/reviewed-csv.mjs';

const response=(url,text)=>({url,status:200,redirects:[],headers:{'content-type':'text/html'},verified_at:'2026-10-29',text});
const run=(html,input={})=>createMatcher({fetcher:async url=>response(url,html)}).match({product_name:'[ASUS] MODEL123',candidates:[{url:'https://www.asus.com/support/MODEL123/'}],...input},{online:true});

for(const [name,model,color] of [
 ['[ASUS] PRIME B760M-A [WIFI 블랙]','PRIME B760M-A WIFI','블랙'],
 ['[ASUS] MODEL123 (D5 화이트)','MODEL123 D5','화이트'],
 ['[ASUS] MODEL123 [V2 특가]','MODEL123 V2',undefined],
 ['[ASUS] MODEL123 (II Rev 2.0 블랙 행사)','MODEL123 II Rev 2.0','블랙']
])test('mixed bracket retains model: '+name,()=>{const p=parseProductName(name);assert.equal(p.model,model);assert.equal(p.variants.color,color);assert.equal(p.raw_product_name,name);});

test('SE+ suffix is preserved before a real bundle separator',()=>{
 const p=parseProductName('[ATK] R1 SE+ + [ASUS] MODEL123 V2');assert.equal(p.components.length,2);assert.equal(p.components[0].model,'R1 SE+');assert.equal(p.components[1].model,'MODEL123 V2');
 assert.equal(parseProductName('[삼성전자] SL-M2640 ▶ SL-M2630 후속모델 ◀').model,'SL-M2640');
});

for(const negative of ['MODEL123 is not supported','MODEL123 미지원','MODEL123은 지원하지 않음','Excluded models: MODEL123'])test('negative support cannot borrow other model download: '+negative,async()=>{
 const r=await run(`<title>MODEL123 support</title><p>${negative}</p><a href="/download/MODEL999.exe">MODEL999 driver download</a>`);
 assert.equal(r.candidates.length,0);assert.equal(r.status,'needs_review');assert.ok(r.rejected_candidates[0].reason_codes.includes('MODEL_EXPLICITLY_UNSUPPORTED'));
});
test('different model link cannot satisfy an exact model header',async()=>{
 const r=await run('<title>MODEL123 support</title><p>MODEL123 specifications</p><a href="/download/MODEL999.exe">MODEL999 driver</a>');assert.equal(r.candidates.length,0);
});
test('positive exact driver retains the supporting relation',async()=>{
 const r=await run('<html lang="ko"><title>MODEL123 매뉴얼 &amp; 다운로드</title><h1>MODEL123 드라이버</h1><a href="/download/MODEL123.exe">MODEL123 드라이버 다운로드</a></html>');
 assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].support_evidence[0].relationship,'direct-model');assert.equal(r.candidates[0].verification.model_support,'confirmed');assert.equal(r.approved,false);
});
test('firmware alone does not satisfy a general peripheral software request',async()=>{
 const r=await run('<title>MODEL123 마우스 support</title><p>MODEL123 firmware BIOS</p><a href="/download/MODEL123.zip">MODEL123 firmware</a>',{product_name:'[ASUS] MODEL123 마우스'});assert.equal(r.candidates.length,0);
});
test('page parser preserves language, anchors and app controls',()=>{
 const p=pageEvidence(response('https://gearlink.asus.com/','<html lang="ko-KR"><title>Gear Link</title><p>Supported models: HARPE MINI CORE</p><button>Connect device</button><a href="/?lang=ko_KR" lang="ko">한국어</a></html>'));
 assert.equal(p.language,'ko-KR');assert.ok(p.link_details.some(l=>l.text==='한국어'));assert.ok(p.controls.includes('Connect device'));
});

// PUBLIC_SOURCE_ONLY name/URL; HTML remains SYNTHETIC, not a live support claim.
test('default ASUS RTX 3050 request targets NVIDIA without asserting legacy app support',()=>{
 const registry=loadRegistry();const p=parseProductName('[ASUS] DUAL 지포스 RTX 3050 O6G OC D6 6GB 인텍앤컴퍼니');assert.equal(resolveSoftwareTarget(p,undefined,registry).software_provider,'NVIDIA');assert.equal(resolveSoftwareTarget(p,'firmware',registry).software_provider,'ASUS');
});
test('verified Korean policy survives Luna and URLs alone do not verify language',()=>{
 const en={id:'en',url:'https://desktop.atkgear.com/',audit_status:'live_verified',page_type:'web-app',locale:{page_language:'en',korean_available:false,verified:true},policy_priority:0};
 const ko={id:'ko',url:'https://www.atk.store/ko-kr/pages/atk-hub',audit_status:'live_verified',page_type:'software-download',locale:{page_language:'ko',korean_available:true,verified:true},policy_priority:0};
 const ranked=rankCandidates([en,ko]);assert.equal(ranked[0].id,'ko');assert.equal(applyLunaRanking({ordered_ids:['en','ko'],needs_review:false,reasons:[]},ranked)[0].id,'ko');
 for(const url of ['https://kr.msi.com/a','https://www.corsair.com/kr/ko/a','https://www.atk.store/ko-kr/a','https://www.asus.com/a?lang=ko_KR']){
  const r=rankCandidates([{...en,id:'a',url,locale:undefined},{...en,id:'b'}]);assert.equal(r[0].score,r[1].score);
 }
});

function sharedRegistry({web=false}={}){
 const v=fixtureVendor();v.name='ASUS';v.id='asus';v.aliases=['ASUS'];v.domains=['www.asus.com','gearlink.asus.com'];v.models=[];
 const url=web?'https://gearlink.asus.com/':'https://www.asus.com/software/hub/';
 v.ecosystems=[{id:'synthetic-shared',name:web?'Gear Link':'Control Center',canonical_page:url,status:'needs-refresh',verified_at:null,provenance:['https://www.asus.com/faq/compatibility'],support_mode:'explicit-model-list',supported_models:['MODEL123'],excluded_models:[],software_kind:web?'web-driver':'control-app',evidence:[{relationship:'software-support',source_url:'https://www.asus.com/faq/compatibility',target_url:url,models:['MODEL123'],software_kind:web?'web-driver':'control-app',software_name:web?'Gear Link':'Control Center',match_text:[web?'Gear Link':'Control Center','Supported models: MODEL123'],observed_fact:'SYNTHETIC support list links the tool.',checked_at:'2026-10-29',unknowns:[]}]}];return fixtureRegistry(v);
}
for(const web of [false,true])test('separate official support list validates '+(web?'root web tool':'common app hub'),async()=>{
 const registry=sharedRegistry({web});const url=registry.vendors[0].ecosystems[0].canonical_page;
 const fetcher=async u=>response(u,u.includes('/faq/')?`<title>Compatibility</title><p>${web?'Gear Link':'Control Center'} Supported models: MODEL123</p><a href="${url}">Open tool</a>`:web?'<title>Gear Link</title><p>web-based configuration tool</p><button>Connect device</button>':'<title>Control Center software</title><a href="/download/center.exe">Download Control Center</a>');
 const r=await createMatcher({registry,fetcher}).match({product_name:'[ASUS] MODEL123',candidates:[{url}]},{online:true});assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].audit_status,'live_verified');assert.ok(r.candidates[0].support_evidence.some(e=>e.relationship==='software-support'));assert.equal(r.candidates[0].page_type,web?'web-app':'software-download');
 const wrong=await createMatcher({registry,fetcher}).match({product_name:'[ASUS] MODEL124',candidates:[{url}]},{online:true});assert.equal(wrong.candidates.length,0);
});
test('an app introduction without executable controls is not the web tool',async()=>{
 const registry=sharedRegistry({web:true});const url=registry.vendors[0].ecosystems[0].canonical_page;
 const r=await createMatcher({registry,fetcher:async u=>response(u,u.includes('faq')?'<p>Gear Link Supported models: MODEL123</p>':'<title>Gear Link</title><p>Web-based configuration tool coming soon</p>')}).match({product_name:'[ASUS] MODEL123',candidates:[{url}]},{online:true});assert.equal(r.candidates.length,0);
});
test('failed or changed support list never promotes a shared app',async()=>{
 const registry=sharedRegistry();const url=registry.vendors[0].ecosystems[0].canonical_page;
 for(const blocked of [true,false]){const r=await createMatcher({registry,fetcher:async u=>u.includes('faq')?blocked?{...response(u,''),status:403}:response(u,'<p>Control Center Supported models: MODEL999</p>'):response(u,'<title>Control Center software</title><a href="/download/center.exe">Download Control Center</a>')}).match({product_name:'[ASUS] MODEL123',candidates:[{url}]},{online:true});assert.equal(r.candidates.length,0);}
});

const publicCases=[
 ['ASUS','DUAL RTX 3050 O6G OC','https://www.nvidia.com/ko-kr/software/nvidia-app/'],
 ['AULA','F87 Pro','https://funkeys.co.kr/bbs/board.php?bo_table=download&wr_id=269'],
 ['Canon','GX6092','https://asia.canon/en/support/MAXIFY%20GX6070/model'],
 ['Samsung','SL-C4030ND','https://www.samsung.com/sec/support/model/SL-C4030ND/']
];
for(const [brand,model,url] of publicCases)test('public documented mapping is available without fabricating a live check: '+model,async()=>{
 const r=await createMatcher().match({product_name:`[${brand}] ${model}`});assert.ok(r.candidates.some(c=>c.url===url));assert.ok(r.candidates.every(c=>c.audit_status!=='live_verified'&&c.verified_at===null));assert.equal(r.status,'needs_review');
});
test('COX accepts the documented ABKO support host but empty room stays unresolved',async()=>{
 const r=await createMatcher({fetcher:async u=>response(u,'<html lang="ko"><title>자료실 및 다운로드 | ABKO</title><p>COX 자료실 검색 결과 0건</p></html>')}).match({product_name:'[COX] MODEL123 키보드',candidates:[{url:'https://www.abko.co.kr/cscenter/dataroom.php?device=pc'}]},{online:true});assert.equal(r.candidates.length,0);assert.ok(!r.rejected_candidates[0].reason_codes.includes('UNOFFICIAL_DOMAIN'));assert.equal(r.status,'needs_review');
});
test('unconfirmed AULA intermediary and other F87 revisions cannot inherit F87 Pro mapping',async()=>{
 for(const model of ['F87 유선','F87 Pro V2']){const r=await createMatcher().match({product_name:`[AULA] ${model}`});assert.equal(r.candidates.length,0);}
 const r=await createMatcher({fetcher:async u=>response(u,'<title>F87 Pro driver</title><a href="/download/F87.exe">F87 Pro driver</a>')}).match({product_name:'[AULA] F87 Pro',candidates:[{url:'https://aulakeyboard.com/ko/download/aula-f87-pro-driver/'}]},{online:true});assert.equal(r.candidates.length,0);assert.ok(r.rejected_candidates[0].reason_codes.includes('UNOFFICIAL_DOMAIN'));
});
test('Canon manual/profile relations alone cannot certify similar suffix models or firmware',async()=>{
 for(const name of ['[Canon] GX6099','[Canon] G3970']){const r=await createMatcher().match({product_name:name});assert.equal(r.candidates.length,0);}
 const r=await createMatcher().match({product_name:'[Canon] GX6092',requested_software_kind:'firmware'});assert.equal(r.candidates.length,0);
});

function bundleRegistry(states){
 const v=fixtureVendor();v.name='ASUS';v.id='asus';v.aliases=['ASUS'];v.domains=['www.asus.com'];
 v.models=states.flatMap((state,i)=>state==='unknown'?[]:[{id:'synthetic-component-'+i,model:'MODEL'+(123+i),canonical_page:'https://www.asus.com/support/MODEL'+(123+i)+'/',status:'active',verified_at:'2026-10-29',provenance:['https://www.asus.com/faq/components'],support_mode:'exact',supported_models:['MODEL'+(123+i)],excluded_models:[],software_kind:'support',availability:state==='none'?'none':'available',evidence:state==='none'?[{relationship:'software-absence',scope:'support',source_url:'https://www.asus.com/faq/components',models:['MODEL'+(123+i)],match_text:['MODEL'+(123+i)+' requires no software'],observed_fact:'SYNTHETIC exact component and scope absence assertion',checked_at:'2026-10-29',unknowns:[]}]:[]}]);return fixtureRegistry(v);
}
for(const states of [['none','none'],['available','none'],['available','available'],['available','unknown'],['none','unknown']])test('bundle availability preserves '+states.join('/'),async()=>{
 const r=await createMatcher({registry:bundleRegistry(states)}).match({product_name:'[ASUS] MODEL123 + [ASUS] MODEL124'});
 assert.equal(r.component_results.length,2);assert.equal(r.approved,false);
 if(states.every(s=>s==='none')){assert.equal(r.candidates.length,0);assert.ok(r.reason_codes.includes('BUNDLE_NO_SOFTWARE_CONFIRMED'));}
 else if(states[0]==='available'&&states[1]==='none'){assert.equal(r.candidates.length,1);assert.equal(r.target_component,0);}
 else{assert.equal(r.candidates.length,0);assert.ok(r.reason_codes.includes('BUNDLE_TARGET_REQUIRED'));if(states.includes('available'))assert.ok(r.component_results[0].candidates.length>0);}
});
test('manual bundle component selection remains available',async()=>{
 const r=await createMatcher({registry:bundleRegistry(['available','unknown'])}).match({product_name:'[ASUS] MODEL123 + [ASUS] MODEL124',target_component:0});assert.equal(r.parsed.model,'MODEL123');assert.equal(r.candidates.length,1);
});
test('expired absence evidence cannot select a bundle target',async()=>{
 const registry=bundleRegistry(['available','none']);registry.vendors[0].models[1].verified_at='2020-01-01';
 const r=await createMatcher({registry}).match({product_name:'[ASUS] MODEL123 + [ASUS] MODEL124'});assert.equal(r.candidates.length,0);assert.equal(r.component_results[1].availability,'unknown');
});
test('official Gear Link support is exact-model scoped',async()=>{
 const r=await createMatcher().match({product_name:'[ASUS] HARPE MINI CORE 마우스'});assert.ok(r.candidates.some(c=>c.url==='https://gearlink.asus.com/'));
 assert.equal(r.candidates[0].software_scope,'web-app');
 const other=await createMatcher({fetcher:async u=>response(u,'<title>Gear Link</title><button>Connect device</button><p>web-based configuration tool</p>')}).match({product_name:'[ASUS] MODEL999 마우스',candidates:[{url:'https://gearlink.asus.com/'}]},{online:true});assert.equal(other.candidates.length,0);
});
test('standalone device category words are separated without losing wired edition',()=>{
 assert.equal(parseProductName('[ASUS] HARPE MINI CORE 마우스').model,'HARPE MINI CORE');
 assert.equal(parseProductName('[AULA] F87 Pro 유선 키보드').model,'F87 Pro 유선');
});
test('support records reject untrusted source domains and vacuous evidence',()=>{
 const v=sharedRegistry().vendors[0];v.ecosystems[0].evidence[0].source_url='https://unrelated.invalid/faq';assert.equal(validateRegistry([v]).valid,false);
 const w=sharedRegistry().vendors[0];w.ecosystems[0].evidence[0].match_text=[];assert.equal(validateRegistry([w]).valid,false);
});
test('shared support cannot validate another software package',async()=>{
 const registry=sharedRegistry();const url=registry.vendors[0].ecosystems[0].canonical_page;
 const r=await createMatcher({registry,fetcher:async u=>response(u,u.includes('/faq/')?'<p>Control Center Supported models: MODEL123</p>':'<title>OTHER SOFTWARE</title><a href="/download/other.exe">Download Other Software</a>')}).match({product_name:'[ASUS] MODEL123',candidates:[{url}]},{online:true});assert.equal(r.candidates.length,0);
});
test('support for a model does not borrow nearby denial of a different model',async()=>{
 const r=await run('<title>MODEL123 support</title><p>MODEL123 drivers are supported. MODEL999 is not supported.</p><a href="/download/MODEL123.exe">MODEL123 driver</a>');assert.equal(r.candidates.length,1);
});
test('per-kind file selection rejects firmware disguised under a driver header',async()=>{
 const r=await run('<title>MODEL123 support</title><p>MODEL123 drivers</p><a href="/download/MODEL123-bios.zip">Firmware BIOS download</a>',{requested_software_kind:'driver'});assert.equal(r.candidates.length,0);
});
test('ATK Korean hub keeps exact support and live embedded tool ahead of English execution URL',async()=>{
 const r=await createMatcher().match({product_name:'[ATK] VXE R1 SE+'});assert.ok(r.candidates.some(c=>c.url==='https://www.atk.store/ko-kr/pages/atk-hub'));
 const registry=sharedRegistry({web:true}),record=registry.vendors[0].ecosystems[0],hub='https://www.asus.com/ko-kr/software/hub/';
 record.customer_urls=[record.canonical_page];record.canonical_page=hub;record.page_role='software-hub';record.customer_priority=3;
 record.evidence[0].target_url=hub;record.evidence.push({relationship:'official-distribution',source_url:hub,target_url:hub,launch_url:'https://gearlink.asus.com/',models:['MODEL123'],match_text:['Gear Link'],observed_fact:'SYNTHETIC Korean hub embeds the official tool',checked_at:'2026-10-29',unknowns:[]});
 const m=createMatcher({registry,fetcher:async u=>response(u,u.includes('faq')?'<p>Gear Link Supported models: MODEL123</p>':u===hub?'<html lang="ko"><title>Gear Link</title><iframe src="https://gearlink.asus.com/"></iframe></html>':'<html lang="en"><title>Gear Link</title><p>web-based configuration tool</p><button>Connect device</button></html>')});
 const match=await m.match({product_name:'[ASUS] MODEL123',candidates:[{url:'https://gearlink.asus.com/'},{url:hub}]},{online:true});assert.equal(match.candidates[0].url,hub);assert.equal(match.candidates[0].verification.software_target,'linked-web-tool');
 const dongle=await createMatcher().match({product_name:'[ATK] UNKNOWN123 동글'});assert.equal(dongle.candidates.length,0);
});
test('Canon regional driver needs the complete current package chain',async()=>{
 const registry=loadRegistry(),record=registry.vendors.find(v=>v.id==='canon').models.find(r=>r.model==='GX6092');
 const fetcher=async u=>response(u,u===record.canonical_page?'<html lang="en"><title>MAXIFY GX6070 support</title><p>GX6070 MP Driver Ver.1.04</p><a href="/en/support/0101102418?model=MAXIFY+GX6070">GX6070 MP Driver Ver.1.04 (Windows)</a></html>':`<p>${record.evidence.filter(e=>e.source_url===u).flatMap(e=>e.match_text).join(' ')}</p><a>Download</a>`);
 const good=await createMatcher({registry,fetcher}).match({product_name:'[Canon] GX6092'},{online:true});assert.equal(good.candidates.length,1);assert.equal(good.candidates[0].audit_status,'live_verified');assert.ok(good.candidates[0].locale.exception_reason);
 for(const change of ['version','denied']){const bad=await createMatcher({registry,fetcher:async u=>{const p=await fetcher(u);if(u.includes('0101102418'))p.text=change==='version'?p.text.replaceAll('1.04','9.99'):p.text+'<p>MAXIFY GX6070 is not supported</p>';return p;}}).match({product_name:'[Canon] GX6092'},{online:true});assert.equal(bad.candidates.length,0);}
});
test('environment constraints never expand a shared package to unlisted OS or features',async()=>{
 const registry=sharedRegistry(),rec=registry.vendors[0].ecosystems[0];rec.evidence[0].package={os:['Windows 11'],architectures:['x64'],features:['print'],languages:['ko'],limitations:['FAX and PS3 are not confirmed']};
 const fetcher=async u=>response(u,u.includes('faq')?'<p>Control Center Supported models: MODEL123</p>':'<title>Control Center software</title><a href="/download/center.exe">Download Control Center</a>');
 for(const environment of [{os:'Linux'},{feature:'FAX'},{architecture:'arm64'}]){const r=await createMatcher({registry,fetcher}).match({product_name:'[ASUS] MODEL123',environment},{online:true});assert.equal(r.candidates.length,0);assert.ok(r.rejected_candidates[0].reason_codes.includes('ENVIRONMENT_CONFLICT'));}
 const r=await createMatcher({registry,fetcher}).match({product_name:'[ASUS] MODEL123',environment:{os:'Windows 11',architecture:'x64',feature:'print'}},{online:true});assert.equal(r.candidates.length,1);
});
test('Luna rejects invented, missing, duplicate IDs and any URL or approval field',()=>{
 const cs=[{id:'a',url:'https://www.asus.com/a'},{id:'b',url:'https://www.asus.com/b'}];
 for(const extra of [{ordered_ids:['new','b']},{ordered_ids:['a']},{ordered_ids:['a','a']},{url:'https://www.asus.com/new'},{approved:true}])assert.throws(()=>applyLunaRanking({ordered_ids:['a','b'],needs_review:false,reasons:[],...extra},cs),/INVALID_LUNA_RESPONSE/);
});
test('private CSV keeps original columns and editing state without implying approval',()=>{
 const raw='product_no,product_name,sw_download,status,reason,evidence_url,locale,verification_method,candidate_url,hsuf_decision,hsuf_reason,checked_at\nsynthetic-1,[ASUS] MODEL123,https://www.asus.com/old,변경,edited,https://www.asus.com/proof,ko,manual,https://www.asus.com/new,review,unknown,2026-10-20\n';
 const r=inspectReviewedCsv(raw),row=r.records[0];assert.equal(row.source_row.sw_download,'https://www.asus.com/old');assert.equal(row.source_row.candidate_url,'https://www.asus.com/new');assert.equal(row.source_row.reason,'edited');assert.equal(row.editing_status,'변경');assert.equal(r.counts.mapped,1);assert.equal(row.approved,false);assert.equal(row.verified_at,null);
});
test('common app download controls are valid with exact support evidence and no file URL',async()=>{
 const registry=sharedRegistry(),url=registry.vendors[0].ecosystems[0].canonical_page;
 const r=await createMatcher({registry,fetcher:async u=>response(u,u.includes('faq')?'<p>Control Center Supported models: MODEL123</p>':'<html lang="ko"><title>Control Center</title><p>Control Center software</p><button>Windows용 다운로드</button></html>')}).match({product_name:'[ASUS] MODEL123',candidates:[{url}]},{online:true});assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].verification.software_target,'download-control');
});
test('untagged manufacturer in a bundle is resolved without erasing the CPU identity',()=>{
 const p=parseProductName('[MSI] H810M-B + Intel Ultra 5 225F');assert.equal(p.components[1].manufacturer,'Intel');assert.equal(p.components[1].model,'Ultra 5 225F');
});
test('MCP exposes the same optional environment contract',async()=>{
 const {createMatcherMcpServer}=await import('../src/interfaces/mcp.mjs');const {Client,InMemoryTransport}=await import('@modelcontextprotocol/client');const server=createMatcherMcpServer(createMatcher());const client=new Client({name:'synthetic-environment',version:'1'});const [a,b]=InMemoryTransport.createLinkedPair();await Promise.all([server.connect(b),client.connect(a)]);
 try{const listed=await client.listTools();assert.ok(listed.tools.find(t=>t.name==='match_official_software_candidates').inputSchema.properties.environment);const r=await client.callTool({name:'match_official_software_candidates',arguments:{product_name:'[ASUS] MODEL123',environment:{os:'Linux'}}});assert.equal(r.isError,undefined);assert.equal(r.structuredContent.approved,false);}finally{await client.close();await server.close();}
});
test('web tool action markup is retained without executing a device connection',async()=>{
 const registry=sharedRegistry({web:true}),url=registry.vendors[0].ecosystems[0].canonical_page;
 const r=await createMatcher({registry,fetcher:async u=>response(u,u.includes('faq')?'<p>Gear Link Supported models: MODEL123</p>':'<title>Gear Link</title><p>web-based configuration tool</p><div class="_connectButton_a1"><span class="_connectButtonText_b2">Connect</span></div>')}).match({product_name:'[ASUS] MODEL123',candidates:[{url}]},{online:true});assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].verification.software_target,'web-tool');
});
test('fragment-only duplicates fetch one page and never fill five slots',async()=>{
 let calls=0;const url='https://www.asus.com/support/MODEL123/';const r=await createMatcher({fetcher:async u=>{calls++;return response(u,'<title>MODEL123 driver support</title><a href="/download/MODEL123.exe">MODEL123 driver download</a>');}}).match({product_name:'[ASUS] MODEL123',candidates:['#driver','#download','#software'].map(h=>({url:url+h}))},{online:true});assert.equal(calls,1);assert.equal(r.candidates.length,1);
});
test('firmware is available only when specifically requested with exact model evidence',async()=>{
 const r=await run('<title>MODEL123 support</title><p>MODEL123 BIOS firmware</p><a href="/download/MODEL123-bios.zip">MODEL123 BIOS firmware</a>',{requested_software_kind:'firmware'});assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].software_kind,'firmware');
 const registry=bundleRegistry(['available']);const mapped=await createMatcher({registry,fetcher:async u=>response(u,'<title>MODEL123 support</title><p>MODEL123 BIOS firmware</p><a href="/download/MODEL123-bios.zip">MODEL123 BIOS firmware</a>')}).match({product_name:'[ASUS] MODEL123',requested_software_kind:'firmware'},{online:true});assert.equal(mapped.candidates[0].software_kind,'firmware');
});
test('H810M-B bundle selects the MSI URL only under an explicit synthetic CPU absence condition',async()=>{
 const registry=loadRegistry(),v=registry.vendors.find(v=>v.id==='intel');v.models.push({id:'synthetic-intel-absence',model:'Ultra 5 225F',canonical_page:'https://www.intel.com/support/',status:'active',verified_at:'2026-10-29',provenance:['https://www.intel.com/support/'],support_mode:'exact',supported_models:['Ultra 5 225F'],excluded_models:[],software_kind:'support',availability:'none',evidence:[{relationship:'software-absence',scope:'support',source_url:'https://www.intel.com/support/',models:['Ultra 5 225F'],match_text:['SYNTHETIC exact absence condition'],observed_fact:'Test condition only, not an assertion about the real CPU',checked_at:'2026-10-29',unknowns:[]}]});
 const r=await createMatcher({registry}).match({product_name:'[MSI] H810M-B + Intel Ultra 5 225F'});assert.equal(r.target_component,0);assert.equal(r.candidates[0].url,'https://kr.msi.com/Motherboard/PRO-H810M-B/support#driver');
});
test('actual shared application kind stays distinct from a general driver request',async()=>{
 const r=await createMatcher().match({product_name:'[ASUS] DUAL 지포스 RTX 3050 O6G OC D6 6GB',requested_software_kind:'driver'});assert.equal(r.requested_software_kind,'driver');assert.equal(r.candidates[0].software_kind,'utility');assert.equal(r.candidates[0].software_scope,'gpu-family');
});
for(const text of ['MODEL123 모델은 지원하지 않습니다','MODEL123 is currently not supported','This software does not support MODEL123'])test('scoped denial: '+text,async()=>{const r=await run(`<title>MODEL123 support</title><p>${text}</p><a href="/download/MODEL123.exe">MODEL123 driver download</a>`);assert.equal(r.candidates.length,0);});
test('excluded and supported lists keep their own model scope',async()=>{
 const r=await run('<title>MODEL123 support</title><p>Excluded models: MODEL999 Supported models: MODEL123</p><a href="/download/MODEL123.exe">MODEL123 driver download</a>');assert.equal(r.candidates.length,1);
});
test('family search hints do not override exact model and requested software kind',async()=>{
 const r=await createMatcher().match({product_name:'[ASUS] DUAL 지포스 RTX 4060 O8G OC'});assert.equal(r.candidates.length,0);
 const f=await createMatcher().match({product_name:'[NVIDIA] RTX 3050',requested_software_kind:'firmware'});assert.equal(f.candidates.length,0);
});
test('a shared-app title does not authorize a differently named download',async()=>{
 const registry=sharedRegistry(),url=registry.vendors[0].ecosystems[0].canonical_page;
 const r=await createMatcher({registry,fetcher:async u=>response(u,u.includes('faq')?'<p>Control Center Supported models: MODEL123</p>':'<title>Control Center software</title><a href="/download/other.exe">Download Other Software</a>')}).match({product_name:'[ASUS] MODEL123',candidates:[{url}]},{online:true});assert.equal(r.candidates.length,0);
});
test('unrelated OS mentions do not satisfy the requested environment',async()=>{
 const html='<title>MODEL123 driver support</title><p>MODEL123 drivers</p><p>Supported Operating Systems: Windows 10</p><a href="/download/MODEL123.exe">MODEL123 driver download</a><footer>Read our Windows 11 news</footer>';
 const bad=await run(html,{environment:{os:'Windows 11'}});assert.equal(bad.candidates.length,0);
 const good=await run(html,{environment:{os:'Windows 10'}});assert.equal(good.candidates.length,1);
});
test('an unknown category does not erase color compatibility uncertainty',async()=>{
 const html='<title>MODEL123 driver support</title><p>MODEL123 drivers</p><a href="/download/MODEL123.exe">MODEL123 driver download</a>';
 const r=await run(html,{product_name:'[ASUS] MODEL123 블랙'});assert.equal(r.candidates.length,0);assert.ok(r.rejected_candidates[0].reason_codes.includes('VARIANT_SUPPORT_UNVERIFIED'));
 const confirmed=await run(html+'<p>지원 색상: 블랙</p>',{product_name:'[ASUS] MODEL123 블랙'});assert.equal(confirmed.candidates.length,1);
});
