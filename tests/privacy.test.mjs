import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { compilePages } from '../scripts/build-site.mjs';
import { pages, courses } from '../scripts/site-data.mjs';

const context={window:{}};
runInNewContext(await readFile(new URL('../site-assets/privacy-preferences.js',import.meta.url),'utf8'),context);
const model=context.window.PrecisionPrivacyPreferences;
const now=Date.UTC(2026,10,15);

test('optional permissions require explicit booleans and store no enquiry information',()=>{
  const value=model.create({maps:true,videos:'true',email:'visitor@example.com',message:'private'},now);
  assert.deepEqual(JSON.parse(JSON.stringify(value)),{version:1,maps:true,videos:false,updatedAt:now});
  assert.equal(model.parse(JSON.stringify(value),now).maps,true);
  assert.equal(model.parse(JSON.stringify(value),now).videos,false);
});

test('missing, malformed, old or future preference records never enable optional services',()=>{
  for (const raw of [null,'','{','[]','true',JSON.stringify({version:1,maps:'true',videos:true,updatedAt:now}),JSON.stringify({version:2,maps:true,videos:true,updatedAt:now}),JSON.stringify({version:1,maps:true,videos:true,updatedAt:now+1}),JSON.stringify({version:1,maps:true,videos:true,updatedAt:now-model.maxAge})]) assert.equal(model.parse(raw,now),null,String(raw));
  const necessary=model.parse(JSON.stringify(model.create({maps:false,videos:false},now)),now);
  assert.equal(necessary.maps,false);assert.equal(necessary.videos,false);
  assert.equal(model.maxAge,180*24*60*60*1000);
});

test('every page exposes policy controls and keeps external resources off before permission',async()=>{
  const files=await compilePages();
  for (const [name,html] of files) {
    for (const route of ['/privacy','/cookies','/terms']) assert.ok(html.includes(`href="${route}"`),name+route);
    assert.equal((html.match(/id="privacy-banner"/g)||[]).length,1,name);
    assert.equal((html.match(/id="privacy-dialog"/g)||[]).length,1,name);
    assert.doesNotMatch(html,/<(?:img|video|source|iframe|script)\b[^>]*\b(?:src|poster)="https?:\/\//,name);
    assert.doesNotMatch(html,/<link\b[^>]*(?:fonts\.googleapis|fonts\.gstatic)/,name);
    assert.ok(html.indexOf('src="/site-assets/privacy.js"')<html.search(/src="\/?site-assets\/navigation\.js"/),name);
  }
  for (const kind of ['privacy','cookies','terms']) assert.ok(pages.some(page=>page.kind===kind));
  for (const course of courses) assert.match(course.coverPath,/^\/site-assets\/course-/);
  assert.match(files.get('terms.html'),/id="text-messaging"/);
  assert.match(files.get('cookies.html'),/precision_privacy_v1/);
});
