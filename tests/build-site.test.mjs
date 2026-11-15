import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
test('all pages need launch approval for indexing and building preserves every source file',async()=>{
  const sources=['index.html','shawn-melanson.html'];
  const hashes=await Promise.all(sources.map(async file=>hash(await readFile(join(root,file)))));
  function build(environment){
    const result=spawnSync(process.execPath,['scripts/build-site.mjs'],{cwd:root,env:{...process.env,...environment},encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
  }
  try {
    build({VERCEL_ENV:'production',SITE_LAUNCH_READY:'true'});
    let html=await readFile(join(root,'dist/index.html'),'utf8');
    assert.match(html,/<meta name="robots" content="index, follow, max-image-preview:large">/);
    assert.match(await readFile(join(root,'dist/sitemap.xml'),'utf8'),/<loc>https:\/\/precisionjiujitsunh.com\/<\/loc>/);
    assert.match(await readFile(join(root,'dist/sitemap.xml'),'utf8'),/<loc>https:\/\/precisionjiujitsunh.com\/shawn-melanson<\/loc>/);
    assert.match(await readFile(join(root,'dist/robots.txt'),'utf8'),/Sitemap:/);
    assert.match(html,/href="\/shawn-melanson"/);
    const profile=await readFile(join(root,'dist/shawn-melanson.html'),'utf8');
    assert.match(profile,/<meta name="robots" content="index, follow, max-image-preview:large">/);
    assert.match(profile,/rel="canonical" href="https:\/\/precisionjiujitsunh.com\/shawn-melanson"/);
    assert.match(profile,/href="\/#trial"/);
    assert.doesNotMatch(profile,/href="new index.html/);
    assert.ok((await readFile(join(root,'dist/site-assets/site.css'),'utf8')).includes('.home-page .site-header'));
    assert.ok((await readFile(join(root,'dist/site-assets/navigation.js'),'utf8')).includes('updateHeader'));
    build({VERCEL_ENV:'preview',SITE_LAUNCH_READY:'true'});
    html=await readFile(join(root,'dist/index.html'),'utf8');
    assert.match(html,/<meta name="robots" content="noindex, nofollow">/);
    assert.match(await readFile(join(root,'dist/shawn-melanson.html'),'utf8'),/<meta name="robots" content="noindex, nofollow">/);
    assert.doesNotMatch(await readFile(join(root,'dist/sitemap.xml'),'utf8'),/<loc>/);
    for (const [index,file] of sources.entries()) assert.equal(hash(await readFile(join(root,file))),hashes[index]);
  } finally {
    build({VERCEL_ENV:'preview',SITE_LAUNCH_READY:'false'});
  }
});
