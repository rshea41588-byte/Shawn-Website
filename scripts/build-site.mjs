import { mkdir, readFile, writeFile, readdir, copyFile, rm } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages, defaultOrigin } from './site-data.mjs';
import { renderPage, scheduleRows, notFound, renderProfileCatalog } from './render-pages.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const releaseEnabled = env => env.VERCEL_ENV === 'production' && env.SITE_LAUNCH_READY === 'true';
export function siteOrigin(value=defaultOrigin) {
  const url=new URL(value);
  if (url.protocol!=='https:' || url.username || url.password || url.pathname!=='/' || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS origin with no path or credentials.');
  return url.origin;
}
export function prepareHTML(html,origin,publicRelease) {
  return html.replaceAll(defaultOrigin,origin)
    .replace(/<meta name="robots" content="[^"]*">/,`<meta name="robots" content="${publicRelease?'index, follow, max-image-preview:large':'noindex, nofollow'}">`)
    .replaceAll('href="index.html','href="/').replaceAll('href="shawn-melanson.html','href="/shawn-melanson');
}
export async function compilePages({origin=defaultOrigin,publicRelease=false}={}) {
  const files=new Map();
  for (const page of pages) {
    let html=page.source?await readFile(join(root,page.source),'utf8'):renderPage(page,origin);
    if (page.route==='/shawn-melanson') html=html.replace(/<!-- PROFILE CATALOG START -->[\s\S]*?<!-- PROFILE CATALOG END -->/,`<!-- PROFILE CATALOG START -->\n${renderProfileCatalog()}\n<!-- PROFILE CATALOG END -->`);
    if (page.route==='/') for (const kind of ['adult','kids','open']) {
      const expression=new RegExp(`(<div[^>]*id="panel-${kind}"[^>]*>)[\\s\\S]*?(?=\\n          <\\/div>)`);
      html=html.replace(expression,`$1\n${scheduleRows(kind,true)}`);
    }
    html=prepareHTML(html,origin,publicRelease);
    if (!html.includes('rel="canonical"') || !html.includes('application/ld+json')) throw new Error(`Missing SEO metadata: ${page.route}`);
    files.set(page.output,html);
  }
  return files;
}
export const robotsText = (origin,publicRelease) => `# Allow crawlers to read the page level indexing directive.\nUser-agent: *\nAllow: /\n${publicRelease?`Sitemap: ${origin}/sitemap.xml\n`:''}`;
export const sitemapText = (origin,publicRelease) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicRelease?pages.map(page=>`  <url><loc>${origin}${page.route}</loc></url>`).join('\n')+'\n':''}</urlset>\n`;
async function copyAssets(output,folder,allowed) {
  for (const entry of await readdir(join(root,folder),{withFileTypes:true})) {
    if (!entry.isFile() || !allowed.test(entry.name)) continue;
    const destination=join(output,folder,entry.name);
    if (relative(output,destination).startsWith('..')) throw new Error('Asset outside output.');
    await mkdir(dirname(destination),{recursive:true});
    await copyFile(join(root,folder,entry.name),destination);
  }
}
export async function buildSite(env=process.env) {
  const output=resolve(root,'dist');
  // Only this fixed generated folder can be cleared. Never accept a caller supplied target.
  if (output!==join(root,'dist') || relative(root,output)!=='dist') throw new Error('Unexpected build output.');
  const origin=siteOrigin(env.SITE_URL||defaultOrigin), publicRelease=releaseEnabled(env);
  const files=await compilePages({origin,publicRelease});
  await rm(output,{recursive:true,force:true});
  await mkdir(output,{recursive:true});
  files.set('robots.txt',robotsText(origin,publicRelease));
  files.set('sitemap.xml',sitemapText(origin,publicRelease));
  files.set('llms.txt',(await readFile(join(root,'llms.txt'),'utf8')).replaceAll(defaultOrigin,origin));
  files.set('site.webmanifest',await readFile(join(root,'site.webmanifest'),'utf8'));
  files.set('404.html',prepareHTML(notFound(),origin,false));
  for (const [filename,contents] of files) {
    await mkdir(dirname(join(output,filename)),{recursive:true});
    await writeFile(join(output,filename),contents);
  }
  await copyAssets(output,'Gym pics',/\.(webp|png|jpe?g)$/i);
  await copyAssets(output,'Video',/\.mp4$/i);
  await copyAssets(output,'review-assets',/\.(svg|webp|png|jpe?g|vtt)$/i);
  await copyAssets(output,'site-assets',/\.(svg|webp|png|jpe?g|vtt|css|js)$/i);
  console.log(`Built ${pages.length} pages in dist. Indexing: ${publicRelease?'public release enabled':'review protection enabled'}.`);
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) await buildSite();
