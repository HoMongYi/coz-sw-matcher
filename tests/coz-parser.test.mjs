import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProductName} from '../src/parser/compuzone-name-parser.mjs';
import {sameModel} from '../src/matching/model-identity.mjs';
import {resolveSoftwareTarget} from '../src/matching/software-target-resolver.mjs';

const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/compuzone-product-names/golden.json',import.meta.url),'utf8'));
export const names=golden.cases.map(c=>c.product_name);
const expected=golden.cases.map(c=>c.model);
names.forEach((name,i)=>test(`spec parser case ${i+1}`,()=>{
 const p=parseProductName({product_name:name});assert.equal(p.raw_product_name,name);assert.equal(p.model,expected[i]);
 if(i===0){assert.equal(p.variants.memory_generation,'D4');assert.equal(p.distributor,'제이씨현');assert.ok(p.sales_attributes.includes('벌크'));}
 if(i===1){assert.equal(p.related_models[0].model,'SL-M2630');assert.equal(p.related_models[0].relationship,'predecessor');}
 if(i===2){assert.equal(resolveSoftwareTarget(p,'driver').software_provider,'NVIDIA');assert.equal(resolveSoftwareTarget(p,'firmware').software_provider,'ASUS');}
 if(i===3){assert.ok(p.marketing_tags.includes('단독 특가'));assert.equal(p.variants.color,'블랙');}
 if(i===4){assert.equal(p.ambiguous,true);assert.equal(p.components.length,2);assert.equal(p.components[0].model,'H810M-B');assert.equal(p.components[1].model,'Ultra5 225F');}
 if(i===5){assert.equal(p.distributor,'펀키스');assert.equal(p.variants.color,'퍼플');assert.match(p.variants.switch,/후아노/);}
}));
test('nested unknown brackets preserve identifying content',()=>{
 const p=parseProductName('[ASUS] PRIME [B850M-E [WIFI]] (Rev 2.0)');assert.match(p.model,/B850M-E WIFI/);assert.match(p.model,/Rev 2.0/);assert.equal(p.brackets.some(b=>b.depth===2),true);
});
test('distributor changes and promotion do not change exact model identity',()=>{
 const a=parseProductName('[ASUS] TUF Gaming B850M-E WIFI 인텍앤컴퍼니');const b=parseProductName('[ASUS] TUF Gaming B850M-E WIFI 대원씨티에스 ★특가★');assert.equal(sameModel(a.model,b.model),true);assert.notEqual(a.distributor,b.distributor);
});
for(const token of ['D4','D5','WiFi','V2','Rev 2.0','OC','HE','SE+','PRO','MAX','2TB'])test(`retains identifier ${token}`,()=>assert.ok(parseProductName(`[ATK] MODEL123 ${token}`).model.includes(token)));
test('unknown brand/model and unbalanced brackets require review',()=>{
 assert.equal(parseProductName('[Unmapped] Mystery').ambiguous,true);assert.ok(parseProductName('[ASUS] MODEL123 [V2').warnings.includes('UNBALANCED_BRACKETS'));
 assert.throws(()=>parseProductName(' '.repeat(20)),/INVALID_PRODUCT/);
});
test('keyboard switches/color are variants and firmware stays model scoped',()=>{
 const p=parseProductName('[Keychron] 유,무선 기계식 키보드, 키크론 K10 PRO SE2 ZMK 베이지 / 라이트 저소음 바나나축');assert.equal(p.model,'K10 PRO SE2 ZMK');assert.equal(p.category,'keyboard');assert.equal(p.variants.color,'베이지');assert.match(p.variants.switch,/바나나축/);
});
test('brand-delimited bundles without spaces are identified without splitting SE+',()=>{
 assert.equal(parseProductName('[MSI] H810M-B+[INTEL] Ultra5 프로세서 225F').components.length,2);
 assert.equal(parseProductName('[ATK] VXE R1 SE+ [펀키스 정품]').model,'VXE R1 SE+');
});
