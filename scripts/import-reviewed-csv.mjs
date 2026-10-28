import path from 'node:path';
import {importReviewedCsv} from '../src/local-data/reviewed-csv.mjs';
const args=process.argv.slice(2),input=args[0],classification=args[args.indexOf('--classification')+1];
if(!input||!args.includes('--classification'))throw new Error('USAGE: import-reviewed-csv.mjs FILE --classification PUBLIC_SOURCE_ONLY [--apply]');
const report=importReviewedCsv({input,output:path.resolve('data/private/reviewed-registry.json'),classification,apply:args.includes('--apply')});console.log(JSON.stringify(report,null,2));
