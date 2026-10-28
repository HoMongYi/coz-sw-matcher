import crypto from 'node:crypto';
import {modelFamily} from '../matching/model-identity.mjs';
import {stripTracking} from '../network.mjs';
import {applyLunaRanking} from '../ranking/candidate-ranker.mjs';
import {boundedCall} from '../matcher.mjs';
const urlKey=url=>{try{return stripTracking(url).replace(/\/$/u,'');}catch{return url;}};
export function splitWithoutLeakage(records){
 const parents=records.map((_,i)=>i),seen=new Map();
 const keysFor=r=>[r.url&&'url:'+urlKey(r.url),r.model&&'family:'+modelFamily(r),r.ecosystem&&'ecosystem:'+r.ecosystem].filter(Boolean);
 const root=i=>parents[i]===i?i:(parents[i]=root(parents[i]));
 records.forEach((r,i)=>{
  const keys=keysFor(r);
  for(const k of keys){if(seen.has(k))parents[root(i)]=root(seen.get(k));else seen.set(k,i);}
 });
 const groups=new Map();records.forEach((r,i)=>{const id=root(i);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(r);});
 const sorted=[...groups.values()].sort((a,b)=>crypto.createHash('sha256').update(JSON.stringify(a.map(r=>r.url).sort())).digest('hex').localeCompare(crypto.createHash('sha256').update(JSON.stringify(b.map(r=>r.url).sort())).digest('hex')));
 const cut=sorted.length<2?0:Math.max(1,Math.min(sorted.length-1,Math.floor(sorted.length*.8)));
 const train=sorted.slice(0,cut).flat(),test=sorted.slice(cut).flat(),trainKeys=new Set(train.flatMap(keysFor)),testKeys=new Set(test.flatMap(keysFor));
 return {train,test,groups:groups.size,leakage_count:[...trainKeys].filter(k=>testKeys.has(k)).length,policy:'connected URL + variant-independent model family + explicit ecosystem; groups are indivisible'};
}
function metrics(cases){
 const labelled=cases.filter(c=>c.gold_url),withCandidates=labelled.filter(c=>c.candidates.length);
 const top5=labelled.filter(c=>c.candidates.some(v=>urlKey(v.url)===urlKey(c.gold_url))).length;
 const top1=labelled.filter(c=>urlKey(c.candidates[0]?.url)===urlKey(c.gold_url)).length;
 const hasModelLabels=withCandidates.filter(c=>typeof c.wrong_model==='boolean');
 return {labelled:labelled.length,top5_inclusion_rate:labelled.length?top5/labelled.length:null,top1_url_agreement_rate:labelled.length?top1/labelled.length:null,first_choice_approval_rate:null,wrong_model_rate:hasModelLabels.length?hasModelLabels.filter(c=>c.wrong_model).length/hasModelLabels.length:null,review_rate:cases.length?cases.filter(c=>['needs_review','needs_human_approval'].includes(c.status)).length/cases.length:null,abstention_rate:cases.length?cases.filter(c=>c.status==='needs_review').length/cases.length:null,mean_review_time_ms:null};
}
export async function evaluateCases(cases,{ranker}={}){
 const result={baseline:{status:'Passed',...metrics(cases)},luna:{status:'Not run',reason:'No configured model or independently captured candidate snapshots'},unlabelled:cases.filter(c=>!c.gold_url).length,limitations:['Top-1 URL agreement is not human approval rate.','Missing model labels and review times remain null.']};
 if(!ranker)return result;
 const ranked=[];let cost=0,unknownCost=false,calls=0,failures=0;const start=performance.now();
 for(const c of cases){
  if(!c.candidates.length){ranked.push(c);continue;}
  try{calls++;const response=await boundedCall(signal=>ranker.rank({signal,product:c.product,candidates:c.candidates}),12000);ranked.push({...c,candidates:applyLunaRanking(response,c.candidates),status:response.needs_review?'needs_review':c.status});if(response.usage?.cost_usd==null)unknownCost=true;else cost+=response.usage.cost_usd;}
  catch{failures++;unknownCost=true;ranked.push({...c,status:'needs_review'});}
 }
 result.luna={status:failures?'Failed':calls?'Passed':'Not run',...metrics(ranked),calls,failures,duration_ms:performance.now()-start,cost_usd:unknownCost?null:cost};return result;
}
