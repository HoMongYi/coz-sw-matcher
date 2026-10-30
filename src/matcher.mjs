import crypto from 'node:crypto';
import {loadRegistry} from './registry.mjs';
import {parseProductName} from './parser/compuzone-name-parser.mjs';
import {resolveSoftwareTarget} from './matching/software-target-resolver.mjs';
import {sameModel} from './matching/model-identity.mjs';
import {safeRequest,pageEvidence} from './network.mjs';
import {urlFilter} from './audit.mjs';
import {auditOfficialPage} from './audit/official-page-audit.mjs';
import {rankCandidates,applyLunaRanking} from './ranking/candidate-ranker.mjs';
import {approvalContract} from './approvals/approval-contract.mjs';
import {recordForUrl,applicableRecord,officialEvidenceUrl,confirmedAbsence} from './matching/support-evidence.mjs';

export async function boundedCall(fn,timeoutMs){
 const controller=new AbortController();let timer;
 try{return await Promise.race([Promise.resolve().then(()=>fn(controller.signal)),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('PROVIDER_TIMEOUT'));},timeoutMs);})]);}finally{clearTimeout(timer);}
}
function checkCandidates(candidates,max=5){
 if(!Array.isArray(candidates)||candidates.length>max)throw new Error('CANDIDATE_LIMIT');
 return candidates.map(c=>{if(!c||typeof c.url!=='string'||c.url.length>4096||c.title!=null&&(typeof c.title!=='string'||c.title.length>1000)||c.snippet!=null&&(typeof c.snippet!=='string'||c.snippet.length>4000))throw new Error('INVALID_CANDIDATE');return {url:c.url,title:c.title||'',snippet:c.snippet||''};});
}
function registryCandidates(parsed,target,overlay,registry,productNo){
 const variantsMatch=r=>['color','switch','capacity','graphics_memory'].every(k=>!parsed.variants[k]&&!r.variants?.[k]||parsed.variants[k]===r.variants?.[k]);
 const records=(overlay?.records||[]).filter(r=>r.source==='manual_verified_csv'&&r.manufacturer===parsed.manufacturer&&sameModel(r.model,parsed.model)&&variantsMatch(r)&&(!productNo||!r.product_no||r.product_no===productNo)&&(!r.software_kind||r.software_kind==='support'||r.software_kind===target.software_kind));
 const vendor=registry.vendors.find(v=>v.id===target.vendor_id);
 for(const r of [...(vendor?.models||[]),...(vendor?.ecosystems||[])])if(applicableRecord(r,parsed,target.software_kind)&&r.availability!=='none')records.push({...r,url:r.canonical_page,source:'public_registry'});
 // Family rules can suggest a historical hub, never certify current support.
 if(vendor){
  const model=parsed.model||'';for(const rule of vendor.rules||[]){const w=rule.when||{};const match=ps=>(ps||[]).some(p=>new RegExp(p,'iu').test(model));
   if(rule.ecosystem_id&&match(w.name_any)&&!match(w.name_none)){const r=vendor.ecosystems.find(e=>e.id===rule.ecosystem_id);if(r)records.push({...r,url:r.canonical_page,source:'public_registry'});}
  }
 }
 return records.map(record=>({url:record.url,title:parsed.model,snippet:'Historical mapping',record}));
}
export function createMatcher({registry=loadRegistry(),overlay,search,ranker,fetcher=safeRequest,providerTimeoutMs=12000,maxDurationMs=30000,minIntervalMs=0}={}){
 if(!Number.isInteger(providerTimeoutMs)||providerTimeoutMs<1||providerTimeoutMs>12000||!Number.isInteger(maxDurationMs)||maxDurationMs<1||maxDurationMs>60000||!Number.isInteger(minIntervalMs)||minIntervalMs<0||minIntervalMs>5000)throw new Error('INVALID_LIMITS');
 let running=false,lastRequest=0;
 return {registry,
  async match(input,options={}){
   if(!input||Object.keys(input).some(k=>!['product_no','product_name','requested_software_kind','candidates','target_component','environment'].includes(k))||input.product_no!=null&&(typeof input.product_no!=='string'||input.product_no.length>200))throw new Error('INVALID_MATCH_INPUT');
   if(input.environment!=null&&(!input.environment||typeof input.environment!=='object'||Array.isArray(input.environment)||Object.entries(input.environment).some(([k,v])=>!['os','architecture','feature'].includes(k)||typeof v!=='string'||!v.trim()||v.length>100)))throw new Error('INVALID_ENVIRONMENT');
   const hasExternal=Object.hasOwn(input,'candidates');const external=hasExternal?checkCandidates(input.candidates):null;
   const started=performance.now(),deadline=Date.now()+maxDurationMs;
   let parsed=parseProductName(input,{vendors:registry.vendors});const bundle=parsed.category==='bundle'?parsed:null;
   if(input.target_component!=null){if(!bundle||!Number.isInteger(input.target_component)||!bundle.components[input.target_component])throw new Error('INVALID_TARGET_COMPONENT');parsed=bundle.components[input.target_component];}
   const target=resolveSoftwareTarget(parsed,input.requested_software_kind||'support',registry);
   target.environment=input.environment||null;
   const result={request_id:crypto.randomUUID(),product_no:input.product_no??null,product_name:input.product_name,parsed,bundle,requested_software_kind:target.software_kind,software_provider:target.software_provider,status:'needs_review',approved:false,candidates:[],rejected_candidates:[],reason_codes:[...parsed.warnings],approval_contract:approvalContract,metrics:{search_calls:0,page_fetches:0,evidence_fetches:0,luna_calls:0,duration_ms:0,cost_usd:0,usage:null}};
   const finish=()=>{result.metrics.duration_ms=performance.now()-started;if(!result.candidates.length)result.reason_codes.push('NO_AUDITABLE_CANDIDATE');result.reason_codes=[...new Set(result.reason_codes)];return result;};
   if(bundle&&input.target_component==null){
    if(running){result.reason_codes.push('MATCHER_BUSY');return finish();}
    if(bundle.components.length>4){result.reason_codes.push('BUNDLE_COMPONENT_LIMIT');return finish();}
    running=true;
    try{
     result.component_results=[];const cache=new Map();let pageFetches=0,evidenceFetches=0,searches=0;
     const boundedFetcher=async(url,settings)=>{
      if(cache.has(url))return cache.get(url);
      const evidence=settings.purpose==='evidence';
      if((evidence?evidenceFetches>=8:pageFetches>=5)||Date.now()>=deadline)throw new Error('BUNDLE_FETCH_LIMIT');
      if(evidence)evidenceFetches++;else pageFetches++;
      const wait=Math.max(0,minIntervalMs-(Date.now()-lastRequest));if(wait)await new Promise(r=>setTimeout(r,Math.min(wait,Math.max(0,deadline-Date.now()))));lastRequest=Date.now();
      if(settings.signal?.aborted||Date.now()>=deadline)throw new Error('BUNDLE_DEADLINE');
      const work=fetcher(url,{...settings,timeoutMs:Math.max(1,Math.min(settings.timeoutMs,deadline-Date.now()))});cache.set(url,work);return work;
     };
     const boundedSearch=search?{search:args=>{if(searches++>=1||Date.now()>=deadline)throw new Error('BUNDLE_SEARCH_LIMIT');return search.search(args);}}:null;
     for(const [index,component] of bundle.components.entries()){
      const childTarget=resolveSoftwareTarget(component,input.requested_software_kind||'support',registry);
      const absent=confirmedAbsence(component,childTarget,registry);
      if(absent){result.component_results.push({index,parsed:component,availability:'none_confirmed',candidates:[],evidence:absent.evidence,approved:false});continue;}
      const child=await createMatcher({registry,overlay,search:boundedSearch,fetcher:boundedFetcher,providerTimeoutMs,maxDurationMs:Math.max(1,deadline-Date.now()),minIntervalMs:0}).match({...input,product_name:component.raw_product_name},{...options});
      result.component_results.push({index,parsed:child.parsed,availability:child.candidates.length?'available':'unknown',candidates:child.candidates,rejected_candidates:child.rejected_candidates,reason_codes:child.reason_codes,status:child.status,approved:false});
      for(const k of ['search_calls','page_fetches','evidence_fetches'])result.metrics[k]+=child.metrics[k]||0;
      if(child.metrics.cost_usd===null)result.metrics.cost_usd=null;
     }
     const available=result.component_results.filter(c=>c.availability==='available');
     if(available.length===1&&result.component_results.every(c=>c===available[0]||c.availability==='none_confirmed')){
      const selected=available[0];result.target_component=selected.index;result.parsed=selected.parsed;result.candidates=selected.candidates;result.software_provider=selected.candidates[0]?.software_provider||null;result.status=selected.status;result.reason_codes=selected.reason_codes.filter(r=>r!=='NO_AUDITABLE_CANDIDATE');
     }else if(result.component_results.every(c=>c.availability==='none_confirmed'))result.reason_codes=['BUNDLE_NO_SOFTWARE_CONFIRMED'];
     else result.reason_codes.push(available.length>1?'BUNDLE_MULTIPLE_SOFTWARE_TARGETS':'BUNDLE_COMPONENT_UNCONFIRMED');
     result.metrics.page_fetches=pageFetches;result.metrics.evidence_fetches=evidenceFetches;result.metrics.search_calls=Math.min(searches,1);
     return finish();
    }finally{running=false;}
   }
   const absent=confirmedAbsence(parsed,target,registry);if(absent){result.availability=absent;result.reason_codes.push('NO_SOFTWARE_CONFIRMED');return finish();}
   if(parsed.ambiguous||target.requires_review)return finish();
   if(running){result.reason_codes.push('MATCHER_BUSY');return finish();}running=true;
    const timed=fn=>boundedCall(fn,Math.max(1,Math.min(providerTimeoutMs,deadline-Date.now())));
   try{
    let pool=hasExternal?external:registryCandidates(parsed,target,overlay,registry,input.product_no);
    if(!hasExternal&&options.online&&search){
     try{result.metrics.search_calls++;result.metrics.cost_usd=null;const response=await timed(signal=>search.search({signal,product:{manufacturer:parsed.manufacturer,model:parsed.model,category:parsed.category},query:`${target.software_provider} ${parsed.model} ${target.software_kind} downloads ${target.domains.slice(0,3).map(d=>'site:'+d).join(' OR ')}`,limit:5}));pool.push(...checkCandidates(response?.candidates,20));}
     catch{result.reason_codes.push('SEARCH_PROVIDER_FAILURE');}
    }
    const unique=new Map();
    for(const c of pool){const u=urlFilter(c.url,target.domains);let key=u.url||c.url;if(u.url){const identity=new URL(u.url);identity.hash='';key=identity.href;}if(!unique.has(key))unique.set(key,{...c,url:u.url||c.url,filtered:u});}
    let counter=0;const evidenceProbes=new Map();
    const getProbe=async(url,purpose)=>{
     if(evidenceProbes.has(url))return evidenceProbes.get(url);
     const metric=purpose==='evidence'?'evidence_fetches':'page_fetches',limit=purpose==='evidence'?8:5;
     if(result.metrics[metric]>=limit||Date.now()>=deadline)return null;
     const wait=Math.max(0,minIntervalMs-(Date.now()-lastRequest));if(wait)await new Promise(r=>setTimeout(r,Math.min(wait,Math.max(0,deadline-Date.now()))));
     if(Date.now()>=deadline)return null;
     lastRequest=Date.now();result.metrics[metric]++;
     try{const response=await timed(signal=>fetcher(url,{signal,purpose,allowedDomains:target.domains,timeoutMs:Math.max(1,Math.min(12000,deadline-Date.now())),maxBytes:1_048_576,maxRedirects:4}));const probe=pageEvidence({...response,verified_at:response.verified_at||new Date().toISOString().slice(0,10)});evidenceProbes.set(url,probe);return probe;}
     catch(e){evidenceProbes.set(url,null);throw e;}
    };
    for(const c of [...unique.values()].slice(0,20)){
     const id='c'+(++counter);let probe;
     c.record||=recordForUrl(registry,parsed,target,c.url);
     if(options.online&&c.filtered.ok&&result.metrics.page_fetches<5&&Date.now()<deadline){
      try{
       probe=await getProbe(c.url,'candidate');
      }catch{result.rejected_candidates.push({id,url:c.url,reason_codes:['PAGE_FETCH_FAILED'],audit_status:'review',page_type:'unknown'});continue;}
     }
     if(probe)evidenceProbes.set(c.url,probe);
     for(const evidenceUrl of (options.online&&probe?c.record?.evidence||[]:[]).flatMap(r=>[r.source_url,r.launch_url]).filter(Boolean)){
      if(!officialEvidenceUrl(evidenceUrl,target.domains))continue;
      try{await getProbe(evidenceUrl,'evidence');}catch{result.reason_codes.push('SUPPORT_EVIDENCE_FETCH_FAILED');}
     }
     const audit=auditOfficialPage(c,{parsed,target,probe,record:c.record,evidenceProbes});
     const actualKind=c.record?.software_kind&&c.record.software_kind!=='support'?c.record.software_kind:target.software_kind;
     const software_scope=actualKind==='firmware'?'firmware':c.record?.support_mode==='regional-driver'?'regional-driver':target.ecosystem&&parsed.category==='gpu'?'gpu-family':actualKind==='web-driver'||audit.page_type==='web-app'?'web-app':c.record?.support_mode==='explicit-model-list'?'shared-app':'model-specific';
     const item={id,...audit,software_provider:target.software_provider,software_kind:actualKind,software_scope,title:c.title,approved:false,reason_codes:audit.reason_codes};
     delete item.eligible;
     if(audit.eligible)result.candidates.push(item);else result.rejected_candidates.push(item);
    }
    result.candidates=rankCandidates(result.candidates);
    if(options.online&&ranker&&result.candidates.length){
     try{result.metrics.luna_calls++;const value=await timed(signal=>ranker.rank({signal,product:{manufacturer:parsed.manufacturer,model:parsed.model,category:parsed.category,software_kind:target.software_kind},candidates:result.candidates}));result.candidates=applyLunaRanking(value,result.candidates);result.metrics.usage=value.usage||null;result.metrics.cost_usd=result.metrics.search_calls?null:value.usage?.cost_usd??null;if(value.needs_review)result.reason_codes.push('LUNA_REVIEW_REQUIRED');result.ranking_reasons=value.reasons;}
     catch{result.reason_codes.push('LUNA_PROVIDER_FAILURE');result.metrics.cost_usd=null;}
    }
    if(result.candidates.length&&result.candidates.every(c=>c.audit_status==='live_verified')&&!result.reason_codes.length)result.status='needs_human_approval';
    else if(result.candidates.length)result.reason_codes.push('RECHECK_OR_REVIEW_REQUIRED');
    return finish();
   }finally{running=false;}
  }
 };
}
