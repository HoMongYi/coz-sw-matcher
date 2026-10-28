import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {buildRelease,validatePlugin,scanPublic,publicFiles} from '../src/packaging.mjs';import{ROOT}from'../src/registry.mjs';
test('release allowlist never includes source bundles, private overlays or local caches',()=>{
 const files=publicFiles();assert.ok(files.length>80);assert.ok(files.every(p=>!p.includes('node_modules')&&!p.includes('data/private')&&!p.includes('.cache')&&!p.includes('baseline/')&&!p.includes('HANDOFF')));assert.equal(scanPublic().status,'Passed');
});
test('canonical Skill generates portable Plugin and official schema-valid MCP config',()=>{
 const r=buildRelease();assert.equal(r.plugin.status,'Passed');const plugin=path.join(ROOT,'dist/v0.1.0/coz-sw-matcher-codex-plugin-v0.1.0');assert.equal(validatePlugin(plugin).status,'Passed');
 assert.equal(fs.readFileSync(path.join(plugin,'skills/coz-sw-matcher/SKILL.md'),'utf8'),fs.readFileSync(path.join(ROOT,'skills/coz-sw-matcher/SKILL.md'),'utf8'));
 assert.equal(r.artifacts.length,3);assert.ok(r.artifacts.every(a=>a.bytes>1000&&a.sha256.length===64));
});
test('public package metadata reflects MIT approval and the target repository',()=>{
 const p=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json')));assert.equal(p.private,undefined);assert.equal(p.license,'MIT');assert.equal(p.name,'coz-sw-matcher');assert.equal(p.version,'0.1.0');
 assert.equal(p.repository.url,'git+https://github.com/HoMongYi/coz-sw-matcher.git');assert.equal(p.homepage,'https://github.com/HoMongYi/coz-sw-matcher#readme');assert.equal(p.bugs.url,'https://github.com/HoMongYi/coz-sw-matcher/issues');
 const license=fs.readFileSync(path.join(ROOT,'LICENSE'),'utf8');assert.match(license,/MIT License/);assert.match(license,/Copyright \(c\) 2026 HoMongYi/);assert.ok(publicFiles().includes('LICENSE'));assert.ok(publicFiles().includes('CONTRIBUTING.md'));
});
test('Source ZIP is flat and all three ZIP packages carry the approved MIT license',()=>{
 const release=buildRelease();assert.equal(release.license,'MIT');
 function zipFiles(name){const b=fs.readFileSync(path.join(ROOT,'dist/v0.1.0',name));const files=new Map();let offset=0;while(b.readUInt32LE(offset)===0x04034b50){const size=b.readUInt32LE(offset+18),nameSize=b.readUInt16LE(offset+26),extra=b.readUInt16LE(offset+28);const filename=b.subarray(offset+30,offset+30+nameSize).toString();const start=offset+30+nameSize+extra;files.set(filename,b.subarray(start,start+size));offset=start+size;}return files;}
 const source=zipFiles('coz-sw-matcher-v0.1.0-source.zip');assert.ok(source.has('package.json'));assert.ok(source.has('README.md'));assert.ok(source.has('LICENSE'));assert.ok([...source.keys()].every(p=>!p.startsWith('coz-sw-matcher/')));
 const license=fs.readFileSync(path.join(ROOT,'LICENSE'));const skill=zipFiles('coz-sw-matcher-agent-skill-v0.1.0.zip');assert.ok(skill.get('coz-sw-matcher/LICENSE')?.equals(license));
 const plugin=zipFiles('coz-sw-matcher-codex-plugin-v0.1.0.zip');assert.ok(plugin.get('coz-sw-matcher/LICENSE')?.equals(license));assert.ok(plugin.get('coz-sw-matcher/runtime/LICENSE')?.equals(license));
});
