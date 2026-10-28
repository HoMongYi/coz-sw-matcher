#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const candidates=[...(process.env.COZ_SW_HOME?[path.join(process.env.COZ_SW_HOME,'bin/coz-sw-matcher.mjs')]:[]),path.resolve(here,'../../../runtime/bin/coz-sw-matcher.mjs'),path.resolve(here,'../../../bin/coz-sw-matcher.mjs')];
const entry=candidates.find(p=>fs.existsSync(p));
if(!entry){process.stderr.write('Set COZ_SW_HOME to the installed project directory.\n');process.exitCode=2;}else{const{main}=await import(pathToFileURL(entry).href);await main(process.argv.slice(2));}
