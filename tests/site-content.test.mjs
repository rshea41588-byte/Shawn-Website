import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { compilePages, root, releaseEnabled, sitemapText, siteOrigin } from '../scripts/build-site.mjs';
import { pages, courses, sourcePages } from '../scripts/site-data.mjs';

test('the single homepage, every route, and all local links and assets remain valid',async()=>{
  assert.equal(sourcePages.find(page=>page.route==='/').source,'index.html');
  await assert.rejects(stat(join(root,'new index.html')),{code:'ENOENT'});
  const files=await compilePages();
  const routes=new Map(pages.map(p=>[p.route,files.get(p.output)]));
  assert.equal(routes.size,14);
  for (const [route,html] of routes) {
    assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,route);
    assert.match(html,/<meta name="robots" content="noindex, nofollow">/,route);
    assert.match(html,new RegExp('rel="canonical" href="https://precisionjiujitsunh.com'+route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"'),route);
    const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(scripts.length,route);
    for (const script of scripts) {
      const graph=JSON.parse(script[1]);
      assert.equal(graph['@context'],'https://schema.org');
      assert.doesNotMatch(script[1],/AggregateRating|"offers"/);
    }
    for (const match of html.matchAll(/\b(href|src|poster)="([^"]+)"/g)) {
      const value=match[2].replaceAll('&amp;','&');
      if (/^(https?:|mailto:|tel:|data:)/.test(value)) continue;
      const url=new URL(value,'https://test.local'+route);
      const path=decodeURIComponent(url.pathname);
      const normalized=path==='/index.html'?'/':path==='/shawn-melanson.html'?'/shawn-melanson':path;
      if (routes.has(normalized)) {
        if (url.hash) {
          const id=decodeURIComponent(url.hash.slice(1));
          assert.ok(routes.get(normalized).includes(`id="${id}"`),`${route}: missing anchor ${value}`);
        }
      } else assert.ok((await stat(join(root,path))).isFile(),`${route}: missing asset ${value}`);
    }
  }
});

test('all registered pages honor the launch gate and alternate origin together',async()=>{
  const publicFiles=await compilePages({origin:'https://example.org',publicRelease:true});
  assert.equal(publicFiles.size,pages.length);
  for (const html of publicFiles.values()) {
    assert.match(html,/name="robots" content="index, follow, max-image-preview:large"/);
    assert.doesNotMatch(html,/https:\/\/precisionjiujitsunh.com/);
  }
  for (const environment of [{},{VERCEL_ENV:'preview',SITE_LAUNCH_READY:'true'},{VERCEL_ENV:'production',SITE_LAUNCH_READY:'false'}]) assert.equal(releaseEnabled(environment),false);
  assert.equal(releaseEnabled({VERCEL_ENV:'production',SITE_LAUNCH_READY:'true'}),true);
  assert.equal((sitemapText('https://example.org',true).match(/<loc>/g)||[]).length,pages.length);
  assert.doesNotMatch(sitemapText('https://example.org',false),/<loc>/);
  for (const invalid of ['http://example.org','https://example.org/path','https://user:pass@example.org/']) assert.throws(()=>siteOrigin(invalid));
});

test('course pages use only the verified public publisher players and have distinct content',async()=>{
  const files=await compilePages();
  assert.equal(courses.length,7);
  assert.equal(courses.filter(c=>c.freeSampleUrl).length,5);
  for (const course of courses) {
    for (const url of [course.trailerUrl,course.freeSampleUrl].filter(Boolean)) {
      assert.equal(new URL(url).origin,'https://iframe.mediadelivery.net');
      assert.match(new URL(url).pathname,/^\/embed\/596460\//);
    }
    const html=files.get(`instructionals/${course.slug}.html`);
    assert.ok(html.includes(course.publisherUrl));
    assert.ok(html.includes('Find the fit')); assert.ok(html.includes('How does it compare?'));
    assert.ok(html.includes('data-course="'+course.slug+'"'));
    assert.doesNotMatch(html,/<iframe/,'Players must wait for visitor loading');
  }
});

test('Shawn’s profile exposes the complete catalog and separates booking enquiries from trial requests',async()=>{
  const files=await compilePages();
  const profile=files.get('shawn-melanson.html');
  const displayed=[...profile.matchAll(/data-instructional="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(displayed.length,courses.length);
  assert.deepEqual(new Set(displayed),new Set(courses.map(course=>course.slug)));
  assert.equal(displayed[0],'leg-drag-system');
  assert.equal((profile.match(/class="mobile-cta"/g)||[]).length,1);
  for (const id of ['1695','1735','1478','887']) assert.ok(profile.includes(`https://ibjjf.com/events/${id}/results`));
  const enquiries=[...profile.matchAll(/href="(mailto:[^"]+subject=[^"]+)"/g)].map(match=>new URL(match[1].replaceAll('&amp;','&')));
  for (const topic of ['seminar','private training']) {
    const enquiry=enquiries.find(url=>url.searchParams.get('subject')?.includes(topic));
    assert.ok(enquiry,topic);
    assert.equal(enquiry.pathname,'precisionjiujitsu29@gmail.com');
    assert.match(enquiry.searchParams.get('body'),/Your name and contact details:/);
  }
  assert.ok(profile.includes('https://www.youtube.com/@shawnmelanson160'));
  assert.doesNotMatch(profile,/<iframe/,'The interview should load only when requested');
});
