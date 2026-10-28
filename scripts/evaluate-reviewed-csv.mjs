import fs from 'node:fs';import path from 'node:path';
import {loadReviewedOverlay} from '../src/local-data/reviewed-csv.mjs';
import {splitWithoutLeakage,evaluateCases} from '../src/evaluation/evaluate.mjs';
import {createMatcher} from '../src/matcher.mjs';
const overlay=loadReviewedOverlay(process.argv[2]||'data/private/reviewed-registry.json');
const split=splitWithoutLeakage(overlay.records);const matcher=createMatcher({overlay:{records:split.train}});
// Macro evaluation: one representative per URL, rather than rewarding repeated rows.
const unique=[...new Map(split.test.map(r=>[r.url,r])).values()],cases=[];
for(const row of unique){const start=performance.now();const r=await matcher.match({product_name:row.product_name});cases.push({gold_url:row.url,candidates:r.candidates,status:r.status,duration_ms:performance.now()-start});}
const evaluated=await evaluateCases(cases);
const report={classification:overlay.classification,source_sha256:overlay.source_sha256,dataset_counts:overlay.counts,split:{groups:split.groups,train_rows:split.train.length,test_rows:split.test.length,unique_test_urls:unique.length,leakage_count:split.leakage_count,policy:split.policy},mode:'offline grouped holdout; no search/page fetch/paid model calls',...evaluated,unlabelled:overlay.unresolved.length,excluded:overlay.excluded.length,mean_processing_ms:cases.length?cases.reduce((s,c)=>s+c.duration_ms,0)/cases.length:null,cost_usd:0,exact_model_recognition_rate:null,limitations:[...evaluated.limitations,'CSV contains final mappings, not complete five-candidate search or rejection histories.','Offline recall measures retrieval coverage, not current page validity or online search accuracy.','No model-labelled CSV ground truth; model accuracy uses separate golden fixtures.']};
fs.mkdirSync('reports/local',{recursive:true});const destination=path.resolve('reports/local/evaluation.json');fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
