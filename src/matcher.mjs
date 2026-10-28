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
 for(const r of vendor?.models||[])if(sameModel(r.model,parsed.model)&&!r.excluded_models?.some(m=>sameModel(m,parsed.model)))records.push({...r,url:r.canonical_page,source:'public_registry'});
 for(const r of vendor?.ecosystems||[])if(r.supported_models?.some(m=>sameModel(m,parsed.model))&&!r.excluded_models?.some(m=>sameModel(m,parsed.model))&&(target.software_kind==='support'||r.software_kind===target.software_kind))records.push({...r,url:r.canonical_page,source:'public_registry'});
 // Family rules can suggest a historical hub, never certify current support.
 if(target.ecosystem&&vendor){
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
   if(!input||Object.keys(input).some(k=>!['product_no','product_name','requested_software_kind','candidates','target_component'].includes(k))||input.product_no!=null&&(typeof input.product_no!=='string'||input.product_no.length>200))throw new Error('INVALID_MATCH_INPUT');
   const hasExternal=Object.hasOwn(input,'candidates');const external=hasExternal?checkCandidates(input.candidates):null;
   const started=performance.now(),deadline=Date.now()+maxDurationMs;
   let parsed=parseProductName(input,{vendors:registry.vendors});const bundle=parsed.category==='bundle'?parsed:null;
   if(input.target_component!=null){if(!bundle||!Number.isInteger(input.target_component)||!bundle.components[input.target_component])throw new Error('INVALID_TARGET_COMPONENT');parsed=bundle.components[input.target_component];}
   const target=resolveSoftwareTarget(parsed,input.requested_software_kind||'support',registry);
   const result={request_id:crypto.randomUUID(),product_no:input.product_no??null,product_name:input.product_name,parsed,bundle,requested_software_kind:target.software_kind,software_provider:target.software_provider,status:'needs_review',approved:false,candidates:[],rejected_candidates:[],reason_codes:[...parsed.warnings],approval_contract:approvalContract,metrics:{search_calls:0,page_fetches:0,luna_calls:0,duration_ms:0,cost_usd:0,usage:null}};
   const finish=()=>{result.metrics.duration_ms=performance.now()-started;if(!result.candidates.length)result.reason_codes.push('NO_AUDITABLE_CANDIDATE');result.reason_codes=[...new Set(result.reason_codes)];return result;};
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
    for(const c of pool){const u=urlFilter(c.url,target.domains);const key=u.url||c.url;if(!unique.has(key))unique.set(key,{...c,url:key,filtered:u});}
    let counter=0;
    for(const c of [...unique.values()].slice(0,20)){
     const id='c'+(++counter);let probe;
     if(options.online&&c.filtered.ok&&result.metrics.page_fetches<5&&Date.now()<deadline){
      try{
       const wait=Math.max(0,minIntervalMs-(Date.now()-lastRequest));if(wait)await new Promise(r=>setTimeout(r,Math.min(wait,Math.max(0,deadline-Date.now()))));lastRequest=Date.now();result.metrics.page_fetches++;
       const response=await timed(signal=>fetcher(c.url,{signal,timeoutMs:Math.max(1,Math.min(12000,deadline-Date.now())),maxBytes:1_048_576,maxRedirects:4}));probe=pageEvidence(response);
      }catch{result.rejected_candidates.push({id,url:c.url,reason_codes:['PAGE_FETCH_FAILED'],audit_status:'review',page_type:'unknown'});continue;}
     }
     const audit=auditOfficialPage(c,{parsed,target,probe,record:c.record});
     const item={id,...audit,software_provider:target.software_provider,software_kind:target.software_kind,title:c.title,approved:false,reason_codes:audit.reason_codes};
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
