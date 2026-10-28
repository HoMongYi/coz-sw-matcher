import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {parse} from 'csv-parse/sync';
import {parseProductName} from '../parser/compuzone-name-parser.mjs';
import {loadRegistry,ROOT} from '../registry.mjs';
import {execFileSync} from 'node:child_process';
import {resolveSoftwareTarget} from '../matching/software-target-resolver.mjs';
const COLUMNS=['product_no','product_name','sw_download','status','reason','evidence_url','locale','verification_method','candidate_url','hsuf_decision','hsuf_reason','checked_at'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function inspectReviewedCsv(text){
 if(Buffer.byteLength(text)>8_388_608)throw new Error('CSV_TOO_LARGE');
 const rows=parse(text,{bom:true,skip_empty_lines:true,max_record_size:65536,columns:header=>{if(header.length!==COLUMNS.length||new Set(header).size!==header.length||header.some(k=>!COLUMNS.includes(k)))throw new Error('CSV_COLUMNS');return header;}});
 if(!rows.length||rows.length>10000)throw new Error('CSV_ROW_LIMIT');
 const ids=new Set(),urls=new Set(),records=[],unresolved=[],excluded=[];const vendors=loadRegistry().vendors;
 const counts={rows:rows.length,unique_ids:0,approved:0,needs_review:0,excluded:0,unique_urls:0,candidate_urls:0,status:{}};
 for(const row of rows){
  if(!row.product_no||ids.has(row.product_no))throw new Error('DUPLICATE_PRODUCT_NO');ids.add(row.product_no);
  if(!['유지','변경','확인 필요','제외'].includes(row.status))throw new Error('INVALID_REVIEW_STATUS');
  if(row.product_name.length>1000||row.product_no.length>200||Object.values(row).some(v=>v.length>10000))throw new Error('CSV_FIELD_LIMIT');
  counts.status[row.status]=(counts.status[row.status]||0)+1;if(row.candidate_url)counts.candidate_urls++;
  const parsed=parseProductName(row,{vendors});const base={product_no:row.product_no,product_name:row.product_name,manufacturer:parsed.manufacturer,model:parsed.model,category:parsed.category,variants:parsed.variants,distributor:parsed.distributor,parser_ambiguous:parsed.ambiguous,software_kind:'support',ecosystem:resolveSoftwareTarget(parsed,'driver').ecosystem,source:'manual_verified_csv',dataset_checked_at:row.checked_at||null,verified_at:null,approved:false,evidence_url:row.evidence_url||null,locale:row.locale||null,candidate_url:row.candidate_url||null};
  if(['유지','변경'].includes(row.status)){
   if(!row.sw_download)throw new Error('APPROVED_URL_REQUIRED');let u;try{u=new URL(row.sw_download);}catch{throw new Error('INVALID_DATASET_URL');}
   if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new Error('INVALID_DATASET_URL');
   records.push({...base,url:row.sw_download,dataset_status:row.status});urls.add(row.sw_download);counts.approved++;
  }else if(row.status==='확인 필요'){unresolved.push(base);counts.needs_review++;}
  else{excluded.push(base);counts.excluded++;}
 }
 counts.unique_ids=ids.size;counts.unique_urls=urls.size;return {counts,records,unresolved,excluded};
}
function checkPrivateDestination(output,privateRoot){
 const absolute=path.resolve(output),root=path.resolve(privateRoot),relative=path.relative(root,absolute);
 if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw new Error('PRIVATE_DESTINATION_REQUIRED');
 let parent=absolute;while(true){if(fs.existsSync(parent)&&fs.lstatSync(parent).isSymbolicLink())throw new Error('PRIVATE_SYMLINK_REJECTED');const next=path.dirname(parent);if(next===parent)break;parent=next;}
 parent=path.dirname(absolute);while(!fs.existsSync(parent))parent=path.dirname(parent);
 let gitRoot=null;try{gitRoot=execFileSync('git',['-C',parent,'rev-parse','--show-toplevel'],{encoding:'utf8',stdio:['ignore','pipe','ignore'],windowsHide:true}).trim();}catch{}
 if(gitRoot){try{execFileSync('git',['-C',gitRoot,'check-ignore','--no-index','--',absolute],{stdio:'ignore',windowsHide:true});}catch{throw new Error('PRIVATE_DESTINATION_NOT_IGNORED');}}
 return absolute;
}
export function loadReviewedOverlay(file){
 if(fs.statSync(file).size>16_777_216)throw new Error('OVERLAY_TOO_LARGE');const data=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!Array.isArray(data.records)||data.records.length>10000||data.records.some(r=>r.source!=='manual_verified_csv'||typeof r.url!=='string'||r.url.length>4096))throw new Error('INVALID_OVERLAY');return data;
}
export function importReviewedCsv({input,output,classification,apply=false,privateRoot=path.join(ROOT,'data/private')}){
 if(!['PUBLIC_SOURCE_ONLY','MASKED','REAL_COMPANY'].includes(classification))throw new Error('CLASSIFICATION_REQUIRED');
 const destination=checkPrivateDestination(output,privateRoot);if(fs.statSync(input).size>8_388_608)throw new Error('CSV_TOO_LARGE');
 const source=fs.readFileSync(input),source_sha256=hash(source),data=inspectReviewedCsv(source.toString('utf8'));
 const before=fs.existsSync(destination)?loadReviewedOverlay(destination).records.length:0;
 const unchanged=fs.existsSync(destination)&&loadReviewedOverlay(destination).source_sha256===source_sha256&&loadReviewedOverlay(destination).schema_version===3;
 const report={written:false,changed:!unchanged,before,after:data.records.length,counts:data.counts,source_sha256,classification,source_backup:null,rollback:null};
 if(!apply||unchanged)return report;
 const dir=path.dirname(destination);fs.mkdirSync(path.join(dir,'backups'),{recursive:true});
 const source_backup=path.join(dir,'backups',`source-${source_sha256}.csv`);
 if(!fs.existsSync(source_backup))fs.writeFileSync(source_backup,source,{flag:'wx'});
 if(hash(fs.readFileSync(source_backup))!==source_sha256)throw new Error('SOURCE_BACKUP_MISMATCH');
 let rollback='Remove the newly created overlay; original CSV remains unchanged.';
 if(fs.existsSync(destination)){
  const bytes=fs.readFileSync(destination),backup=path.join(dir,'backups',`overlay-${hash(bytes)}.json`);
  if(!fs.existsSync(backup))fs.writeFileSync(backup,bytes,{flag:'wx'});if(hash(fs.readFileSync(backup))!==hash(bytes))throw new Error('OVERLAY_BACKUP_MISMATCH');rollback=`Restore overlay from ${backup}`;
 }
 if(hash(fs.readFileSync(input))!==source_sha256)throw new Error('SOURCE_CHANGED');
 const temp=destination+'.'+crypto.randomUUID()+'.tmp';
 try{fs.writeFileSync(temp,JSON.stringify({schema_version:3,classification,source_sha256,...data},null,2)+'\n',{flag:'wx'});loadReviewedOverlay(temp);fs.renameSync(temp,destination);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
 return {...report,written:true,source_backup,rollback};
}
