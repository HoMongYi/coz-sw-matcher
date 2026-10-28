import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {inspectReviewedCsv,importReviewedCsv} from '../src/local-data/reviewed-csv.mjs';
import {splitWithoutLeakage,evaluateCases} from '../src/evaluation/evaluate.mjs';
const header='product_no,product_name,sw_download,status,reason,evidence_url,locale,verification_method,candidate_url,hsuf_decision,hsuf_reason,checked_at\n';
const csv=header+'synthetic-1,[ASUS] ABC123 V2,https://www.asus.com/support/abc123,유지,,https://www.asus.com/support/abc123,ko,manual,,review,,2026-10-26\n'+'synthetic-2,[ASUS] DEF456,,확인 필요,,,,,,review,,\n';
test('CSV separates approved, unresolved and excluded without inventing live dates',()=>{
 const r=inspectReviewedCsv(csv);assert.equal(r.counts.rows,2);assert.equal(r.counts.approved,1);assert.equal(r.counts.needs_review,1);assert.equal(r.records[0].verified_at,null);assert.equal(r.records[0].source,'manual_verified_csv');assert.equal(r.records[0].approved,false);
 assert.throws(()=>inspectReviewedCsv(csv+csv.split('\n')[1]+'\n'),/DUPLICATE_PRODUCT_NO/);assert.throws(()=>inspectReviewedCsv(header.replace('product_no','secret')+'x\n'),/CSV_COLUMNS/);
});
test('private import requires classification, dry-runs, backs up, is idempotent and refuses a public output path',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coz-data-'));const input=path.join(dir,'source.csv');fs.writeFileSync(input,csv);const output=path.join(dir,'data/private/registry.json');
 assert.throws(()=>importReviewedCsv({input,output,privateRoot:path.join(dir,'data/private'),classification:'UNKNOWN'}),/CLASSIFICATION_REQUIRED/);
 assert.throws(()=>importReviewedCsv({input,output:path.join(dir,'public/registry.json'),privateRoot:path.join(dir,'data/private'),classification:'PUBLIC_SOURCE_ONLY'}),/PRIVATE_DESTINATION_REQUIRED/);
 assert.equal(importReviewedCsv({input,output,privateRoot:path.join(dir,'data/private'),classification:'PUBLIC_SOURCE_ONLY'}).written,false);assert.equal(fs.existsSync(output),false);
 const first=importReviewedCsv({input,output,privateRoot:path.join(dir,'data/private'),classification:'PUBLIC_SOURCE_ONLY',apply:true});assert.equal(first.written,true);assert.equal(fs.existsSync(first.source_backup),true);
 const second=importReviewedCsv({input,output,privateRoot:path.join(dir,'data/private'),classification:'PUBLIC_SOURCE_ONLY',apply:true});assert.equal(second.changed,false);assert.equal(second.after,1);assert.equal(fs.readFileSync(input,'utf8'),csv);
});
test('connected URL, family and ecosystem groups never cross train/evaluation',()=>{
 const records=[{model:'ABC123',manufacturer:'ASUS',url:'https://example.com/a'},{model:'DEF456',manufacturer:'ASUS',url:'https://example.com/a'},{model:'DEF456',manufacturer:'ASUS',url:'https://example.com/b'},{model:'XYZ999',manufacturer:'ASUS',url:'https://example.com/c'}];
 const s=splitWithoutLeakage(records);assert.equal(s.groups,2);assert.equal(s.leakage_count,0);
 for(const a of s.train)for(const b of s.test){assert.notEqual(a.url,b.url);assert.notEqual(a.model,b.model);}
});
test('metrics do not fabricate labels, approval rates or a Luna run',async()=>{
 const r=await evaluateCases([{gold_url:'https://example.com/a',candidates:[],status:'needs_review'},{gold_url:null,candidates:[],status:'needs_review'}]);assert.equal(r.baseline.labelled,1);assert.equal(r.baseline.top5_inclusion_rate,0);assert.equal(r.baseline.first_choice_approval_rate,null);assert.equal(r.baseline.wrong_model_rate,null);assert.equal(r.luna.status,'Not run');assert.equal(r.unlabelled,1);
});
test('rule and Luna compare the same frozen candidates, without URL creation',async()=>{
 const cases=[{gold_url:'https://example.com/b',candidates:[{id:'a',url:'https://example.com/a'},{id:'b',url:'https://example.com/b'}],status:'needs_human_approval'}];
 const r=await evaluateCases(cases,{ranker:{rank:async()=>({ordered_ids:['b','a'],needs_review:false,reasons:[]})}});assert.equal(r.baseline.top1_url_agreement_rate,0);assert.equal(r.luna.top1_url_agreement_rate,1);assert.equal(r.luna.top5_inclusion_rate,1);
});
test('failed Luna evaluation is Failed with unknown cost and mandatory human review is counted',async()=>{
 const r=await evaluateCases([{gold_url:'https://example.com/a',candidates:[{id:'a',url:'https://example.com/a'}],status:'needs_human_approval'}],{ranker:{rank:async()=>{throw Error('timeout');}}});assert.equal(r.luna.status,'Failed');assert.equal(r.luna.cost_usd,null);assert.equal(r.baseline.review_rate,1);
});
test('default importer refuses an arbitrary path containing data/private',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coz-boundary-'));const input=path.join(dir,'source.csv');fs.writeFileSync(input,csv);assert.throws(()=>importReviewedCsv({input,output:path.join(dir,'shared/data/private/out.json'),classification:'PUBLIC_SOURCE_ONLY',apply:true}),/PRIVATE_DESTINATION_REQUIRED/);
});
test('model variants and shared ecosystems stay in the same evaluation group',()=>{
 const records=[{manufacturer:'ASUS',category:'motherboard',model:'ABC123 D4 V2',url:'https://example.com/a'},{manufacturer:'ASUS',category:'motherboard',model:'ABC123 D5',url:'https://example.com/b'},{manufacturer:'ASUS',category:'gpu',model:'RTX 3050',url:'https://example.com/c',ecosystem:'nvidia-driver'},{manufacturer:'MSI',category:'gpu',model:'RTX 4060',url:'https://example.com/d',ecosystem:'nvidia-driver'}];
 const s=splitWithoutLeakage(records);assert.equal(s.groups,2);assert.equal(s.leakage_count,0);
});
