import {identityKey, discriminators} from '../identity.mjs';
export const sameModel=(a,b)=>!!a&&!!b&&identityKey(a)===identityKey(b);
export function modelConflict(wanted,seen){
 if(!wanted||!seen)return false;
 if(sameModel(wanted,seen))return false;
 const a=discriminators(wanted),b=discriminators(seen);
 return Object.keys(a).some(k=>b[k]&&a[k]!==b[k])||identityKey(wanted)!==identityKey(seen);
}
export const modelFamily=p=>`${p.manufacturer||'unknown'}:${p.category||'unknown'}:${identityKey(p.model||'unknown').replace(/\b(?:REV(?:ISION)?\.?\s*\d+(?:\.\d+)*|V\d+|D[45]|DDR[45]|WIFI(?:\s*[67]E?)?|OC|HE|PRO|MAX|SE\+?|\d+\s*(?:GB|TB)|BLACK|WHITE)\b/gu,'').replace(/\s+/gu,' ').trim()}`;
