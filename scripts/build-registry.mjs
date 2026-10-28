import fs from 'node:fs';
import {loadRegistry,validateRegistry} from '../src/registry.mjs';
const registry=loadRegistry(),checked=validateRegistry(registry.vendors);
if(!checked.valid)throw new Error('INVALID_PUBLIC_REGISTRY');
const version=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
fs.writeFileSync(new URL('../data/public/registry.compiled.json',import.meta.url),JSON.stringify({version,vendors:registry.vendors},null,2)+'\n');
console.log(JSON.stringify({status:'Passed',version,vendors:registry.vendors.length}));
