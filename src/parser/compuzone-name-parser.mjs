import {discriminators} from '../identity.mjs';

const BRANDS = {
 GIGABYTE:['GIGABYTE','기가바이트'], ASUS:['ASUS','에이수스'], MSI:['MSI','엠에스아이'],
 Samsung:['삼성전자','삼성','Samsung'], Intel:['INTEL','인텔'], AMD:['AMD'], NVIDIA:['NVIDIA'],
 ATK:['ATK'], Keychron:['Keychron','키크론'], Logitech:['Logitech','로지텍'], Razer:['Razer','레이저'],
 Corsair:['Corsair','커세어'], ABKO:['ABKO','앱코'], COX:['COX','콕스'], VGN:['VGN'],
 ASRock:['ASRock','애즈락'], HP:['HP'], Canon:['Canon','캐논'], Epson:['Epson','엡손'], Brother:['Brother','브라더']
};
const DISTRIBUTORS=['인텍앤컴퍼니','대원씨티에스','제이씨현','디앤디컴','STCOM','에즈윈','펀키스','서린씨앤아이','이엠텍','피씨디렉트'];
const COLORS=['블랙','화이트','퍼플','베이지','핑크','실버','그레이','블루','레드'];
const PROMOTION=/특가|행사|할인|증정|당일출고|예약구매|사은품/u;
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const spaces=s=>s.replace(/\s+/gu,' ').trim();

