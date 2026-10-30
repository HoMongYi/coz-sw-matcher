import {visibleModel,identityKey} from '../identity.mjs';
import {sameModel} from './model-identity.mjs';
import {urlFilter} from '../audit.mjs';
export const kindPattern={driver:/\bdrivers?\b|드라이버/iu,firmware:/firmware|\bBIOS\b|펌웨어/iu,'control-app':/software|control|configuration|설정|소프트웨어|iCUE|Gear Link|ATK HUB/iu,'web-driver':/web[- ]?(?:based|driver|app)|launcher|웹|Gear Link|Web Hub/iu,toolbox:/toolbox|toolkit|도구\s*상자/iu,utility:/utility|utilities|유틸리티|software|소프트웨어/iu,support:/drivers?|software|utilities|utility|설정|드라이버|소프트웨어|유틸리티|Gear Link|ATK HUB|iCUE/iu};
const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const samePage=(a,b)=>{try{const x=new URL(a),y=new URL(b);x.hash='';y.hash='';return x.href.replace(/\/$/u,'')===y.href.replace(/\/$/u,'');}catch{return false;}};
export const healthy=p=>!!p&&p.status===200&&!p.browser_required&&/^(text\/html|text\/plain|application\/xhtml\+xml)(?:;|$)/iu.test(p.content_type||'')&&!/attachment/iu.test(p.content_disposition||'');
export const officialEvidenceUrl=(url,domains)=>urlFilter(url,domains).reasons.every(r=>r==='WRONG_PAGE_TYPE');
export function explicitlyUnsupported(model,probe){
 if(!model||!probe)return false;
 const m=escaped(identityKey(model)),neg='(?:IS\\s+NOT\\s+SUPPORTED|NOT\\s+(?:SUPPORTED|COMPATIBLE)|UNSUPPORTED|미지원|지원하지\\s*(?:않|않음)|지원\\s*(?:불가|안\\s*함)|호환되지\\s*않|제외)';
 const after=new RegExp(`(?:^|[^\\p{L}\\p{N}])${m}(?=$|[^\\p{L}\\p{N}]|은|는|의|을|를)(?:은|는|의|을|를|\\s|[:：,(/-]){0,12}(?:(?:MODEL|DEVICE|모델|기기)(?:은|는|을|를)?\\s*)?(?:(?:IS|ARE)\\s+)?(?:CURRENTLY\\s+)?${neg}`,'iu');
 const before=new RegExp(`(?:EXCLUDED\\s+MODELS?|UNSUPPORTED\\s+MODELS?|미지원\\s*(?:모델|목록)|지원\\s*제외)[^.!?\\n]{0,100}(?:^|[^\\p{L}\\p{N}])${m}(?=$|[^\\p{L}\\p{N}])`,'iu');
 const preceding=new RegExp(`(?:DOES?\\s+NOT\\s+SUPPORT|NOT\\s+COMPATIBLE\\s+WITH)\\s+${m}(?=$|[^\\p{L}\\p{N}])`,'iu');
 const scopes=[probe.text,...(probe.sections||[])].flatMap(s=>identityKey(s||'').split(/(?=(?:EXCLUDED|UNSUPPORTED|SUPPORTED)\s+MODELS?\s*:|(?:지원|미지원)\s*모델\s*[:：])/iu));
 return scopes.some(s=>after.test(s)||before.test(s)||preceding.test(s));
}
export function applicableRecord(record,parsed,kind){
 return !!record&&!record.excluded_models?.some(m=>sameModel(m,parsed.model))&&(sameModel(record.model,parsed.model)||record.supported_models?.some(m=>sameModel(m,parsed.model)))&&(!record.software_kind||kind==='support'||record.software_kind==='support'||record.software_kind===kind||record.request_kinds?.includes(kind));
}
export function recordForUrl(registry,parsed,target,url){
 const vendor=registry.vendors.find(v=>v.id===target.vendor_id);
 return [...(vendor?.models||[]),...(vendor?.ecosystems||[])].find(r=>applicableRecord(r,parsed,target.software_kind)&&[r.canonical_page,...(r.customer_urls||[])].some(u=>samePage(u,url)));
}
export function inspectRelations(record,{parsed,target,probes=new Map(),candidateUrl}){
 const evidence=[],pending=[];
 if(!applicableRecord(record,parsed,target.software_kind))return {evidence,pending,confirmed:false};
 for(const relation of record.evidence||[]){
  if(!relation.models.some(m=>sameModel(m,parsed.model))||relation.target_url&&!samePage(relation.target_url,candidateUrl))continue;
  const probe=probes.get(relation.source_url);
  const matches=healthy(probe)&&officialEvidenceUrl(probe.url,target.domains)&&!(probe.redirects||[]).some(u=>!officialEvidenceUrl(u,target.domains))&&relation.match_text.length>0&&relation.match_text.every(t=>identityKey(probe.text).includes(identityKey(t)))&&![...relation.models,...(record.support_models||[])].some(m=>explicitlyUnsupported(m,probe));
  evidence.push({...relation,verification:matches?'live_observed':'recheck_required',verified_at:matches?probe.verified_at||null:null});if(!matches)pending.push(relation.source_url);
 }
 const software=evidence.filter(e=>['software-support','driver-support'].includes(e.relationship)),packages=software.map(e=>e.package).filter(Boolean);
 const packageMatch=packages.length>=2&&['file_name','version','published_at'].every(k=>packages[0][k]&&packages.every(p=>p[k]===packages[0][k]));
 const targetProbe=probes.get(candidateUrl);
 const identity=software.every(e=>!e.software_name||identityKey(targetProbe?.text||'').includes(identityKey(e.software_name)));
 const confirmed=software.length>0&&identity&&software.every(e=>e.verification==='live_observed')&&(record.support_mode!=='regional-driver'||evidence.some(e=>e.relationship==='common-manual'&&e.verification==='live_observed')&&packageMatch);
 return {evidence,pending,confirmed};
}
export function observedLocale(probe,record,evidence=[]){
 const language=probe?.language||null,korean=!!language&&/^ko(?:[-_]|$)/iu.test(language);
 const selection=(probe?.link_details||[]).some(l=>/^ko(?:[-_]|$)/iu.test(l.language||'')||/^한국어$/u.test(l.text))||(probe?.controls||[]).some(s=>/한국어/u.test(s));
 return {page_language:language,korean_available:healthy(probe)&&(korean||selection),verified:healthy(probe)&&!!(language||selection),region_hint:probe?.url&&/kr\.|\/kr\/ko\/|\/ko-kr\/|ko_KR/iu.test(probe.url)?'kr':null,software_languages:[...new Set(evidence.filter(e=>e.verification==='live_observed').flatMap(e=>e.package?.languages||[]))],exception_reason:record?.locale_exception||null};
}
export function confirmedAbsence(parsed,target,registry){
 const vendor=registry.vendors.find(v=>v.id===target.vendor_id),r=(vendor?.models||[]).find(r=>applicableRecord(r,parsed,target.software_kind)&&r.availability==='none');
 const fresh=date=>{const age=Date.now()-Date.parse(date);return Number.isFinite(age)&&age>=0&&age<=(r?.max_age_days||90)*86400000;};
 if(!r||r.status!=='active'||!fresh(r.verified_at))return null;
 const evidence=(r.evidence||[]).filter(e=>e.relationship==='software-absence'&&e.models.some(m=>sameModel(m,parsed.model))&&e.scope===target.software_kind&&fresh(e.checked_at));
 return evidence.length?{status:'none_confirmed',evidence,scope:target.software_kind}:null;
}
export const relevantKind=(text,kind)=>!!kindPattern[kind]?.test(text||'');
export const modelSeen=(model,p)=>visibleModel(model,`${p?.title||''} ${p?.text||''}`);
