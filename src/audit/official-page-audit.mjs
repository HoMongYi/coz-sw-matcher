import {urlFilter} from '../audit.mjs';
import {visibleModel,variantConflict,discriminators} from '../identity.mjs';
import {healthy,explicitlyUnsupported,inspectRelations,observedLocale,relevantKind,modelSeen,samePage,applicableRecord} from '../matching/support-evidence.mjs';

const file=/\.(?:exe|msi|zip|dmg|pkg|deb|rpm|tar\.gz)(?:$|[?#])/iu;
const firmware=/firmware|\bBIOS\b|펌웨어/iu;
const decoded=s=>{try{return decodeURIComponent(s);}catch{return s;}};
function linksFor(probe,kind){
 return (probe?.link_details||(probe?.links||[]).map(url=>({url,text:''}))).filter(l=>{
  if(!/^https?:/iu.test(l.url))return false;
  const text=l.text+' '+decoded(l.url).replace(/[_-]/gu,' ');
  if(kind!=='firmware'&&firmware.test(text)&&!relevantKind(l.text,kind))return false;
  // A navigation link labelled downloads alone is not a software payload.
  return file.test(l.url)||/\/download\.php\?/iu.test(l.url)||/download|다운로드/iu.test(l.text)&&relevantKind(l.text,kind);
 });
}
function webControls(probe){return (probe?.controls||[]).some(t=>/connect|pair|configure|연결|설정\s*시작/iu.test(t))&&/web[- ]?based|configuration|configur|customiz|웹|설정|Gear Link/iu.test(probe?.text||'');}
export function pagePurpose(url,probe,{kind='support',record}={}){
 let path;try{path=new URL(url).pathname;}catch{return 'unknown';}
 const text=(probe?.title||'')+' '+(probe?.text||'');
 if(/\/(?:cart|checkout|shop)(?:\/|$)/iu.test(path))return 'sales';
 if(webControls(probe))return 'web-app';
 if((probe?.controls||[]).some(t=>/download|다운로드/iu.test(t))&&record?.page_role==='software-hub')return 'software-download';
 if(record?.page_role==='software-hub'&&(probe?.embeds?.length||probe?.links?.length))return 'software-hub';
 const downloads=linksFor(probe,kind);
 if(downloads.length&&relevantKind(text,kind))return /software|atk-hub|launcher|hub|board\.php/iu.test(path)?'software-download':'support-with-downloads';
 if(record?.page_role==='model-hub'&&modelSeen(record.model,probe)&&/매뉴얼\s*&?\s*다운로드|manuals?\s*(?:and|&)\s*downloads?/iu.test(text))return 'support-with-downloads';
 if(/products?|overview|specification/iu.test(path)||/buy now|add to cart|구매하기/iu.test(text))return 'product-description';
 return 'unknown';
}
export function auditOfficialPage(candidate,{parsed,target,probe,record,evidenceProbes=new Map()}={}){
 const filtered=urlFilter(candidate.url,target.domains),reason_codes=[...filtered.reasons];
 let page_type=pagePurpose(candidate.url,probe,{kind:target.software_kind,record});
 let verified_at=null,audit_status='review';
 const relations=inspectRelations(record,{parsed,target,probes:evidenceProbes,candidateUrl:candidate.url});
 const support_evidence=[...relations.evidence];
 const verification={access:'not_checked',model_support:'unconfirmed',software_target:'unconfirmed'};
 if(probe){
  verification.access=healthy(probe)?'reachable':probe.browser_required?'browser_required':'failed';
  if(probe.status!==200||probe.browser_required)reason_codes.push(probe.browser_required?'BROWSER_REQUIRED':'PAGE_FETCH_FAILED');
  if(!healthy(probe)&&probe.status===200&&!probe.browser_required)reason_codes.push('NON_PAGE_RESPONSE');
  for(const url of [probe.url,...(probe.redirects||[])])reason_codes.push(...urlFilter(url,target.domains).reasons.map(r=>'REDIRECT_'+r));
  const negative=[parsed.model,...(record?.support_models||[])].some(m=>explicitlyUnsupported(m,probe));
  if(negative)reason_codes.push('MODEL_EXPLICITLY_UNSUPPORTED');
  const packages=support_evidence.filter(e=>e.verification==='live_observed').map(e=>e.package).filter(Boolean);
  for(const [key,value] of Object.entries(target.environment||{})){
   const values=packages.flatMap(p=>p[{os:'os',architecture:'architectures',feature:'features'}[key]]||[]);
   if(values.length&&!values.some(v=>v.toUpperCase()===value.toUpperCase()))reason_codes.push('ENVIRONMENT_CONFLICT');
   else if(!values.length){
    const label={os:/operating systems?|supported OS|지원\s*OS|운영체제/iu,architecture:/architecture|아키텍처|지원\s*비트/iu,feature:/supported features?|지원\s*기능/iu}[key];
    if(!(probe.sections||[]).some(s=>label.test(s)&&visibleModel(value,s)&&!explicitlyUnsupported(value,{text:s})))reason_codes.push('ENVIRONMENT_UNVERIFIED');
   }
  }
  const visible=modelSeen(parsed.model,probe),wanted=discriminators(parsed.model),seen=discriminators(probe.title);
  if((variantConflict(parsed.model,probe.title).length||Object.keys(seen).some(k=>['revision','memory','wifi','suffix'].includes(k)&&seen[k]!==wanted[k]))&&!relations.confirmed)reason_codes.push('WRONG_REVISION');
  for(const suffix of ['SE+','HE','OC'])if(new RegExp(`\\b${suffix.replace('+','\\+')}(?=$|\\W)`,'iu').test(probe.title)&&!parsed.model.toUpperCase().includes(suffix))reason_codes.push('WRONG_REVISION');
  const downloads=linksFor(probe,target.software_kind).filter(l=>!urlFilter(l.url,[...target.domains,...(record?.download_domains||[])]).reasons.filter(r=>r!=='DIRECT_FILE').length);
  const wrongLink=l=>{
   const hints=(l.text+' '+decoded(l.url)).match(/\b[A-Z]{2,}\d+[A-Z0-9-]*\b/giu)||[];
   return hints.length>0&&!hints.some(t=>visibleModel(t,parsed.model))&&!relations.confirmed;
  };
  const names=support_evidence.filter(e=>['software-support','driver-support'].includes(e.relationship)&&e.software_name).map(e=>e.software_name);
  const compact=s=>s.normalize('NFKC').toUpperCase().replace(/[^\p{L}\p{N}]/gu,'');
  const matching=downloads.filter(l=>!wrongLink(l)&&(!relations.confirmed||!names.length||names.some(name=>compact(l.text+' '+decoded(l.url)).includes(compact(name)))||support_evidence.some(e=>e.package?.file_name&&decoded(l.url).includes(e.package.file_name))));
  const directScope=visible&&(visibleModel(parsed.model,probe.title)&&/support|drivers?|utility|software|지원|드라이버|소프트웨어|다운로드/iu.test(probe.title)||(probe.sections||[]).some(s=>visibleModel(parsed.model,s)&&relevantKind(s,target.software_kind)));
  const modelHub=record?.page_role==='model-hub'&&visible&&samePage(record.canonical_page,candidate.url)&&page_type==='support-with-downloads';
  const direct=directScope&&relevantKind(probe.text,target.software_kind)&&matching.length>0;
  if(negative||!(direct||relations.confirmed||modelHub))reason_codes.push(visible?'MODEL_SOFTWARE_RELATION_UNVERIFIED':'EXACT_MODEL_UNVERIFIED');
  else{
   verification.model_support='confirmed';
   if(direct||modelHub)support_evidence.unshift({relationship:'direct-model',source_url:probe.url,models:[parsed.model],software_kind:target.software_kind,observed_fact:modelHub?'Exact model manual/download navigation':'Exact model page and matching software link',target_url:candidate.url,verified_at:probe.verified_at||null,verification:'live_observed',unknowns:['Package installation and device operation not tested']});
  }
  if(!relevantKind(probe.text,target.software_kind)&&!(relations.confirmed&&record?.software_kind===target.software_kind))reason_codes.push('SOFTWARE_KIND_UNVERIFIED');
  const executable=page_type==='web-app'&&webControls(probe)&&['support','web-driver','control-app','utility'].includes(target.software_kind);
  const linkedTool=page_type==='software-hub'&&(record?.evidence||[]).some(e=>e.relationship==='official-distribution'&&e.launch_url&&[...(probe.embeds||[]),...(probe.links||[])].some(u=>samePage(u,e.launch_url))&&healthy(evidenceProbes.get(e.launch_url))&&webControls(evidenceProbes.get(e.launch_url)));
  const downloadControl=relations.confirmed&&(probe.controls||[]).some(t=>/download|다운로드/iu.test(t)&&/Windows|macOS|Mac|윈도우/iu.test(t));
  const linkedDetail=relations.confirmed&&support_evidence.some(e=>e.relationship==='driver-support'&&e.package?.file_name&&e.verification==='live_observed'&&(probe.links||[]).some(u=>samePage(u,e.source_url))&&healthy(evidenceProbes.get(e.source_url))&&(evidenceProbes.get(e.source_url).controls||[]).some(t=>/^download$|^다운로드$/iu.test(t)));
  if(linkedDetail)page_type='support-with-downloads';
  else if(downloadControl)page_type='software-download';
  if(!matching.length&&!executable&&!modelHub&&!linkedTool&&!downloadControl&&!linkedDetail)reason_codes.push('NO_DOWNLOAD_EVIDENCE');
  else verification.software_target=executable?'web-tool':linkedTool?'linked-web-tool':modelHub?'model-hub':linkedDetail?'driver-detail':downloadControl&&!matching.length?'download-control':'download';
  if(['color','switch'].some(k=>parsed.variants[k]&&!visibleModel(parsed.variants[k],probe.text))&&!record?.variant_scope?.includes('color-and-switch'))reason_codes.push('VARIANT_SUPPORT_UNVERIFIED');
  if(/no longer supported|software is retired|discontinued software/iu.test(probe.text))reason_codes.push('LIFECYCLE_UNCERTAIN');
  if(!reason_codes.length){audit_status='live_verified';verified_at=probe.verified_at||null;}
 }else if(record){
  if(!applicableRecord(record,parsed,target.software_kind))reason_codes.push('MODEL_SOFTWARE_RELATION_UNVERIFIED');
  if(['retired','replaced','deprecated'].includes(record.status))reason_codes.push('LIFECYCLE_'+record.status.toUpperCase());
  if(record.support_mode==='family-rule'&&!record.supported_models?.length)reason_codes.push('MODEL_SOFTWARE_RELATION_UNVERIFIED');
  audit_status=record.source==='manual_verified_csv'?'verified_from_dataset_recheck_required':'registry_recheck_required';
 }else reason_codes.push('INDEPENDENT_PAGE_REQUIRED');
 return {eligible:reason_codes.length===0,url:filtered.url||candidate.url,page_type,audit_status,verified_at,reason_codes:[...new Set(reason_codes)],verification,support_evidence,
  locale:observedLocale(probe,record,support_evidence),policy_priority:record?.customer_priority||0,
  evidence_url:probe?.url||record?.evidence_url||record?.evidence?.[0]?.source_url||null,evidence:probe?'Model support and software destination inspected separately':record?'Historical registry mapping; live recheck required':'No independent page evidence',dataset_checked_at:record?.dataset_checked_at||null};
}