// Walk balanced delimiters; nested model tokens remain visible, never globally deleted.
function bracketTree(text,warnings){
 const groups=[],stack=[];const pairs={']':'[',')':'('};
 for(let i=0;i<text.length;i++){
  const c=text[i];if(c==='['||c==='(')stack.push({start:i,open:c,depth:stack.length+1});
  else if(c===']'||c===')'){
   const top=stack.at(-1);if(!top||top.open!==pairs[c]){warnings.push('UNBALANCED_BRACKETS');continue;}
   stack.pop();groups.push({...top,end:i+1,text:text.slice(top.start+1,i)});
  }
 }
 if(stack.length)warnings.push('UNBALANCED_BRACKETS');return groups.sort((a,b)=>a.start-b.start);
}
export function parseProductName(input, {vendors=[]}={}){
 const raw=typeof input==='string'?input:input?.product_name;
 if(typeof raw!=='string'||!raw.trim()||raw.length>1000)throw new Error('INVALID_PRODUCT');
 const warnings=[],marketing_tags=[],sales_attributes=[],related_models=[],variants={};
 let text=raw.normalize('NFKC');const brackets=bracketTree(text,warnings);
 const tag=/^\s*\[([^\]]+)\]/u.exec(text)?.[1]?.trim()||'';
 const brand=Object.keys(BRANDS).find(b=>BRANDS[b].some(a=>a.toLowerCase()===tag.toLowerCase()))
  || vendors.find(v=>[v.name,...v.aliases].some(a=>a.toLowerCase()===tag.toLowerCase()))?.name||tag
  ||Object.keys(BRANDS).find(b=>BRANDS[b].some(a=>new RegExp(`^\\s*${escape(a)}(?=\\s|$)`,'iu').test(text)))||null;
 const knownBrand=!!brand&&(Object.hasOwn(BRANDS,brand)||vendors.some(v=>v.name===brand));
 if(!knownBrand)warnings.push('BRAND_UNRESOLVED');
 const brandTokens=[...Object.values(BRANDS).flat(),...vendors.flatMap(v=>[v.name,...v.aliases])].map(escape).join('|');
 const bundle=text.split(new RegExp(`(?<!SE)\\+\\s*(?=\\[(?:${brandTokens})\\])|\\s+\\+\\s+(?=\\[|[\\p{L}\\p{N}])`,'iu'));
 if(bundle.length>1){
  const components=bundle.map(product_name=>parseProductName(product_name,{vendors}));
  return {product_no:input?.product_no??null,raw_product_name:raw,brand,manufacturer:brand,distributor:null,software_provider:null,model:null,category:'bundle',variants,model_variants:variants,marketing_tags:['결합상품'],sales_attributes,related_models,components,brackets,ambiguous:true,warnings:['BUNDLE_TARGET_REQUIRED']};
 }
 text=text.replace(/▶([^◀]*)◀?/gu,(_all,note)=>{
  const models=note.match(/\b[A-Z]{1,5}-?[A-Z]*\d[\w.+-]*/giu)||[];
  related_models.push(...models.map(model=>({model,relationship:/후속모델/u.test(note)?'predecessor':'related',note:spaces(note)})));return ' ';
 });
 let distributor=null;
 for(const d of DISTRIBUTORS)if(text.toUpperCase().includes(d.toUpperCase())){if(distributor&&distributor!==d)warnings.push('MULTIPLE_DISTRIBUTORS');distributor||=d;text=text.replace(new RegExp(escape(d),'giu'),' ');}
 const promotionContent=content=>{
  if(!PROMOTION.test(content))return content;
  marketing_tags.push(spaces(content));
  // Remove sale words, never the surrounding model/revision tokens.
  return content.replace(/플래티넘|단독|결합할인|사은품\s*증정|특가|행사|할인|증정|당일출고|예약구매|사은품/gu,' ');
 };
 text=text.replace(/[★⚡☆]([^★⚡☆]*)[★⚡☆]/gu,(all,note)=>PROMOTION.test(note)?' '+promotionContent(note)+' ':all);
 text=text.replace(/^\s*\[[^\]]+\]/u,' ');
 // Classified groups can be removed; unknown groups are unwrapped and retained.
 for(const group of [...brackets].sort((a,b)=>b.depth-a.depth||b.start-a.start)){
  let content=spaces(group.text);const full=group.open+group.text+(group.open==='['?']':')');
  if(!text.includes(full))continue;
  if(PROMOTION.test(content)){text=text.replace(full,' '+promotionContent(content)+' ');}
  else if(/^(?:CPU쿨러|메인보드|키보드|마우스|프린터)$/iu.test(content)){sales_attributes.push(content);text=text.replace(full,' ');}
  else if(/^(?:정품|토너포함|저소음|벌크)\s*$/u.test(content)||/^인텔\w+\/(?:M-)?ATX$/iu.test(content)){sales_attributes.push(content);text=text.replace(full,' ');}
  else text=text.replace(full,' '+content+' ');
 }
 for(const color of COLORS){const re=new RegExp(`(^|[\\s/])${color}(?=$|[\\s/])`,'gu');if(re.test(text)){if(variants.color&&variants.color!==color)warnings.push('MULTIPLE_COLOR_VARIANTS');variants.color=color;text=text.replace(re,' ');}}
 const switchMatch=/((?:라이트\s*)?(?:저소음\s*)?(?:바나나축|[\p{L}]+축)|후아노(?:\s*저소음)?)/u.exec(text);
 if(switchMatch){variants.switch=spaces(switchMatch[0]);text=text.replace(switchMatch[0],' ');}
 text=text.replace(/(?:정품박스|정품|벌크|한글판|토너포함)/gu,s=>{sales_attributes.push(s);return ' ';});
 text=text.replace(/(?:단독\s*)?(?:특가|행사|결합할인|당일출고|예약구매|사은품\s*증정)/gu,s=>{marketing_tags.push(s);return ' ';});
 const category= /키보드|keyboard/iu.test(raw)?'keyboard':/마우스|mouse/iu.test(raw)?'mouse':/프린터|복합기|SL-[MC]\d|printer/iu.test(raw)?'printer':/지포스|GeForce|Radeon|\bRTX\s*\d|\bArc\b/iu.test(raw)?'gpu':/CPU쿨러|코어리퀴드|liquid/iu.test(raw)?'cooler':/메인보드|\b[ABHWXZ]\d{3}[A-Z-]/iu.test(text)?'motherboard':/프로세서|\b(?:Ultra\d|Core|Ryzen)\b/iu.test(raw)?'cpu':/SSD|NVMe|HDD/iu.test(raw)?'storage':'unknown';
 if(category==='keyboard'||category==='mouse'){
  text=text.replace(/^.*?(?:마우스|키보드)\s*[,，]\s*/u,'').replace(/저소음|잠자리/gu,' ');
 }
 for(const a of [brand,...(BRANDS[brand]||[])].filter(Boolean))text=text.replace(new RegExp(`(^|\\s)${escape(a)}(?=\\s|$)`,'giu'),' ');
 text=text.replace(/흑백\s*레이저\s*프린터|레이저\s*프린터|프로세서|지포스|기계식\s*키보드/gu,' ');
 text=text.replace(/(^|\s)(?:마우스|키보드|프린터|복합기)(?=\s|$)/gu,' ');
 if(category==='gpu'){
  const mem=text.match(/\bD[56]\b/u)?.[0],capacity=text.match(/\b\d+GB\b/iu)?.[0];
  if(mem){variants.graphics_memory=mem;text=text.replace(mem,' ');}if(capacity){variants.capacity=capacity;text=text.replace(capacity,' ');}
 }
 text=spaces(text.replace(/[\[\]()]/gu,' ').replace(/\s*\/\s*$/u,''));
 const d=discriminators(text);Object.assign(variants,{...(d.memory?{memory_generation:d.memory}:{}),...(d.wifi?{wifi:d.wifi}:{}),...(d.revision?{revision:d.revision}:{}),...(d.capacity?{capacity:d.capacity}:{})});
 const registered=vendors.filter(v=>v.name===brand).flatMap(v=>[...v.models,...v.ecosystems]).some(r=>[r.model,...r.supported_models].filter(Boolean).some(m=>m.toUpperCase()===text.toUpperCase()));
 if(!/\d/u.test(text)&&!registered)warnings.push('MODEL_UNRESOLVED');
 return {product_no:input?.product_no??null,raw_product_name:raw,brand,manufacturer:brand,distributor,software_provider:brand,model:text||null,category,variants,model_variants:variants,marketing_tags:[...new Set(marketing_tags)],sales_attributes:[...new Set(sales_attributes)],related_models,components:[],brackets,ambiguous:warnings.length>0,warnings:[...new Set(warnings)]};
}
