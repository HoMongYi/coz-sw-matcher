export const approvalContract=Object.freeze({version:'1.0',owner:'host application',operation:'validate-only',selection:'one-existing-candidate',authentication:'host-owned',storage:'host-owned',fields:['request_id','candidate_id','decision','approved_by','approved_at','reason']});
export function validateApproval(value,result){
 const errors=[];
 if(!value||Object.keys(value).some(k=>!approvalContract.fields.includes(k)))return {valid:false,errors:['INVALID_APPROVAL_FIELDS'],persisted:false};
 if(value.request_id!==result.request_id)errors.push('REQUEST_MISMATCH');
 const candidate=result.candidates.find(c=>c.id===value.candidate_id);
 if(!candidate)errors.push('CANDIDATE_NOT_FOUND');
 if(value.decision!=='approve')errors.push('ONE_APPROVAL_REQUIRED');
 for(const key of ['approved_by','reason'])if(typeof value[key]!=='string'||!value[key].trim()||value[key].length>500)errors.push('INVALID_'+key.toUpperCase());
 if(typeof value.approved_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value.approved_at)||!Number.isFinite(Date.parse(value.approved_at))||Date.parse(value.approved_at)>Date.now()+60000)errors.push('INVALID_APPROVED_AT');
 if(result.status!=='needs_human_approval'||candidate?.audit_status!=='live_verified')errors.push('INDEPENDENT_RECHECK_REQUIRED');
 return {valid:errors.length===0,errors,persisted:false,authentication_verified:false};
}
