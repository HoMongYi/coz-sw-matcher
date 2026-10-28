import {urlFilter} from '../audit.mjs';
import {visibleModel,variantConflict,discriminators} from '../identity.mjs';

const KIND_EVIDENCE={driver:/\bdrivers?\b|드라이버/iu,firmware:/firmware|\bBIOS\b|펌웨어/iu,'control-app':/software|control|configuration|설정\s*(?:프로그램|앱)|소프트웨어/iu,'web-driver':/web\s*driver|launcher|웹드라이버|웹\s*설정/iu,toolbox:/toolbox|toolkit|도구\s*상자/iu,utility:/utility|utilities|유틸리티/iu};

export function pagePurpose(url,probe){
 let path;try{path=new URL(url).pathname;}catch{return 'unknown';}
 const text=(probe?.title||'')+' '+(probe?.text||'');
 if(/\/(?:cart|checkout|shop)(?:\/|$)/iu.test(path))return 'sales';
 const supportPath=/support|downloads?|drivers?|software|firmware|helpdesk|atk-hub|launcher/iu.test(path);
 const softwareText=/drivers?|firmware|software|utilities|utility|다운로드|드라이버|펌웨어|소프트웨어/iu.test(text);
 const downloadLink=(probe?.links||[]).some(link=>/download|drivers?|firmware|launcher|\.exe(?:$|\?)|\.zip(?:$|\?)/iu.test(link));
 if(supportPath&&softwareText&&downloadLink)return /software|atk-hub|launcher/iu.test(path)?'software-download':'support-with-downloads';
 if(/products?|overview|specification/iu.test(path)||/buy now|add to cart|구매하기/iu.test(text))return 'product-description';
 return 'unknown';
}
export function auditOfficialPage(candidate,{parsed,target,probe,record}={}){
 const filtered=urlFilter(candidate.url,target.domains);
 const reason_codes=[...filtered.reasons];let page_type=pagePurpose(candidate.url,probe),verified_at=null;
 let audit_status='review';
 if(probe){
  if(probe.status!==200||probe.browser_required)reason_codes.push(probe.browser_required?'BROWSER_REQUIRED':'PAGE_FETCH_FAILED');
  if(!/^(text\/html|text\/plain|application\/xhtml\+xml)(?:;|$)/iu.test(probe.content_type||'')||/attachment/iu.test(probe.content_disposition||''))reason_codes.push('NON_PAGE_RESPONSE');
  for(const url of [probe.url,...(probe.redirects||[])])reason_codes.push(...urlFilter(url,target.domains).reasons.map(r=>'REDIRECT_'+r));
  const visible=visibleModel(parsed.model,`${probe.title} ${probe.text}`);
  if(!visible)reason_codes.push('EXACT_MODEL_UNVERIFIED');
  if(variantConflict(parsed.model,probe.title).length)reason_codes.push('WRONG_REVISION');
  const wanted=discriminators(parsed.model),seen=discriminators(probe.title);
  if(Object.keys(seen).some(k=>['revision','memory','wifi','suffix'].includes(k)&&seen[k]!==wanted[k]))reason_codes.push('WRONG_REVISION');
  for(const suffix of ['SE+','HE','OC'])if(new RegExp(`\\b${suffix.replace('+','\\+')}(?=$|\\W)`,'iu').test(probe.title)&&!parsed.model.toUpperCase().includes(suffix))reason_codes.push('WRONG_REVISION');
  if(target.software_kind!=='support'&&!KIND_EVIDENCE[target.software_kind]?.test(`${probe.title} ${probe.text}`))reason_codes.push('SOFTWARE_KIND_UNVERIFIED');
  if(!['software-download','support-with-downloads'].includes(page_type))reason_codes.push('NO_DOWNLOAD_EVIDENCE');
  if(/no longer supported|software is retired|discontinued software/iu.test(probe.text))reason_codes.push('LIFECYCLE_UNCERTAIN');
  if(!reason_codes.length){audit_status='live_verified';verified_at=probe.verified_at||null;}
 }else if(record){
  if(['retired','replaced','deprecated'].includes(record.status))reason_codes.push('LIFECYCLE_'+record.status.toUpperCase());
  // Dataset verification is historical, never today's live page verification.
  if(page_type==='product-description'||page_type==='sales')reason_codes.push('NO_DOWNLOAD_EVIDENCE');
  audit_status=record.source==='manual_verified_csv'?'verified_from_dataset_recheck_required':'registry_recheck_required';
 }else reason_codes.push('INDEPENDENT_PAGE_REQUIRED');
 return {eligible:reason_codes.length===0,url:filtered.url||candidate.url,page_type,audit_status,verified_at,reason_codes:[...new Set(reason_codes)],
  evidence_url:probe?.url||record?.evidence_url||null,evidence:probe?'Independent page inspection':record?'Historical registry mapping; live recheck required':'No independent page evidence',
  dataset_checked_at:record?.dataset_checked_at||null};
}
