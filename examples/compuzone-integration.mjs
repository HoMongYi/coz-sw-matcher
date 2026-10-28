import {createMatcher,validateApproval} from '../src/index.mjs';
// Host owns candidate discovery, authentication, review UI and the actual write.
export async function prepareReview(input,{matcher=createMatcher()}={}){
 return matcher.match(input); // Offline by default; no duplicate paid search.
}
export function checkHumanSelection(selection,result){return validateApproval(selection,result);}
