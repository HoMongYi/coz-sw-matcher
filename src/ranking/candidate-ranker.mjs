export function rankCandidates(candidates){
 return candidates.map(c=>({...c,score:(c.audit_status==='live_verified'?100:0)+(c.page_type==='software-download'?20:c.page_type==='support-with-downloads'?15:0)+(/ko-kr|\/kr\/|\/ko\/|\.co\.kr/iu.test(c.url)?5:0)}))
  .sort((a,b)=>b.score-a.score||a.url.localeCompare(b.url)).slice(0,5).map((c,i)=>({...c,rank:i+1}));
}
export function applyLunaRanking(value,candidates){
 if(!value||Object.keys(value).some(k=>!['ordered_ids','needs_review','reasons','usage'].includes(k))||!Array.isArray(value.ordered_ids)||value.ordered_ids.length!==candidates.length||new Set(value.ordered_ids).size!==candidates.length||value.ordered_ids.some(id=>!candidates.some(c=>c.id===id))||typeof value.needs_review!=='boolean'||!Array.isArray(value.reasons)||value.reasons.length>10||value.reasons.some(r=>typeof r!=='string'||r.length>500))throw new Error('INVALID_LUNA_RESPONSE');
 if(value.usage&&Object.entries(value.usage).some(([k,v])=>!['input_tokens','output_tokens','cost_usd','duration_ms'].includes(k)||v!==null&&(!Number.isFinite(v)||v<0)))throw new Error('INVALID_LUNA_USAGE');
 return value.ordered_ids.map((id,i)=>({...candidates.find(c=>c.id===id),rank:i+1}));
}
