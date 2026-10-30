export function resolveSoftwareTarget(parsed,kind='support',registry={vendors:[]}){
 const kinds=['driver','firmware','control-app','web-driver','toolbox','utility','support'];
 if(!kinds.includes(kind))throw new Error('INVALID_SOFTWARE_KIND');
 let provider=parsed.manufacturer,ecosystem=null;
 if(parsed.category==='gpu'&&['driver','support'].includes(kind)){
  const name=parsed.model||'';
  if(/RTX|GTX|GeForce/iu.test(name)){provider='NVIDIA';ecosystem='nvidia-driver';}
  else if(/Radeon|\bRX\s*\d/iu.test(name)){provider='AMD';ecosystem='amd-driver';}
  else if(/\bArc\b/iu.test(name)){provider='Intel';ecosystem='intel-driver';}
 }
 const vendor=(registry.vendors||[]).find(v=>[v.id,v.name,...v.aliases].some(a=>a.toLowerCase()===(provider||'').toLowerCase()));
 const relationships=vendor?.support_relationships||[];
 return {software_kind:kind,software_provider:provider,ecosystem,domains:[...new Set([...(vendor?.domains||[]),...relationships.flatMap(r=>r.domains)])],vendor_id:vendor?.id||null,support_relationships:relationships,
  evidence:ecosystem?'GPU driver provider determined from chipset family; firmware remains board-vendor scoped.':'Exact model and software kind require independent support evidence.',
  requires_review:parsed.ambiguous||!provider};
}
